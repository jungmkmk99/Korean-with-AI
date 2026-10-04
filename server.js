/* Railway 배포용 서버 — 정적 페이지를 보여 주고, 사이트에서 생기는 데이터(신청서·출석·과제·투표·공지·설정·승인)를 저장합니다.
   저장 위치
   - DATABASE_URL 환경 변수가 있으면 PostgreSQL (Railway에서 Postgres를 연결하면 자동으로 들어옴, 권장)
   - 없으면 DATA_DIR(기본: ./data) 폴더의 JSON 파일. Railway에서는 볼륨을 붙여야 재배포 후에도 남습니다.
   PORT는 Railway가 자동 지정합니다. */
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");
const express = require("express");

const SESSION_HOURS = 24 * 30; // 관리자 로그인 유지 기간(30일)

/* ================= 저장소 ================= */
function pgStore(url) {
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: url,
    // Railway 내부 주소(*.railway.internal)는 SSL 없이, 외부 주소는 SSL로 연결
    ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false }
  });
  const hrs = (h) => String(h);
  return {
    kind: "PostgreSQL",
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS docs (
          path       TEXT PRIMARY KEY,
          col        TEXT NOT NULL,
          data       JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS docs_col_idx ON docs (col);
        CREATE TABLE IF NOT EXISTS admin_sessions (
          token      TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    },
    async get(p) { const r = await pool.query("SELECT data FROM docs WHERE path = $1", [p]); return r.rowCount ? r.rows[0].data : null; },
    async put(p, col, data) {
      await pool.query(
        "INSERT INTO docs (path, col, data, updated_at) VALUES ($1, $2, $3, now()) ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
        [p, col, data]
      );
    },
    async del(p) { await pool.query("DELETE FROM docs WHERE path = $1", [p]); },
    async list(col) { const r = await pool.query("SELECT path, data FROM docs WHERE col = $1 ORDER BY updated_at", [col]); return r.rows; },
    async hasSession(t, h) { const r = await pool.query("SELECT 1 FROM admin_sessions WHERE token = $1 AND created_at > now() - ($2 || ' hours')::interval", [t, hrs(h)]); return r.rowCount > 0; },
    async addSession(t, h) {
      await pool.query("DELETE FROM admin_sessions WHERE created_at < now() - ($1 || ' hours')::interval", [hrs(h)]);
      await pool.query("INSERT INTO admin_sessions (token) VALUES ($1)", [t]);
    },
    async delSession(t) { await pool.query("DELETE FROM admin_sessions WHERE token = $1", [t]); }
  };
}

function fileStore(dir) {
  const file = path.join(dir, "site-data.json");
  let state = { docs: {}, sessions: {} }, timer = null;
  const flush = () => {
    timer = null;
    const tmp = file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, file);
  };
  const save = () => { if (!timer) timer = setTimeout(flush, 200); };
  process.on("SIGTERM", () => { if (timer) { clearTimeout(timer); flush(); } process.exit(0); });
  return {
    kind: "JSON 파일 (" + file + ")",
    async init() {
      fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(file)) state = Object.assign({ docs: {}, sessions: {} }, JSON.parse(fs.readFileSync(file, "utf8")));
    },
    async get(p) { return state.docs[p] ? state.docs[p].data : null; },
    async put(p, col, data) { state.docs[p] = { col, data, at: Date.now() }; save(); },
    async del(p) { delete state.docs[p]; save(); },
    async list(col) {
      return Object.keys(state.docs).filter((p) => state.docs[p].col === col)
        .sort((a, b) => state.docs[a].at - state.docs[b].at).map((p) => ({ path: p, data: state.docs[p].data }));
    },
    async hasSession(t, h) { const at = state.sessions[t]; return !!at && Date.now() - at < h * 3600e3; },
    async addSession(t, h) {
      Object.keys(state.sessions).forEach((k) => { if (Date.now() - state.sessions[k] >= h * 3600e3) delete state.sessions[k]; });
      state.sessions[t] = Date.now(); save();
    },
    async delSession(t) { delete state.sessions[t]; save(); }
  };
}

const store = process.env.DATABASE_URL
  ? pgStore(process.env.DATABASE_URL)
  : fileStore(process.env.DATA_DIR || path.join(__dirname, "data"));

/* ================= 경로 · 권한 ================= */
const SEG = /^[A-Za-z0-9_-]{1,80}$/;
const OWNED = ["roster", "poll", "attendance", "submissions", "applications"]; // 수강생 본인만 쓰는 모음
const PUBLIC_COLS = ["poll", "notices"];                                       // 누구나 목록을 읽을 수 있는 모음
const PUBLIC_DOCS = ["site/config"];                                           // 누구나 읽을 수 있는 문서(주차별 자료 · 영상은 승인된 사람에게만)

const segs = (p) => String(p || "").split("/");
const validPath = (p, docPath) => { const s = segs(p); return s.length <= 6 && s.every((x) => SEG.test(x)) && (s.length % 2 === 0) === docPath; };
const colOf = (p) => segs(p).slice(0, -1).join("/");
const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const norm = (s) => String(s || "").replace(/\s+/g, "");

/* 브라우저마다 만든 비밀 키로 수강생 식별자를 계산 (식별자만 알아서는 남의 기록을 쓸 수 없음) */
function clientUid(req) {
  const key = req.get("X-Client-Key") || "";
  return key.length >= 16 && key.length <= 128 ? "u" + sha256("akd-client::" + key).slice(0, 24) : null;
}
async function isAdmin(req) {
  if (req._admin !== undefined) return req._admin;
  const t = req.get("X-Admin-Token");
  req._admin = !!t && t.length === 64 && (await store.hasSession(t, SESSION_HOURS));
  return req._admin;
}
/* 관리자 승인: approvals/<학번> 문서가 있고, 이 브라우저의 로그인·신청서 이름이 같으면 승인된 수강생 */
async function approval(req) {
  if (req._approval) return req._approval;
  const uid = clientUid(req), out = { approved: false, studentId: null };
  if (uid) {
    const recs = (await Promise.all([store.get("roster/" + uid), store.get("applications/" + uid)])).filter((r) => r && r.studentId);
    for (const r of recs) {
      out.studentId = out.studentId || String(r.studentId);
      if (!SEG.test(String(r.studentId))) continue;
      const a = await store.get("approvals/" + r.studentId);
      if (a && (!a.name || norm(a.name) === norm(r.name))) { out.approved = true; out.studentId = String(r.studentId); break; }
    }
  }
  req._approval = out;
  return out;
}
const ownsPath = (p, uid) => { const s = segs(p); return !!uid && OWNED.includes(s[0]) && s[1] === uid; };

async function canReadDoc(req, p) { return PUBLIC_DOCS.includes(p) || ownsPath(p, clientUid(req)) || isAdmin(req); }
async function canWriteDoc(req, p) { return ownsPath(p, clientUid(req)) || isAdmin(req); }
async function canList(req, col) {
  if (PUBLIC_COLS.includes(col)) return true;
  if (segs(col).length > 1 && ownsPath(col, clientUid(req))) return true; // 본인 하위 모음(예: 과제 파일 조각)
  return isAdmin(req);
}
async function seesWeeks(req) { return (await isAdmin(req)) || (await approval(req)).approved; }

/* ================= 설정 (assets/config.js · 공유 저장소의 수정본) ================= */
function fileConfig() {
  try {
    const win = {};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "assets", "config.js"), "utf8"), { window: win });
    return win.SITE_CONFIG || null;
  } catch (e) { return null; }
}
async function sharedConfig() {
  const d = await store.get("site/config");
  if (d && d.json) { try { return JSON.parse(d.json); } catch (e) {} }
  return null;
}
/* 주차별 강의 계획은 누구나 보지만, 구글 드라이브 자료 · 참고 영상은 승인된 수강생과 관리자에게만 보냄 */
function redact(cfg) {
  if (!cfg || !cfg.curriculum || !Array.isArray(cfg.curriculum.weeks)) return cfg;
  const c = JSON.parse(JSON.stringify(cfg));
  c.curriculum.weeks = c.curriculum.weeks.map((w) => {
    const x = Object.assign({}, w || {});
    x.hasRefs = ((x.materials || []).length + (x.videos || []).length) > 0; // 자료가 있는 주차에만 잠금 안내를 보이기 위함
    delete x.materials; delete x.videos;
    x.restricted = true;
    return x;
  });
  return c;
}
async function currentAdmin() {
  const s = await sharedConfig();
  if (s && s.admin && s.admin.passwordHash) return s.admin;
  const f = fileConfig();
  return (f && f.admin) || null;
}
const fails = new Map(); // ip -> { n, until }

/* ================= 앱 ================= */
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ code: "server_error" }); });
const deny = (res) => res.status(403).json({ code: "invalid_argument" });
const bad = (res) => res.status(400).json({ code: "bad_path" });
app.use("/api", (req, res, next) => { res.set("Cache-Control", "no-store"); next(); });

app.get("/api/me", wrap(async (req, res) => {
  const a = await approval(req);
  res.json({ uid: clientUid(req), admin: await isAdmin(req), approved: a.approved, studentId: a.studentId });
}));

/* 지금 적용할 사이트 설정: 공유 수정본이 있으면 그것, 없으면 config.js. 승인 전이면 주차별 자료 · 영상은 빠짐 */
app.get("/api/config", wrap(async (req, res) => {
  let cfg = await sharedConfig(), source = "shared";
  if (!cfg) { cfg = fileConfig(); source = "file"; }
  const full = await seesWeeks(req);
  res.json({ source, full, json: JSON.stringify(full ? cfg : redact(cfg)) });
}));

app.get("/api/doc", wrap(async (req, res) => {
  const p = req.query.path;
  if (!validPath(p, true)) return bad(res);
  if (!(await canReadDoc(req, p))) return deny(res);
  let data = await store.get(p);
  if (data && p === "site/config" && data.json && !(await seesWeeks(req))) {
    try { data = Object.assign({}, data, { json: JSON.stringify(redact(JSON.parse(data.json))) }); } catch (e) {}
  }
  res.json(data ? { exists: true, data } : { exists: false, data: null });
}));

app.put("/api/doc", wrap(async (req, res) => {
  const p = req.query.path, data = req.body && req.body.data;
  if (!validPath(p, true)) return bad(res);
  if (data == null || typeof data !== "object") return res.status(400).json({ code: "bad_data" });
  if (!(await canWriteDoc(req, p))) return deny(res);
  await store.put(p, colOf(p), data);
  res.json({ ok: true });
}));

app.delete("/api/doc", wrap(async (req, res) => {
  const p = req.query.path;
  if (!validPath(p, true)) return bad(res);
  if (!(await canWriteDoc(req, p))) return deny(res);
  await store.del(p);
  res.json({ ok: true });
}));

app.get("/api/col", wrap(async (req, res) => {
  const c = req.query.path;
  if (!validPath(c, false)) return bad(res);
  if (!(await canList(req, c))) return deny(res);
  const rows = await store.list(c);
  res.json(rows.map((x) => ({ id: segs(x.path).pop(), data: x.data })));
}));

app.post("/api/admin/login", wrap(async (req, res) => {
  const ip = req.ip, f = fails.get(ip) || { n: 0, until: 0 };
  if (Date.now() < f.until) return res.status(429).json({ code: "locked" });
  const pw = String((req.body && req.body.password) || "");
  const a = await currentAdmin();
  const want = Buffer.from((a && a.passwordHash) || "", "utf8");
  const got = Buffer.from(sha256(((a && a.salt) || "") + "::" + pw), "utf8");
  if (!pw || !want.length || want.length !== got.length || !crypto.timingSafeEqual(want, got)) {
    f.n++; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 30000; } fails.set(ip, f);
    return res.status(401).json({ code: "wrong_password" });
  }
  fails.delete(ip);
  const token = crypto.randomBytes(32).toString("hex");
  await store.addSession(token, SESSION_HOURS);
  res.json({ token, hours: SESSION_HOURS });
}));

app.post("/api/admin/logout", wrap(async (req, res) => {
  const t = req.get("X-Admin-Token");
  if (t) await store.delSession(t);
  res.json({ ok: true });
}));

app.use("/api", (req, res) => res.status(404).json({ code: "not_found" }));

/* config.js는 주차별 자료 · 영상을 뺀 사본으로 공개 (전체 내용은 승인된 수강생·관리자에게 /api/config로 전달) */
app.get("/assets/config.js", (req, res) => {
  const cfg = fileConfig();
  if (!cfg) return res.status(500).type("application/javascript").send("/* config.js를 읽지 못했습니다. */");
  res.set("Cache-Control", "no-store").type("application/javascript").send("window.SITE_CONFIG = " + JSON.stringify(redact(cfg)) + ";\n");
});
/* 정적 파일: index.html과 assets 폴더만 공개 (server.js 등 서버 파일은 숨김) */
app.use("/assets", express.static(path.join(__dirname, "assets"), { maxAge: "1h" }));
app.get(["/", "/index.html"], (req, res) => res.set("Cache-Control", "no-cache").sendFile(path.join(__dirname, "index.html")));
app.use((req, res) => res.status(404).send("Not found"));

const PORT = process.env.PORT || 3000;
store.init()
  .then(() => app.listen(PORT, () => console.log("서버 실행 중: 포트 " + PORT + " · 저장소: " + store.kind)))
  .catch((e) => { console.error("저장소 준비 실패:", e); process.exit(1); });
