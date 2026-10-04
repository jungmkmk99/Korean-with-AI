/* 관리자 모드 · 공지사항 — 내용은 config.js에서 읽어 옵니다. 보통은 이 파일을 고칠 필요가 없습니다.
   - 오른쪽 위 자물쇠를 누르고 비밀번호를 입력하면 관리자 화면이 열립니다.
   - 비밀번호는 config.js에 '해시(되돌릴 수 없는 암호화 값)'로만 들어 있습니다. */
(function () {
  if (!window.SITE_CONFIG || !window.SITE_STORE) return;
  var Store = window.SITE_STORE;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var RT = function () { return window.SITE_RUNTIME; };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var fmtAt = function (iso) { if (!iso) return ""; var d = new Date(iso); return d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); };

  /* ================= SHA-256 (비밀번호 확인용) ================= */
  function sha256(str) {
    var rr = function (v, a) { return (v >>> a) | (v << (32 - a)); };
    var K = [], H = [], n = 0, comp = {};
    for (var c = 2; n < 64; c++) {
      if (!comp[c]) {
        for (var i = 0; i < 313; i += c) comp[i] = c;
        if (n < 8) H[n] = (Math.pow(c, 0.5) * 0x100000000) | 0;
        K[n++] = (Math.pow(c, 1 / 3) * 0x100000000) | 0;
      }
    }
    var bytes = new TextEncoder().encode(str), l = bytes.length;
    var buf = new Uint8Array(((l + 9 + 63) >> 6) << 6); buf.set(bytes); buf[l] = 0x80;
    var dv = new DataView(buf.buffer), bits = l * 8;
    dv.setUint32(buf.length - 4, bits >>> 0); dv.setUint32(buf.length - 8, Math.floor(bits / 0x100000000));
    var h = H.slice(0), w = new Array(64);
    for (var j = 0; j < buf.length; j += 64) {
      for (i = 0; i < 16; i++) w[i] = dv.getUint32(j + i * 4);
      for (i = 16; i < 64; i++) {
        var a15 = w[i - 15], a2 = w[i - 2];
        w[i] = (w[i - 16] + (rr(a15, 7) ^ rr(a15, 18) ^ (a15 >>> 3)) + w[i - 7] + (rr(a2, 17) ^ rr(a2, 19) ^ (a2 >>> 10))) | 0;
      }
      var A = h[0], B = h[1], Cc = h[2], D = h[3], E = h[4], F = h[5], G = h[6], Hh = h[7];
      for (i = 0; i < 64; i++) {
        var t1 = (Hh + (rr(E, 6) ^ rr(E, 11) ^ rr(E, 25)) + ((E & F) ^ (~E & G)) + K[i] + w[i]) | 0;
        var t2 = ((rr(A, 2) ^ rr(A, 13) ^ rr(A, 22)) + ((A & B) ^ (A & Cc) ^ (B & Cc))) | 0;
        Hh = G; G = F; F = E; E = (D + t1) | 0; D = Cc; Cc = B; B = A; A = (t1 + t2) | 0;
      }
      h[0] = (h[0] + A) | 0; h[1] = (h[1] + B) | 0; h[2] = (h[2] + Cc) | 0; h[3] = (h[3] + D) | 0;
      h[4] = (h[4] + E) | 0; h[5] = (h[5] + F) | 0; h[6] = (h[6] + G) | 0; h[7] = (h[7] + Hh) | 0;
    }
    return h.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }
  var hashPw = function (salt, pw) { return sha256(salt + "::" + pw); };
  window.__sha256 = sha256;

  /* ================= 파일 저장 · 읽기 ================= */
  var SAFE_EXT = ["gif", "png", "jpg", "jpeg", "webp", "mp4", "webm", "txt", "json", "md", "docx", "pptx", "epub", "csv", "ttf", "html", "svg", "pdf", "xlsx", "zip"];
  function saveFile(filename, data) {
    var viaAnchor = function () {
      var blob = data instanceof Blob ? data : new Blob([data], { type: "application/octet-stream" });
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
      return Promise.resolve("saved");
    };
    if (window.claude && typeof window.claude.use === "function") {
      return window.claude.use("downloads").then(function (d) {
        if (!d) throw { code: "unavailable" };
        return d.save({ filename: filename, data: data });
      });
    }
    return viaAnchor();
  }
  function saveErr(e) {
    var c = e && e.code;
    if (c === "declined") return "내려받기를 취소했습니다.";
    if (c === "rejected_extension") return "이 형식의 파일은 여기서 바로 내려받을 수 없습니다.";
    if (c === "unavailable" || c === "not_granted") return "이 화면에서는 파일을 내려받을 수 없습니다.";
    return "파일을 저장하지 못했습니다.";
  }
  function csv(rows) {
    return "﻿" + rows.map(function (r) {
      return r.map(function (v) { v = v == null ? "" : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",");
    }).join("\r\n");
  }
  function readText(file) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = rej; r.readAsText(file, "utf-8"); });
  }
  var stamp = function () { var d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); };
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = function () { res(window.JSZip); }; s.onerror = function () { rej({ code: "zip" }); };
      document.head.appendChild(s);
    });
  }

  /* ================= 설정 저장 (공유 저장소 또는 이 브라우저) ================= */
  function applyConfig(cfg, persist) {
    window.SITE_CONFIG = cfg;
    if (window.renderSite) window.renderSite();
    if (window.SITE_PART) window.SITE_PART.redraw();
    drawLockState();
    loadNotices();
    if (!persist) return Promise.resolve();
    var json = JSON.stringify(cfg);
    if (Store.mode() === "cloud") return Store.set("site/config", { json: json, rev: Date.now(), at: new Date().toISOString() });
    try { localStorage.setItem("akd:configOverride", json); } catch (e) { return Promise.reject({ code: "storage" }); }
    return Promise.resolve();
  }
  function resetConfig() {
    var base = clone(window.SITE_CONFIG_FILE);
    var p = Store.mode() === "cloud" ? Store.del("site/config") : (function () { try { localStorage.removeItem("akd:configOverride"); } catch (e) {} return Promise.resolve(); })();
    return p.then(function () { return applyConfig(base, false); });
  }
  function configFileText(cfg) {
    return "/* ==========================================================\n" +
      "   사이트 설정 파일 (config.js) — 관리자 모드에서 저장함 (" + fmtAt(new Date().toISOString()) + ")\n" +
      "   이 파일로 assets/config.js를 바꾸면 수정 내용이 사이트에 적용됩니다.\n" +
      "   ========================================================== */\n\n" +
      "window.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }
  function parseConfigText(text) {
    var t = text.replace(/^﻿/, "").trim();
    try { return JSON.parse(t); } catch (e) {}
    try { return JSON.parse(t.replace(/^[\s\S]*?window\.SITE_CONFIG\s*=\s*/, "").replace(/;\s*$/, "")); } catch (e) {}
    try { var w = {}; new Function("window", t)(w); return w.SITE_CONFIG; } catch (e) {}
    return null;
  }

  /* ================= 공지사항 (방문자 화면) ================= */
  var notices = [], noticeUnsub = null, showAllNotices = false;
  function drawNotices() {
    var sec = $("#notices"), mount = $("#noticeMount");
    if (!sec || !mount) return;
    var list = notices.slice().sort(function (a, b) { return (b.data.important ? 1 : 0) - (a.data.important ? 1 : 0) || String(b.data.at).localeCompare(String(a.data.at)); });
    sec.hidden = !list.length;
    if (!list.length) { mount.innerHTML = ""; return; }
    var shown = showAllNotices ? list : list.slice(0, 3);
    mount.innerHTML = '<div class="notice-head"><h2>공지사항</h2>' + (list.length > 3 ? '<button type="button" class="text-btn" id="ntMore">' + (showAllNotices ? "접기" : "공지 " + list.length + "개 모두 보기") + "</button>" : "") + "</div>" +
      '<ul class="notice-list">' + shown.map(function (n) {
        return '<li class="card notice' + (n.data.important ? " important" : "") + '">' +
          '<div class="notice-meta">' + (n.data.important ? '<span class="chip now">중요</span>' : '<span class="chip task">공지</span>') + "<time>" + esc(fmtAt(n.data.at)) + "</time></div>" +
          "<h3>" + esc(n.data.title) + '</h3><p>' + esc(n.data.body) + "</p></li>";
      }).join("") + "</ul>";
    var m = $("#ntMore"); if (m) m.addEventListener("click", function () { showAllNotices = !showAllNotices; drawNotices(); });
  }
  function loadNotices() {
    if (!Store.uid() && Store.mode() !== "local") { drawNotices(); return; }
    if (noticeUnsub) { drawNotices(); return; }
    noticeUnsub = Store.watchCollection("notices", function (list) { notices = list.filter(function (n) { return n.data; }); drawNotices(); if (panelOpen && tab === "notice") drawTab(); });
  }

  /* ================= 자물쇠 · 로그인 ================= */
  var isAdmin = false;
  try { isAdmin = sessionStorage.getItem("akd:admin") === (window.SITE_CONFIG.admin || {}).passwordHash; } catch (e) {}
  function drawLockState() {
    var b = $("#lockBtn"); if (!b) return;
    b.classList.toggle("on", isAdmin);
    b.setAttribute("aria-label", isAdmin ? "관리자 화면 열기" : "관리자 로그인");
    b.innerHTML = isAdmin
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 7.6-1.7"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
  }
  var fails = 0, lockUntil = 0;
  function openLogin() {
    if (isAdmin) { openPanel(); return; }
    var back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<form class="modal card admin-login" role="dialog" aria-modal="true" aria-labelledby="alTitle" novalidate>' +
      '<button type="button" class="modal-x" aria-label="닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<span class="badge"><span class="badge-dot"></span>교수자 전용</span>' +
      '<h2 id="alTitle">관리자 로그인</h2><p>관리자 비밀번호를 입력하세요.</p>' +
      '<label class="lbl" for="alPw">비밀번호</label><input type="password" id="alPw" autocomplete="current-password">' +
      '<p class="form-err" id="alErr" role="alert"></p>' +
      '<button type="submit" class="btn primary" style="margin-top:14px">관리자 화면 열기</button></form>';
    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add("in"); });
    var pw = $("#alPw", back); pw.focus();
    var close = function () { back.classList.remove("in"); setTimeout(function () { back.remove(); }, 250); document.removeEventListener("keydown", onKey); $("#lockBtn").focus(); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    $(".modal-x", back).addEventListener("click", close);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    $("form", back).addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#alErr", back), now = Date.now();
      if (now < lockUntil) { err.textContent = Math.ceil((lockUntil - now) / 1000) + "초 뒤에 다시 시도해 주세요."; return; }
      if (!pw.value) { err.textContent = "비밀번호를 입력해 주세요."; return; }
      var A = window.SITE_CONFIG.admin || {};
      if (A.passwordHash && hashPw(A.salt || "", pw.value) === A.passwordHash) {
        isAdmin = true; fails = 0;
        try { sessionStorage.setItem("akd:admin", A.passwordHash); } catch (x) {}
        drawLockState(); back.remove(); document.removeEventListener("keydown", onKey); openPanel();
      } else {
        fails++; pw.select();
        if (fails >= 5) { lockUntil = now + 30000; fails = 0; err.textContent = "비밀번호가 5번 틀려 30초 동안 입력할 수 없습니다."; }
        else err.textContent = "비밀번호가 맞지 않습니다. (" + fails + "/5)";
      }
    });
  }

  /* ================= 관리자 데이터 ================= */
  var D = null, loading = null;
  function loadAll() {
    loading = Promise.all([
      Store.list("roster"), Store.list("applications"), Store.list("attendance"), Store.list("submissions"),
      Store.list("poll"), Store.get("admin/students")
    ]).then(function (r) {
      D = { roster: r[0], apps: r[1], attend: r[2], subs: r[3], poll: r[4], students: (r[5] && r[5].list) || [], at: new Date() };
      return D;
    }, function () { D = { roster: [], apps: [], attend: [], subs: [], poll: [], students: [], at: new Date(), error: true }; return D; });
    return loading;
  }
  /* 학번 기준으로 한 사람의 정보를 합칩니다. */
  function people() {
    var map = {}, order = [];
    var get = function (id) { if (!map[id]) { map[id] = { studentId: id, name: "", dept: "", listed: false, uids: [] }; order.push(id); } return map[id]; };
    D.students.forEach(function (s) { var p = get(s.studentId); p.listed = true; p.name = s.name; p.dept = s.dept || ""; });
    D.roster.forEach(function (r) { if (!r.data || !r.data.studentId) return; var p = get(r.data.studentId); p.loggedIn = true; p.name = p.name || r.data.name; if (p.uids.indexOf(r.id) < 0) p.uids.push(r.id); });
    D.apps.forEach(function (a) { if (!a.data || !a.data.studentId) return; var p = get(a.data.studentId); p.app = a.data; p.name = p.name || a.data.name; p.dept = p.dept || a.data.dept || ""; });
    D.attend.forEach(function (a) { if (!a.data || !a.data.studentId) return; var p = get(a.data.studentId); p.att = Object.assign(p.att || {}, a.data.records || {}); p.name = p.name || a.data.name; });
    D.subs.forEach(function (s) {
      if (!s.data || !s.data.studentId) return; var p = get(s.data.studentId); p.name = p.name || s.data.name;
      p.subs = p.subs || {};
      Object.keys(s.data.items || {}).forEach(function (k) { var it = Object.assign({ uid: s.id }, s.data.items[k]); if (!p.subs[k] || p.subs[k].at < it.at) p.subs[k] = it; });
    });
    return order.map(function (k) { return map[k]; }).sort(function (a, b) { return a.studentId.localeCompare(b.studentId); });
  }
  function allSessions() { return RT().sessions || []; }
  function heldSessions() { var t = new Date(); t.setHours(23, 59, 59, 0); return allSessions().filter(function (s) { return !s.holiday && s.date <= t; }); }
  var failN = function () { return ((window.SITE_CONFIG.participate || {}).attendance || {}).failAbsences || 0; };
  var listedTag = function (p) { return p.listed ? '<span class="chip task">명단</span>' : '<span class="chip past" title="등록한 수강생 명단에 없는 학번">명단 외</span>'; };

  /* ================= 패널 ================= */
  var panelOpen = false, tab = "dash", draft = null, edSection = "site", dirty = false;
  var TABS = [
    ["dash", "한눈에 보기"], ["content", "섹션 관리"], ["notice", "공지 올리기"], ["students", "수강생 명단"], ["apply", "수강 신청 내역"],
    ["attend", "출석 현황"], ["assign", "과제 제출 현황"], ["edit", "사이트 내용 편집"], ["settings", "설정 파일 · 비밀번호"]
  ];
  function openPanel() {
    if (panelOpen) return;
    panelOpen = true;
    draft = clone(window.SITE_CONFIG); dirty = false;
    var el = document.createElement("div");
    el.className = "admin"; el.id = "adminPanel";
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "관리자 화면");
    var modeLabel = Store.mode() === "cloud" ? "공유 저장소 연결됨" : Store.mode() === "local" ? "체험 모드 · 이 브라우저 데이터" : "저장소 연결 안 됨";
    el.innerHTML =
      '<div class="admin-top"><div class="admin-title"><strong>관리자 화면</strong><span class="chip ' + (Store.mode() === "cloud" ? "task" : "past") + '">' + modeLabel + "</span></div>" +
        '<div class="admin-actions"><button type="button" class="btn ghost sm" id="admReload">새로 불러오기</button><button type="button" class="btn ghost sm" id="admLogout">로그아웃</button>' +
        '<button type="button" class="modal-x adm-x" id="admClose" aria-label="관리자 화면 닫기"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>' +
      '<div class="admin-body"><nav class="admin-tabs" role="tablist" aria-label="관리 메뉴">' + TABS.map(function (t) {
          return '<button type="button" role="tab" id="tab-' + t[0] + '" data-tab="' + t[0] + '" aria-selected="false">' + t[1] + "</button>";
        }).join("") + '</nav><div class="admin-main" id="admMain" role="tabpanel" tabindex="-1"></div></div>' +
      '<div class="adm-toast" id="admToast" role="status" aria-live="polite"></div>';
    document.body.appendChild(el);
    document.documentElement.classList.add("admin-open");
    $("#admClose").addEventListener("click", closePanel);
    $("#admLogout").addEventListener("click", function () {
      isAdmin = false; try { sessionStorage.removeItem("akd:admin"); } catch (e) {}
      closePanel(); drawLockState();
    });
    $("#admReload").addEventListener("click", function () { loadAll().then(drawTab); toast("최신 내용을 불러왔습니다."); });
    $(".admin-tabs", el).addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) { tab = b.dataset.tab; drawTab(); } });
    $(".admin-tabs", el).addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var i = TABS.findIndex(function (t) { return t[0] === tab; }), d = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : -1;
      tab = TABS[(i + d + TABS.length) % TABS.length][0]; drawTab(); $("#tab-" + tab).focus();
    });
    document.addEventListener("keydown", panelKey);
    $("#admMain").innerHTML = '<p class="loading">불러오는 중…</p>';
    loadAll().then(drawTab);
    $("#tab-" + tab).focus();
  }
  function panelKey(e) { if (e.key === "Escape" && !document.querySelector(".modal-back")) closePanel(); }
  function closePanel() {
    var el = $("#adminPanel"); if (el) el.remove();
    panelOpen = false; document.documentElement.classList.remove("admin-open");
    document.removeEventListener("keydown", panelKey);
    var b = $("#lockBtn"); if (b) b.focus();
  }
  var toastTimer;
  function toast(msg) { var t = $("#admToast"); if (!t) return; t.textContent = msg; t.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("on"); }, 2600); }
  function modeHint() {
    if (Store.mode() === "local") return '<p class="mode-note">' + "<span><b>체험 모드</b> · 컴퓨터에서 파일을 직접 열었기 때문에 이 브라우저에 저장된 참여 내용만 보입니다. 사이트 편집 내용도 이 브라우저에만 적용되므로, 다른 곳에 반영하려면 ‘설정 파일’ 메뉴에서 config.js로 저장하세요.</span></p>";
    if (Store.mode() === "cloud" && !Store.canEdit()) return '<p class="mode-note warn"><span>이 계정은 이 페이지의 편집 권한이 없어 수강생 기록을 볼 수 없습니다. 페이지 소유자 계정으로 열어 주세요.</span></p>';
    if (Store.mode() !== "cloud") return '<p class="mode-note warn"><span>저장소에 연결되지 않았습니다. claude.ai에 로그인한 상태로 페이지를 열어 주세요.</span></p>';
    return "";
  }
  function dlBtn(id, label) { return '<button type="button" class="btn ghost sm dl" id="' + id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>' + (label || "엑셀(CSV)로 내려받기") + "</button>"; }
  function bar(title, right) { return '<div class="adm-bar"><h2>' + title + '</h2><div class="adm-bar-r">' + (right || "") + "</div></div>"; }
  function table(head, rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<p class="adm-empty">' + (opts.empty || "아직 기록이 없습니다.") + "</p>";
    return '<div class="tbl-wrap"><table class="adm-tbl' + (opts.cls ? " " + opts.cls : "") + '"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + h + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + c + "</th>" : "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function onDl(id, filename, rowsFn) {
    var b = $("#" + id); if (!b) return;
    b.addEventListener("click", function () {
      saveFile(filename, csv(rowsFn())).then(function (r) { if (r !== "declined") toast(filename + " 파일을 저장했습니다."); }, function (e) { toast(saveErr(e)); });
    });
  }

  function drawTab() {
    if (!panelOpen) return;
    $$(".admin-tabs [data-tab]").forEach(function (b) { var on = b.dataset.tab === tab; b.classList.toggle("on", on); b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
    var main = $("#admMain");
    if (!D) { main.innerHTML = '<p class="loading">불러오는 중…</p>'; return; }
    ({ dash: tDash, content: tContent, notice: tNotice, students: tStudents, apply: tApply, attend: tAttend, assign: tAssign, edit: tEdit, settings: tSettings })[tab](main);
  }

  /* ---- 한눈에 보기 ---- */
  function tDash(main) {
    var ps = people(), held = heldSessions(), last = held[held.length - 1];
    var base = D.students.length || ps.length;
    var lastAtt = last ? ps.filter(function (p) { return p.att && p.att[last.id]; }).length : 0;
    var now = new Date(), aw = RT().weeks.filter(function (w) { return w.raw.assignment; });
    var lastDue = aw.filter(function (w) { return w.due && w.due <= now; }).pop() || aw[0];
    var lastSub = lastDue ? ps.filter(function (p) { return p.subs && p.subs[lastDue.n]; }).length : 0;
    var poll = (window.SITE_CONFIG.participate || {}).poll || { options: [] };
    var counts = {}; poll.options.forEach(function (o) { counts[o.id] = 0; });
    D.poll.forEach(function (v) { if (v.data && counts.hasOwnProperty(v.data.choice)) counts[v.data.choice]++; });
    var total = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);
    var tile = function (n, unit, label, sub) { return '<div class="adm-tile"><span class="adm-n">' + n + "<small>" + unit + "</small></span><b>" + label + "</b>" + (sub ? "<span>" + sub + "</span>" : "") + "</div>"; };
    main.innerHTML = bar("한눈에 보기", '<span class="muted small">' + esc(fmtAt(D.at.toISOString())) + " 기준</span>") + modeHint() +
      '<div class="adm-tiles">' +
        tile(D.students.length, "명", "등록한 수강생 명단", D.students.length ? "" : "‘수강생 명단’에서 등록") +
        tile(D.apps.length, "건", "수강 신청서") +
        tile(ps.filter(function (p) { return p.loggedIn; }).length, "명", "로그인한 수강생") +
        tile(last ? lastAtt + "<small>/" + base + "</small>" : "–", "", last ? last.n + "주차 " + last.day + "요일 출석" : "출석", last ? RT().fmtDay(last.date) : "아직 수업 전") +
        tile(lastDue ? lastSub + "<small>/" + base + "</small>" : "–", "", lastDue ? "과제 제출" : "과제", lastDue ? esc(lastDue.raw.assignment.title) : "") +
        tile(notices.length, "개", "게시한 공지") +
      "</div>" +
      '<div class="adm-card"><div class="adm-bar sm"><h3>투표 결과 · ' + esc(poll.question || "") + '</h3><div class="adm-bar-r">' + dlBtn("dlPoll") + "</div></div>" +
        '<ul class="adm-poll">' + poll.options.map(function (o) {
          var c = counts[o.id], pct = total ? Math.round(c / total * 100) : 0, mx = Math.max.apply(null, poll.options.map(function (x) { return counts[x.id]; }).concat([1]));
          return '<li title="' + esc(o.label) + ": " + c + '표"><span class="ap-l">' + esc(o.label) + '</span><span class="po-track"><span class="po-bar" style="width:' + (c ? Math.max(2, c / mx * 100) : 0) + '%"></span></span><span class="ap-v">' + c + "표 · " + pct + "%</span></li>";
        }).join("") + '</ul><p class="muted small">총 ' + total + "명 참여</p></div>";
    onDl("dlPoll", "투표결과_" + stamp() + ".csv", function () {
      return [["주제", "득표", "비율(%)"]].concat(poll.options.map(function (o) { return [o.label, counts[o.id], total ? Math.round(counts[o.id] / total * 100) : 0]; }));
    });
  }

  /* ---- 공지 ---- */
  function tNotice(main) {
    var list = notices.slice().sort(function (a, b) { return String(b.data.at).localeCompare(String(a.data.at)); });
    main.innerHTML = bar("공지 올리기") + modeHint() +
      '<form class="adm-card adm-form" id="ntForm" novalidate>' +
        '<label class="lbl" for="ntTitle">제목 <span class="req">*</span></label><input type="text" id="ntTitle" maxlength="80" placeholder="예: 10월 6일 수업은 온라인으로 진행합니다">' +
        '<label class="lbl" for="ntBody">내용 <span class="req">*</span></label><textarea id="ntBody" rows="4" placeholder="수강생에게 알릴 내용을 적어 주세요."></textarea>' +
        '<label class="consent"><input type="checkbox" id="ntImp"><span>중요 공지로 맨 위에 고정</span></label>' +
        '<p class="form-err" id="ntErr" role="alert"></p><button type="submit" class="btn primary sm">공지 올리기</button></form>' +
      '<h3 class="adm-h3">올린 공지 ' + list.length + "개</h3>" +
      (list.length ? '<ul class="adm-notices">' + list.map(function (n) {
        return '<li class="adm-card"><div class="notice-meta">' + (n.data.important ? '<span class="chip now">중요</span>' : '<span class="chip task">공지</span>') + "<time>" + esc(fmtAt(n.data.at)) + '</time></div><h4>' + esc(n.data.title) + "</h4><p>" + esc(n.data.body) + '</p><div class="adm-row">' +
          '<button type="button" class="text-btn" data-imp="' + esc(n.id) + '">' + (n.data.important ? "중요 해제" : "중요로 고정") + '</button><button type="button" class="text-btn danger" data-del="' + esc(n.id) + '">삭제</button></div></li>';
      }).join("") + "</ul>" : '<p class="adm-empty">아직 올린 공지가 없습니다. 올린 공지는 사이트 첫 화면 아래에 표시됩니다.</p>');
    $("#ntForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("#ntTitle").value.trim(), b = $("#ntBody").value.trim(), miss = [];
      if (!t) miss.push("제목"); if (!b) miss.push("내용");
      if (miss.length) { $("#ntErr").textContent = miss.join(", ") + "을(를) 입력해 주세요."; (t ? $("#ntBody") : $("#ntTitle")).focus(); return; }
      var id = "n" + Date.now();
      Store.set("notices/" + id, { title: t, body: b, important: $("#ntImp").checked, at: new Date().toISOString() }).then(function () {
        toast("공지를 올렸습니다."); if (Store.mode() === "local") drawTab();
      }, function () { $("#ntErr").textContent = "공지를 저장하지 못했습니다. 편집 권한을 확인해 주세요."; });
    });
    $$("[data-del]", main).forEach(function (d) {
      d.addEventListener("click", function () {
        if (d.dataset.confirm !== "1") { d.dataset.confirm = "1"; d.textContent = "정말 삭제할까요? 한 번 더 누르세요"; return; }
        Store.del("notices/" + d.dataset.del).then(function () { toast("공지를 삭제했습니다."); drawTab(); });
      });
    });
    $$("[data-imp]", main).forEach(function (im) {
      im.addEventListener("click", function () {
        var n = notices.filter(function (x) { return x.id === im.dataset.imp; })[0]; if (!n) return;
        Store.set("notices/" + n.id, Object.assign({}, n.data, { important: !n.data.important })).then(function () { drawTab(); });
      });
    });
  }

  /* ================= 섹션 관리 (항목 추가·수정·삭제) ================= */
  var cmSection = "weeks", cmEdit = {};
  var DAYS_ALL = ["월", "화", "수", "목", "금", "토"];
  var dueToInput = function (s) { var m = String(s || "").match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/); return m ? m[1] + "T" + m[2] : ""; };
  var inputToDue = function (s) { return s ? String(s).replace("T", " ") : ""; };
  var newId = function (p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };

  /* 입력칸 하나 그리기 */
  function cmField(f, val, pre) {
    var id = pre + f.key, req = f.required ? ' <span class="req">*</span>' : "";
    var lab = '<label class="lbl" for="' + id + '">' + esc(f.label) + req + (f.help ? ' <small class="muted">· ' + esc(f.help) + "</small>" : "") + "</label>";
    var wide = ["textarea", "lines", "pairs"].indexOf(f.type) >= 0 || f.wide;
    var ctl;
    if (f.type === "textarea") ctl = '<textarea id="' + id + '" rows="3" placeholder="' + esc(f.placeholder || "") + '">' + esc(val || "") + "</textarea>";
    else if (f.type === "lines") ctl = '<textarea id="' + id + '" rows="' + Math.max(3, (val || []).length + 1) + '" placeholder="' + esc(f.placeholder || "한 줄에 하나씩") + '">' + esc((val || []).join("\n")) + "</textarea>";
    else if (f.type === "pairs") ctl = '<textarea id="' + id + '" rows="' + Math.max(2, (val || []).length + 1) + '" placeholder="제목 | https://주소">' + esc((val || []).map(function (v) { return (v.title || "") + " | " + (v.url || ""); }).join("\n")) + "</textarea>";
    else if (f.type === "select") ctl = '<select id="' + id + '">' + (f.empty !== false ? '<option value="">' + esc(f.empty || "선택하세요") + "</option>" : "") + (f.options || []).map(function (o) { var v = typeof o === "object" ? o.value : o, l = typeof o === "object" ? o.label : o; return '<option value="' + esc(v) + '"' + (String(v) === String(val == null ? "" : val) ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("") + "</select>";
    else if (f.type === "checkbox") return '<div class="cm-f"><label class="consent cm-check"><input type="checkbox" id="' + id + '"' + (val ? " checked" : "") + "><span>" + esc(f.label) + (f.help ? ' <small class="muted">· ' + esc(f.help) + "</small>" : "") + "</span></label></div>";
    else if (f.type === "days") return '<div class="cm-f"><span class="lbl">' + esc(f.label) + req + '</span><div class="radios" id="' + id + '">' + DAYS_ALL.map(function (d, i) {
        return '<label class="radio"><input type="checkbox" id="' + id + "-" + i + '" value="' + d + '"' + ((val || []).indexOf(d) >= 0 ? " checked" : "") + "><span>" + d + "</span></label>";
      }).join("") + "</div></div>";
    else {
      var t = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : "text";
      var v = f.type === "datetime" ? dueToInput(val) : (val == null ? "" : val);
      ctl = '<input type="' + t + '" id="' + id + '" value="' + esc(v) + '" placeholder="' + esc(f.placeholder || "") + '"' + (f.type === "number" ? ' step="any"' : "") + ">";
    }
    return '<div class="cm-f' + (wide ? " wide" : "") + '">' + lab + ctl + "</div>";
  }
  function cmRead(f, root, pre) {
    var el = root.querySelector("#" + pre + f.key);
    if (f.type === "days") return DAYS_ALL.filter(function (d, i) { var c = root.querySelector("#" + pre + f.key + "-" + i); return c && c.checked; });
    if (!el) return undefined;
    if (f.type === "checkbox") return el.checked;
    if (f.type === "number") return el.value === "" ? "" : Number(el.value);
    if (f.type === "lines") return el.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (f.type === "pairs") return el.value.split("\n").map(function (l) { var p = l.split("|"); return { title: (p[0] || "").trim(), url: (p.slice(1).join("|") || "").trim() }; }).filter(function (v) { return v.title || v.url; });
    if (f.type === "datetime") return inputToDue(el.value);
    return el.value.trim();
  }
  function cmErrors(fields, v, extra) {
    var errs = [];
    fields.forEach(function (f) {
      var x = v[f.key];
      if (f.required && (x === "" || x == null || (Array.isArray(x) && !x.length))) errs.push([f.key, f.label + "을(를) 입력해 주세요."]);
    });
    return errs.concat(extra ? extra(v) || [] : []);
  }
  function cmShowErr(box, errs, pre) {
    box.innerHTML = "<b>확인할 항목이 " + errs.length + "개 있습니다.</b><ul>" + errs.map(function (e) { return '<li><a href="#' + pre + e[0] + '" data-go="' + pre + e[0] + '">' + esc(e[1]) + "</a></li>"; }).join("") + "</ul>";
    box.hidden = false;
    var first = document.getElementById(pre + errs[0][0]); if (first) first.focus();
    box.querySelectorAll("[data-go]").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); var t = document.getElementById(a.dataset.go); if (t) t.focus(); }); });
  }
  function cmSave(cfg, msg) {
    return applyConfig(cfg, true).then(function () {
      draft = clone(cfg); window.SITE_CONFIG_SOURCE = Store.mode() === "cloud" ? "shared" : "browser"; toast(msg);
    }, function (e) { toast("저장하지 못했습니다. 편집 권한을 확인해 주세요."); throw e; });
  }

  /* 한 덩어리 설정(제목·안내 문구 등) */
  function cmSettings(box, spec) {
    var pre = "cs-" + spec.key + "-", cur = spec.get(window.SITE_CONFIG) || {};
    var el = document.createElement("form");
    el.className = "adm-card cm-block"; el.noValidate = true;
    el.innerHTML = "<h3>" + esc(spec.label) + '</h3><div class="cm-grid">' + spec.fields.map(function (f) { return cmField(f, cur[f.key], pre); }).join("") +
      '</div><div class="err-summary" hidden></div><div class="adm-row"><button type="submit" class="btn primary sm">저장</button>' + (spec.note ? '<span class="muted small">' + esc(spec.note) + "</span>" : "") + "</div>";
    box.appendChild(el);
    el.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {}; spec.fields.forEach(function (f) { v[f.key] = cmRead(f, el, pre); });
      var errs = cmErrors(spec.fields, v, spec.validate), eb = el.querySelector(".err-summary");
      if (errs.length) { cmShowErr(eb, errs, pre); return; }
      eb.hidden = true;
      var cfg = clone(window.SITE_CONFIG); spec.set(cfg, v);
      cmSave(cfg, spec.label + " 저장했습니다.").then(function () { drawTab(); }, function () {});
    });
  }

  /* 목록(추가·수정·삭제·순서) */
  function cmList(box, spec) {
    var pre = "cl-" + spec.key + "-", items = spec.getList(window.SITE_CONFIG) || [], editing = cmEdit[spec.key];
    var wrap = document.createElement("div");
    wrap.className = "adm-card cm-block";
    var formHtml = "";
    if (editing != null) {
      var cur = editing === "new" ? spec.blank() : (spec.toForm ? spec.toForm(items[editing], editing) : items[editing]);
      formHtml = '<form class="cm-form" novalidate><h4>' + (editing === "new" ? "새 " + esc(spec.itemLabel) + " 추가" : esc(spec.itemTitle(items[editing], editing)) + " 수정") + "</h4>" +
        (spec.formNote ? '<p class="muted small">' + esc(spec.formNote) + "</p>" : "") +
        '<div class="cm-grid">' + spec.fields.map(function (f) { return cmField(f, cur[f.key], pre); }).join("") + "</div>" +
        '<div class="err-summary" hidden></div><div class="adm-row"><button type="submit" class="btn primary sm">' + (editing === "new" ? "추가하기" : "수정 내용 저장") + '</button><button type="button" class="btn ghost sm" data-cm="cancel">취소</button></div></form>';
    }
    wrap.innerHTML = '<div class="adm-bar sm"><h3>' + esc(spec.label) + ' <small class="muted">' + items.length + "개</small></h3>" +
      (editing == null ? '<div class="adm-bar-r"><button type="button" class="btn primary sm" data-cm="new">+ ' + esc(spec.itemLabel) + " 추가</button></div>" : "") + "</div>" +
      (spec.note ? '<p class="muted small">' + esc(spec.note) + "</p>" : "") + formHtml +
      (items.length ? '<ol class="cm-list">' + items.map(function (it, i) {
        var locked = spec.locked && spec.locked(it);
        return '<li class="cm-item' + (editing === i ? " on" : "") + '"><div class="cm-item-main"><b>' + esc(spec.itemTitle(it, i)) + "</b>" + (spec.itemSub ? '<span class="muted small">' + spec.itemSub(it, i) + "</span>" : "") + "</div>" +
          '<div class="cm-ops"><button type="button" data-cm="up" data-i="' + i + '"' + (i ? "" : " disabled") + ' aria-label="위로">↑</button><button type="button" data-cm="down" data-i="' + i + '"' + (i < items.length - 1 ? "" : " disabled") + ' aria-label="아래로">↓</button>' +
          '<button type="button" data-cm="edit" data-i="' + i + '">수정</button>' +
          (locked ? '<button type="button" disabled title="' + esc(locked) + '">삭제 불가</button>' : '<button type="button" class="danger" data-cm="del" data-i="' + i + '">삭제</button>') + "</div></li>";
      }).join("") + "</ol>" : '<p class="adm-empty">아직 항목이 없습니다. ‘+ ' + esc(spec.itemLabel) + " 추가’를 눌러 시작하세요.</p>");
    box.appendChild(wrap);
    var form = wrap.querySelector(".cm-form");
    if (form) {
      if (spec.onForm) spec.onForm(form, pre);
      var firstInput = form.querySelector("input,select,textarea"); if (firstInput) firstInput.focus();
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = {}; spec.fields.forEach(function (f) { v[f.key] = cmRead(f, form, pre); });
        var errs = cmErrors(spec.fields, v, spec.validate), eb = form.querySelector(".err-summary");
        if (errs.length) { cmShowErr(eb, errs, pre); return; }
        eb.hidden = true;
        var cfg = clone(window.SITE_CONFIG), list = (spec.getList(cfg) || []).slice();
        var old = editing === "new" ? null : list[editing];
        var item = spec.fromForm ? spec.fromForm(v, old) : Object.assign({}, old || {}, v);
        var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
        (spec.sync ? spec.sync(item, old) : Promise.resolve(item)).then(function (it) {
          if (editing === "new") list.push(it); else list[editing] = it;
          spec.setList(cfg, list);
          return cmSave(cfg, (editing === "new" ? spec.itemLabel + "을(를) 추가했습니다." : "수정했습니다.") + (spec.syncMsg ? spec.syncMsg(it, old) : ""));
        }).then(function () { delete cmEdit[spec.key]; drawTab(); }, function () { btn.disabled = false; eb.innerHTML = "<b>저장하지 못했습니다.</b> 편집 권한을 확인해 주세요."; eb.hidden = false; });
      });
    }
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cm]"); if (!b || b.disabled) return;
      var act = b.dataset.cm, i = +b.dataset.i;
      if (act === "new") { cmEdit[spec.key] = "new"; drawTab(); return; }
      if (act === "cancel") { delete cmEdit[spec.key]; drawTab(); return; }
      if (act === "edit") { cmEdit[spec.key] = i; drawTab(); return; }
      if (act === "del" && b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "한 번 더 누르면 삭제"; return; }
      var cfg = clone(window.SITE_CONFIG), list = (spec.getList(cfg) || []).slice();
      if (act === "del" && spec.sync) {
        var gone = list[i]; list.splice(i, 1); spec.setList(cfg, list); delete cmEdit[spec.key];
        spec.sync(null, gone).then(function () { return cmSave(cfg, "삭제했습니다."); }).then(function () { drawTab(); }, function () {});
        return;
      }
      if (act === "del") list.splice(i, 1);
      if (act === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
      if (act === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      spec.setList(cfg, list);
      delete cmEdit[spec.key];
      cmSave(cfg, act === "del" ? "삭제했습니다." : "순서를 바꿨습니다.").then(function () { drawTab(); }, function () {});
    });
  }

  var CM_SECTIONS = [
    ["weeks", "주차별 강의 계획"], ["calendar", "월간 수업 달력"], ["portfolio", "우수 과제 포트폴리오"],
    ["guide", "수강 안내"], ["participate", "참여하기"], ["faq", "자주 묻는 질문"]
  ];
  var ensure = function (cfg, k, def) { if (!cfg[k]) cfg[k] = def; return cfg[k]; };

  function tContent(main) {
    main.innerHTML = bar("섹션 관리", '<a class="text-btn" href="#" id="cmView">사이트에서 보기</a>') + modeHint() +
      '<p class="muted small">항목을 추가·수정·삭제하면 저장 즉시 사이트에 반영됩니다.' + (Store.mode() === "cloud" ? " 공유 저장소에 저장되어 모든 방문자에게 보입니다." : " 이 브라우저에만 저장되므로, 다른 곳에 반영하려면 ‘설정 파일 · 비밀번호’에서 config.js로 저장하세요.") + "</p>" +
      '<div class="cm-tabs" role="tablist" aria-label="섹션 선택">' + CM_SECTIONS.map(function (s) {
        return '<button type="button" role="tab" data-cms="' + s[0] + '" aria-selected="' + (s[0] === cmSection) + '" class="pf-chip' + (s[0] === cmSection ? " on" : "") + '">' + s[1] + "</button>";
      }).join("") + '</div><div id="cmBody" class="cm-body"></div>';
    main.querySelector(".cm-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cms]"); if (!b) return; cmSection = b.dataset.cms; cmEdit = {}; drawTab();
    });
    $("#cmView").addEventListener("click", function (e) {
      e.preventDefault();
      var target = { weeks: "curriculum", calendar: "curriculum", portfolio: "portfolio", guide: "guide", participate: "participate", faq: "faq" }[cmSection];
      closePanel();
      var el = document.getElementById(target); if (el) { if (cmSection === "calendar") el = el.querySelector(".cal-wrap") || el; el.scrollIntoView({ block: "start" }); }
    });
    var box = $("#cmBody"), C = window.SITE_CONFIG;
    ({ weeks: cmWeeks, calendar: cmCalendar, portfolio: cmPortfolio, guide: cmGuide, participate: cmParticipate, faq: cmFaq })[cmSection](box, C);
  }

  /* 1. 주차별 강의 계획 */
  function cmWeeks(box, C) {
    var cur = C.curriculum || {}, days = cur.days && cur.days.length ? cur.days : ["화"];
    cmSettings(box, { key: "cur", label: "구역 제목 · 안내", fields: [
        { key: "title", label: "제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" },
        { key: "materialsNote", label: "자료 안내 문구", type: "text", placeholder: "주차별 수업 자료는 LMS에 올라옵니다." },
        { key: "submitUrl", label: "과제 제출 주소", type: "text", help: "비우면 사이트에서 제출받음", placeholder: "https://…" }
      ], get: function (c) { return c.curriculum; }, set: function (c, v) { Object.assign(ensure(c, "curriculum", {}), v); } });
    var fields = [
      { key: "topic", label: "주차 제목", type: "text", required: true, wide: true },
      { key: "badge", label: "표시", type: "text", placeholder: "예: 중간고사 주간" }
    ].concat(days.map(function (d) { return { key: "s_" + d, label: d + "요일 수업", type: "text", placeholder: "비우면 공통 수업 내용 또는 주차 제목" }; }))
     .concat([
      { key: "common", label: "요일 구분 없는 수업 내용", type: "lines", help: "모든 수업일에 함께 표시" },
      { key: "concepts", label: "수업 핵심 질문(핵심 개념)", type: "lines" },
      { key: "content", label: "활동", type: "lines" },
      { key: "homework", label: "과제 칸", type: "text", placeholder: "예: 주 2회 챗봇 대화 연습", wide: true },
      { key: "videos", label: "참고 영상", type: "pairs", help: "한 줄에 ‘제목 | 주소’" },
      { key: "hasAssign", label: "이 주에 사이트에서 제출받는 과제가 있음", type: "checkbox", wide: true },
      { key: "aTitle", label: "제출 과제 제목", type: "text" },
      { key: "aDue", label: "마감 일시", type: "datetime", help: "비우면 ‘추후 공지’" },
      { key: "aDesc", label: "제출 과제 설명", type: "textarea" }
    ]);
    cmList(box, { key: "weeks", label: "주차", itemLabel: "주차",
      note: "주차를 지우거나 순서를 바꾸면 뒤쪽 주차 번호와 날짜가 함께 당겨집니다. 이미 제출된 과제는 주차 번호로 저장되어 있으니 학기 중에는 주의해 주세요.",
      getList: function (c) { return (c.curriculum || {}).weeks; }, setList: function (c, l) { ensure(c, "curriculum", {}).weeks = l; },
      itemTitle: function (w, i) { return (i + 1) + "주차 · " + (w.topic || ""); },
      itemSub: function (w, i) {
        var R = RT(), wk = R.weeks[i];
        return (wk ? esc(wk.sessions.map(function (s) { return R.fmtDay(s.date); }).join(" · ")) : "") + (w.badge ? " · " + esc(w.badge) : "") + (w.assignment ? " · 과제: " + esc(w.assignment.title) : "");
      },
      blank: function () { var b = { topic: "", badge: "", common: [], concepts: [], content: [], homework: "", videos: [], hasAssign: false, aTitle: "", aDue: "", aDesc: "" }; days.forEach(function (d) { b["s_" + d] = ""; }); return b; },
      toForm: function (w) {
        var f = { topic: w.topic, badge: w.badge || "", concepts: w.concepts || [], content: w.content || [], homework: w.homework || "", videos: w.videos || [],
          common: (w.sessions || []).filter(function (s) { return !s.day; }).map(function (s) { return s.title; }),
          hasAssign: !!w.assignment, aTitle: w.assignment ? w.assignment.title : "", aDue: w.assignment ? w.assignment.due : "", aDesc: w.assignment ? w.assignment.desc : "" };
        days.forEach(function (d) { f["s_" + d] = (w.sessions || []).filter(function (s) { return s.day === d; }).map(function (s) { return s.title; }).join(" · "); });
        return f;
      },
      fromForm: function (v, old) {
        var w = Object.assign({}, old || {});
        w.topic = v.topic; if (v.badge) w.badge = v.badge; else delete w.badge;
        var ss = v.common.map(function (t) { return { day: "", title: t }; });
        days.forEach(function (d) { if (v["s_" + d]) ss.push({ day: d, title: v["s_" + d] }); });
        if (ss.length) w.sessions = ss; else delete w.sessions;
        w.concepts = v.concepts; w.content = v.content; w.videos = v.videos;
        if (v.homework) w.homework = v.homework; else delete w.homework;
        if (v.hasAssign) w.assignment = Object.assign({}, (old && old.assignment) || {}, { title: v.aTitle, desc: v.aDesc, due: v.aDue }); else delete w.assignment;
        return w;
      },
      validate: function (v) { return v.hasAssign && !v.aTitle ? [["aTitle", "제출 과제 제목을 입력해 주세요."]] : []; },
      fields: fields });
  }

  /* 2. 월간 수업 달력 */
  function cmCalendar(box, C) {
    var cur = C.curriculum || {}, R = RT();
    var hols = (R.sessions || []).filter(function (s) { return s.holiday; }).length;
    var info = document.createElement("p");
    info.className = "muted small";
    info.innerHTML = "지금 설정: 수업 " + ((R.sessions || []).length - hols) + "회 · 휴강 " + hols + "회 · " + (R.sessions && R.sessions.length ? esc(R.fmtDay(R.sessions[0].date)) + " ~ " + esc(R.fmtDay(R.sessions[R.sessions.length - 1].date)) : "");
    box.appendChild(info);
    cmSettings(box, { key: "cal", label: "수업 일정", note: "1주차 첫 수업 날짜를 바꾸면 모든 주차 날짜가 다시 계산됩니다.", fields: [
        { key: "startDate", label: "1주차 첫 수업 날짜", type: "date", required: true },
        { key: "days", label: "수업 요일", type: "days", required: true },
        { key: "time", label: "수업 시간", type: "text", required: true, placeholder: "15:00–16:15" },
        { key: "location", label: "강의실", type: "text", required: true }
      ], get: function (c) { return c.curriculum; }, set: function (c, v) { Object.assign(ensure(c, "curriculum", {}), v); } });
    var EV_TYPES = ["휴강", "보강", "특강", "시험", "행사", "기타"];
    var noticeOf = function (e) {
      var p = String(e.date).split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
      return { title: "[" + (e.type || "휴강") + "] " + e.name,
        body: RT().fmtDay(d) + (e.time ? " " + e.time : "") + " · " + (e.type || "휴강") + (e.desc ? "\n" + e.desc : ""),
        important: !!e.noticeImportant, eventDate: e.date };
    };
    cmList(box, { key: "holidays", label: "일정 (휴강·보강·특강·시험·행사)", itemLabel: "일정",
      note: "‘휴강’은 달력에 휴강으로 표시되고 출석 집계에서 빠집니다. 다른 종류는 달력에 일정으로만 표시됩니다.",
      getList: function (c) { return (c.curriculum || {}).holidays || []; }, setList: function (c, l) { ensure(c, "curriculum", {}).holidays = l; },
      itemTitle: function (h) { return (h.date || "") + " · [" + (h.type || "휴강") + "] " + (h.name || ""); },
      itemSub: function (h) { return [h.time ? esc(h.time) : "", h.popup ? '<span class="chip ev">팝업</span>' : "", h.notice ? '<span class="chip task">공지</span>' : ""].filter(Boolean).join(" "); },
      blank: function () { return { date: "", type: "휴강", name: "", time: "", desc: "", popup: false, notice: false, noticeImportant: false }; },
      toForm: function (h) { return { date: h.date, type: h.type || "휴강", name: h.name, time: h.time || "", desc: h.desc || "", popup: !!h.popup, notice: !!h.notice, noticeImportant: !!h.noticeImportant }; },
      fromForm: function (v, old) {
        var e = Object.assign({}, old || {}, { date: v.date, type: v.type, name: v.name, popup: v.popup, notice: v.notice, noticeImportant: v.notice && v.noticeImportant });
        ["time", "desc"].forEach(function (k) { if (v[k]) e[k] = v[k]; else delete e[k]; });
        if (!e.popup) delete e.popup; if (!e.notice) delete e.notice; if (!e.noticeImportant) delete e.noticeImportant;
        return e;
      },
      /* 공지사항 연동: 체크하면 공지를 만들거나 고치고, 체크를 풀거나 일정을 지우면 그 공지도 지웁니다. */
      sync: function (item, old) {
        var oldId = old && old.noticeId;
        if (item && item.notice) {
          var id = oldId || "ev" + Date.now();
          var prev = notices.filter(function (n) { return n.id === id; })[0];
          return Store.set("notices/" + id, Object.assign(noticeOf(item), { at: (prev && prev.data.at) || new Date().toISOString() })).then(function () { item.noticeId = id; return item; });
        }
        if (item) delete item.noticeId;
        return (oldId ? Store.del("notices/" + oldId) : Promise.resolve()).then(function () { return item; });
      },
      syncMsg: function (it, old) {
        var m = [];
        if (it.popup) m.push("첫 화면 팝업에 등록");
        if (it.notice) m.push(old && old.noticeId ? "공지사항 수정" : "공지사항 등록");
        else if (old && old.noticeId) m.push("연결된 공지 삭제");
        return m.length ? " (" + m.join(" · ") + ")" : "";
      },
      validate: function (v) { return v.noticeImportant && !v.notice ? [["notice", "중요 공지로 고정하려면 ‘공지사항 등록’도 체크해 주세요."]] : []; },
      fields: [
        { key: "date", label: "날짜", type: "date", required: true },
        { key: "type", label: "종류", type: "select", required: true, empty: false, options: EV_TYPES },
        { key: "name", label: "제목", type: "text", required: true, wide: true, placeholder: "예: 추석 연휴, 특강 ‘AI와 번역’" },
        { key: "time", label: "시간", type: "text", placeholder: "예: 15:00–16:15" },
        { key: "desc", label: "설명", type: "textarea", placeholder: "학생에게 알릴 내용" },
        { key: "popup", label: "팝업 등록 · 일정 날짜까지 첫 화면 팝업으로 알림", type: "checkbox", wide: true },
        { key: "notice", label: "공지사항 등록 · 첫 화면 공지사항에 올림", type: "checkbox", wide: true },
        { key: "noticeImportant", label: "중요 공지로 맨 위에 고정", type: "checkbox", wide: true }
      ] });
  }

  /* 3. 우수 과제 포트폴리오 */
  function cmPortfolio(box, C) {
    var DR = window.SITE_DRIVE || { kind: function () { return "파일"; }, valid: function () { return true; } };
    var cats = ((C.portfolio || {}).categories) || [];
    cmSettings(box, { key: "pf", label: "구역 제목 · 분류", fields: [
        { key: "title", label: "제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" },
        { key: "categories", label: "분류 목록", type: "lines", required: true }
      ], get: function (c) { return c.portfolio; }, set: function (c, v) { Object.assign(ensure(c, "portfolio", { items: [] }), v); } });
    cmList(box, { key: "pfItems", label: "과제물", itemLabel: "과제물",
      formNote: "자료는 구글 드라이브 링크로만 등록합니다. 드라이브에서 공유 → 일반 액세스를 ‘링크가 있는 모든 사용자(뷰어)’로 바꾼 뒤 링크를 붙여 넣으세요.",
      getList: function (c) { return (c.portfolio || {}).items || []; }, setList: function (c, l) { ensure(c, "portfolio", {}).items = l; },
      itemTitle: function (it) { return it.title || ""; },
      itemSub: function (it) { return esc((it.category || "") + " · " + DR.kind(it.url, it.kind) + " · " + (it.student || "")) + (it.sample ? ' <span class="chip past">샘플</span>' : ""); },
      blank: function () { return { url: "", title: "", student: "", category: "", week: "", kind: "", desc: "", sample: false }; },
      validate: function (v) { return v.url && !DR.valid(v.url) ? [["url", "구글 드라이브 또는 구글 문서 링크(https://drive.google.com/…, https://docs.google.com/…)만 등록할 수 있습니다."]] : []; },
      onForm: function (form, pre) {
        var u = form.querySelector("#" + pre + "url"), hint = document.createElement("p");
        hint.className = "muted small"; u.parentNode.appendChild(hint);
        var upd = function () { var x = u.value.trim(); hint.textContent = !x ? "" : DR.valid(x) ? "인식한 자료 종류: " + DR.kind(x, "") : "구글 드라이브·구글 문서 링크만 등록할 수 있습니다."; };
        u.addEventListener("input", upd); upd();
      },
      fields: [
        { key: "url", label: "구글 드라이브 URL", type: "text", required: true, wide: true, placeholder: "https://drive.google.com/file/d/…/view" },
        { key: "title", label: "제목", type: "text", required: true, wide: true },
        { key: "student", label: "학생(이름·학과 또는 팀)", type: "text", required: true },
        { key: "category", label: "분류", type: "select", required: true, options: cats },
        { key: "week", label: "주차", type: "text", placeholder: "예: 4주" },
        { key: "kind", label: "자료 종류", type: "select", empty: "링크로 자동 판단", options: ["영상", "이미지", "PDF", "문서", "슬라이드", "시트", "폴더"] },
        { key: "desc", label: "소개", type: "textarea" },
        { key: "sample", label: "샘플로 표시(링크가 열리지 않음)", type: "checkbox" }
      ] });
  }

  /* 4. 수강 안내 */
  function cmGuide(box, C) {
    cmSettings(box, { key: "guide", label: "구역 제목 · 안내", fields: [
        { key: "title", label: "제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" },
        { key: "prepTitle", label: "준비물 제목", type: "text" }
      ], get: function (c) { return c.guide; }, set: function (c, v) { Object.assign(ensure(c, "guide", { prep: [] }), v); } });
    cmList(box, { key: "prep", label: "수강 준비물", itemLabel: "준비물",
      getList: function (c) { return (c.guide || {}).prep || []; }, setList: function (c, l) { ensure(c, "guide", {}).prep = l; },
      itemTitle: function (p) { return p.title || ""; }, itemSub: function (p) { return esc(p.body || ""); },
      blank: function () { return { title: "", body: "" }; },
      fields: [{ key: "title", label: "준비물", type: "text", required: true }, { key: "body", label: "설명", type: "textarea" }] });
    cmSettings(box, { key: "apply", label: "수강 신청서 안내 문구", fields: [
        { key: "title", label: "신청서 제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" },
        { key: "doneTitle", label: "제출 완료 제목", type: "text" },
        { key: "doneBody", label: "제출 완료 안내", type: "textarea" }
      ], get: function (c) { return c.apply; }, set: function (c, v) { Object.assign(ensure(c, "apply", { fields: [] }), v); } });
    var TYPES = [{ value: "text", label: "한 줄 글" }, { value: "textarea", label: "여러 줄 글" }, { value: "email", label: "이메일" }, { value: "tel", label: "전화번호" },
      { value: "select", label: "목록에서 고르기" }, { value: "radio", label: "버튼으로 고르기" }, { value: "consent", label: "동의 체크" }];
    cmList(box, { key: "fields", label: "수강 신청서 항목", itemLabel: "신청서 항목",
      note: "이름·학번 항목은 로그인과 관리자 집계에 쓰여 삭제할 수 없습니다. 항목을 지워도 이미 제출된 신청서의 내용은 남습니다.",
      getList: function (c) { return (c.apply || {}).fields || []; }, setList: function (c, l) { ensure(c, "apply", {}).fields = l; },
      locked: function (f) { return ["name", "studentId"].indexOf(f.id) >= 0 ? "로그인과 집계에 필요한 항목입니다" : ""; },
      itemTitle: function (f) { return (f.label || "") + (f.required ? " *" : ""); },
      itemSub: function (f) { var t = TYPES.filter(function (x) { return x.value === f.type; })[0]; return esc((t ? t.label : f.type) + (f.options && f.options.length ? " · " + f.options.join(", ") : "")); },
      blank: function () { return { label: "", type: "text", required: false, placeholder: "", options: [], minLength: "", text: "" }; },
      toForm: function (f) { return { label: f.label, type: f.type, required: !!f.required, placeholder: f.placeholder || "", options: f.options || [], minLength: f.minLength || "", text: f.text || "" }; },
      fromForm: function (v, old) {
        var f = Object.assign({}, old || { id: newId("f") }, { label: v.label, type: v.type, required: v.required });
        ["placeholder", "text"].forEach(function (k) { if (v[k]) f[k] = v[k]; else delete f[k]; });
        if (v.type === "select" || v.type === "radio") f.options = v.options; else delete f.options;
        if (v.minLength) f.minLength = v.minLength; else delete f.minLength;
        return f;
      },
      validate: function (v) { return (v.type === "select" || v.type === "radio") && v.options.length < 2 ? [["options", "선택지를 두 개 이상 적어 주세요."]] : (v.type === "consent" && !v.text ? [["text", "동의 문구를 적어 주세요."]] : []); },
      fields: [
        { key: "label", label: "항목 이름", type: "text", required: true },
        { key: "type", label: "입력 방식", type: "select", required: true, empty: false, options: TYPES },
        { key: "required", label: "꼭 입력해야 하는 항목", type: "checkbox" },
        { key: "placeholder", label: "입력 예시", type: "text" },
        { key: "minLength", label: "최소 글자 수", type: "number" },
        { key: "options", label: "선택지", type: "lines", help: "목록·버튼 방식일 때, 한 줄에 하나씩" },
        { key: "text", label: "동의 문구", type: "textarea", help: "동의 체크 방식일 때" }
      ] });
  }

  /* 5. 참여하기 */
  function cmParticipate(box, C) {
    cmSettings(box, { key: "part", label: "구역 제목 · 안내", fields: [
        { key: "title", label: "제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" }
      ], get: function (c) { return c.participate; }, set: function (c, v) { Object.assign(ensure(c, "participate", {}), v); } });
    cmSettings(box, { key: "poll", label: "투표 질문", fields: [{ key: "question", label: "질문", type: "text", required: true, wide: true }],
      get: function (c) { return (c.participate || {}).poll; }, set: function (c, v) { var p = ensure(c, "participate", {}); p.poll = Object.assign(p.poll || { options: [] }, v); } });
    cmList(box, { key: "pollOpts", label: "투표 선택지", itemLabel: "선택지",
      note: "선택지를 지우면 그 선택지에 들어온 표는 결과에서 빠집니다. 이름만 고치면 표는 그대로 남습니다.",
      getList: function (c) { return ((c.participate || {}).poll || {}).options || []; },
      setList: function (c, l) { var p = ensure(c, "participate", {}); p.poll = p.poll || {}; p.poll.options = l; },
      itemTitle: function (o) { return o.label || ""; },
      blank: function () { return { label: "" }; },
      fromForm: function (v, old) { return Object.assign({}, old || { id: newId("o") }, { label: v.label }); },
      fields: [{ key: "label", label: "선택지", type: "text", required: true, wide: true }] });
    var reset = document.createElement("div");
    reset.className = "adm-card cm-block";
    reset.innerHTML = '<h3>투표 결과 초기화</h3><p class="muted small">지금까지 들어온 표를 모두 지웁니다. 되돌릴 수 없습니다.</p><div class="adm-row"><button type="button" class="btn ghost sm danger-btn" id="pollReset">투표 결과 지우기</button><span class="muted small" id="pollResetMsg"></span></div>';
    box.appendChild(reset);
    $("#pollReset").addEventListener("click", function () {
      var b = this; if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "한 번 더 누르면 모두 지웁니다"; return; }
      b.disabled = true;
      Store.list("poll").then(function (l) {
        var seq = Promise.resolve();
        l.forEach(function (v) { seq = seq.then(function () { return Store.del("poll/" + v.id); }); });
        return seq.then(function () { return l.length; });
      }).then(function (n) { toast("투표 " + n + "건을 지웠습니다."); loadAll().then(drawTab); }, function () { b.disabled = false; $("#pollResetMsg").textContent = "지우지 못했습니다. 페이지 소유자 계정으로 시도해 주세요."; });
    });
    cmSettings(box, { key: "att", label: "출석 규칙", fields: [
        { key: "onlyClassDay", label: "수업 날짜에만 출석 버튼 열기", type: "checkbox" },
        { key: "failAbsences", label: "성적 미부여 결석 횟수(경고 기준)", type: "number" }
      ], get: function (c) { return (c.participate || {}).attendance; }, set: function (c, v) { ensure(c, "participate", {}).attendance = Object.assign({}, (c.participate.attendance || {}), v); } });
    cmSettings(box, { key: "sub", label: "과제 제출 규칙", fields: [
        { key: "maxMB", label: "파일 최대 크기(MB)", type: "number", required: true },
        { key: "accept", label: "받을 파일 형식", type: "text", help: "쉼표로 구분", placeholder: ".pdf,.docx,.hwp" },
        { key: "allowLate", label: "마감 후 제출 허용(지각 표시)", type: "checkbox" }
      ], validate: function (v) { return v.maxMB && (v.maxMB <= 0 || v.maxMB > 10) ? [["maxMB", "파일 크기는 0보다 크고 10MB 이하로 정해 주세요."]] : []; },
      get: function (c) { return (c.participate || {}).submission; }, set: function (c, v) { ensure(c, "participate", {}).submission = Object.assign({}, (c.participate.submission || {}), v); } });
  }

  /* 6. 자주 묻는 질문 */
  function cmFaq(box, C) {
    cmSettings(box, { key: "faqHead", label: "구역 제목 · 안내", fields: [
        { key: "title", label: "제목", type: "text", required: true },
        { key: "lead", label: "안내 문구", type: "textarea" }
      ], get: function (c) { return c.faq; }, set: function (c, v) { Object.assign(ensure(c, "faq", { items: [] }), v); } });
    cmList(box, { key: "faqItems", label: "질문과 답변", itemLabel: "질문",
      getList: function (c) { return (c.faq || {}).items || []; }, setList: function (c, l) { ensure(c, "faq", {}).items = l; },
      itemTitle: function (it) { return "Q. " + (it.q || ""); }, itemSub: function (it) { return esc(String(it.a || "").slice(0, 80)) + (String(it.a || "").length > 80 ? "…" : ""); },
      blank: function () { return { q: "", a: "" }; },
      fields: [{ key: "q", label: "질문", type: "text", required: true, wide: true }, { key: "a", label: "답변", type: "textarea", required: true }] });
  }

  /* ---- 수강생 명단 ---- */
  function parseRoster(text) {
    var out = [], seen = {};
    text.replace(/^﻿/, "").split(/\r?\n/).forEach(function (line) {
      if (!line.trim()) return;
      var c = line.split(/\t|,/).map(function (x) { return x.trim().replace(/^"|"$/g, ""); });
      var idIdx = c.findIndex(function (x) { return /^\d{6,12}$/.test(x); });
      if (idIdx < 0) return;
      var rest = c.filter(function (x, i) { return i !== idIdx && x; });
      var id = c[idIdx]; if (seen[id]) return; seen[id] = 1;
      out.push({ studentId: id, name: rest[0] || "", dept: rest[1] || "" });
    });
    return out;
  }
  function tStudents(main) {
    var ps = people(), byId = {}; ps.forEach(function (p) { byId[p.studentId] = p; });
    var held = heldSessions().length;
    main.innerHTML = bar("수강생 명단", dlBtn("dlStu")) + modeHint() +
      '<div class="adm-card adm-form">' +
        '<label class="lbl" for="stText">명단 붙여넣기</label>' +
        '<p class="muted small">엑셀에서 <b>학번 · 이름 · 학과</b> 열을 복사해 붙여 넣거나, CSV 파일을 불러오세요. 한 줄에 한 명씩, 머리글 줄은 자동으로 건너뜁니다.</p>' +
        '<textarea id="stText" rows="6" placeholder="2026123456	김고대	국어국문학과&#10;2026123457	이안암	경영학과"></textarea>' +
        '<div class="adm-row"><label class="btn ghost sm file-btn" for="stFile">CSV 파일 불러오기</label><input type="file" id="stFile" accept=".csv,.txt" hidden>' +
        '<span class="muted small" id="stPrev"></span></div>' +
        '<div class="adm-row"><button type="button" class="btn primary sm" id="stAdd">명단에 추가</button><button type="button" class="btn ghost sm" id="stReplace">이 내용으로 명단 바꾸기</button></div>' +
        '<p class="form-err" id="stErr" role="alert"></p></div>' +
      '<h3 class="adm-h3">등록된 수강생 ' + D.students.length + "명</h3>" +
      table(["학번", "이름", "학과", "수강 신청", "로그인", "출석", ""], D.students.map(function (s) {
        var p = byId[s.studentId] || {}, a = p.att ? Object.keys(p.att).length : 0;
        return [esc(s.studentId), esc(s.name), esc(s.dept), p.app ? "✓" : "–", p.loggedIn ? "✓" : "–", a + "/" + held, '<button type="button" class="text-btn danger" data-rm="' + esc(s.studentId) + '">빼기</button>'];
      }), { empty: "아직 등록한 명단이 없습니다. 위에서 붙여 넣거나 CSV 파일을 불러오세요." }) +
      (ps.filter(function (p) { return !p.listed; }).length ? '<h3 class="adm-h3">명단에 없는 참여자</h3><p class="muted small">로그인하거나 신청서를 냈지만 등록한 명단에 없는 학번입니다.</p>' +
        table(["학번", "이름", "수강 신청", "로그인"], ps.filter(function (p) { return !p.listed; }).map(function (p) { return [esc(p.studentId), esc(p.name), p.app ? "✓" : "–", p.loggedIn ? "✓" : "–"]; })) : "");
    var ta = $("#stText");
    var preview = function () { var n = parseRoster(ta.value).length; $("#stPrev").textContent = ta.value.trim() ? "학번이 있는 줄 " + n + "명을 찾았습니다." : ""; };
    ta.addEventListener("input", preview);
    $("#stFile").addEventListener("change", function () { var f = this.files[0]; if (f) readText(f).then(function (t) { ta.value = t; preview(); }); });
    var save = function (list, msg) {
      return Store.set("admin/students", { list: list, at: new Date().toISOString() }).then(function () { D.students = list; toast(msg); drawTab(); },
        function () { $("#stErr").textContent = "명단을 저장하지 못했습니다. 편집 권한을 확인해 주세요."; });
    };
    $("#stAdd").addEventListener("click", function () {
      var add = parseRoster(ta.value); if (!add.length) { $("#stErr").textContent = "학번(숫자)이 들어 있는 줄을 찾지 못했습니다."; ta.focus(); return; }
      var map = {}; D.students.forEach(function (s) { map[s.studentId] = s; }); add.forEach(function (s) { map[s.studentId] = s; });
      save(Object.keys(map).sort().map(function (k) { return map[k]; }), add.length + "명을 명단에 반영했습니다.");
    });
    $("#stReplace").addEventListener("click", function () {
      var list = parseRoster(ta.value); if (!list.length) { $("#stErr").textContent = "학번(숫자)이 들어 있는 줄을 찾지 못했습니다."; ta.focus(); return; }
      var b = this; if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "기존 명단을 지우고 바꿀까요? 한 번 더 누르세요"; return; }
      save(list, "명단을 " + list.length + "명으로 바꿨습니다.");
    });
    main.querySelectorAll("[data-rm]").forEach(function (b) {
      b.addEventListener("click", function () { save(D.students.filter(function (s) { return s.studentId !== b.dataset.rm; }), b.dataset.rm + " 학번을 명단에서 뺐습니다."); });
    });
    onDl("dlStu", "수강생명단_" + stamp() + ".csv", function () {
      return [["학번", "이름", "학과", "수강 신청", "로그인", "출석 수"]].concat(D.students.map(function (s) {
        var p = byId[s.studentId] || {}; return [s.studentId, s.name, s.dept, p.app ? "O" : "", p.loggedIn ? "O" : "", p.att ? Object.keys(p.att).length : 0];
      }));
    });
  }

  /* ---- 수강 신청 ---- */
  function tApply(main) {
    var fields = ((window.SITE_CONFIG.apply || {}).fields || []).filter(function (f) { return f.type !== "consent"; });
    var listed = {}; D.students.forEach(function (s) { listed[s.studentId] = 1; });
    var apps = D.apps.filter(function (a) { return a.data; }).sort(function (a, b) { return String(a.data.submittedAt).localeCompare(String(b.data.submittedAt)); });
    main.innerHTML = bar("수강 신청 내역 " + apps.length + "건", dlBtn("dlApp")) + modeHint() +
      table(["제출 시각"].concat(fields.map(function (f) { return esc(f.label); })).concat(["명단"]), apps.map(function (a) {
        return [esc(fmtAt(a.data.submittedAt))].concat(fields.map(function (f) { return '<span class="cell-clip">' + esc(a.data[f.id]) + "</span>"; }))
          .concat([D.students.length ? (listed[a.data.studentId] ? "✓" : '<span class="chip past">명단 외</span>') : "–"]);
      }), { empty: "아직 제출된 수강 신청서가 없습니다.", cls: "wide" });
    onDl("dlApp", "수강신청내역_" + stamp() + ".csv", function () {
      return [["제출 시각"].concat(fields.map(function (f) { return f.label; })).concat(["개인정보 동의", "명단 포함"])].concat(apps.map(function (a) {
        return [fmtAt(a.data.submittedAt)].concat(fields.map(function (f) { return a.data[f.id]; })).concat([a.data.consent ? "동의" : "", listed[a.data.studentId] ? "O" : ""]);
      }));
    });
  }

  /* ---- 출석 ---- */
  function attRow(p, csvMode) {
    var cnt = 0, miss = 0, t = new Date();
    var cells = allSessions().map(function (s) {
      if (s.holiday) return csvMode ? "휴강" : '<span class="x" title="' + esc(s.holiday) + '">휴</span>';
      if (p.att && p.att[s.id]) { cnt++; return csvMode ? "O" : '<span class="ok" title="' + esc(fmtAt(p.att[s.id])) + '">✓</span>'; }
      if (s.date <= t) { miss++; return csvMode ? "X" : '<span class="x">×</span>'; }
      return "";
    });
    return { cells: cells, cnt: cnt, miss: miss };
  }
  function tAttend(main) {
    var ps = people().filter(function (p) { return p.listed || p.loggedIn || p.att; });
    var ss = allSessions(), held = heldSessions().length, fail = failN();
    main.innerHTML = bar("출석 현황", dlBtn("dlAtt")) + modeHint() +
      '<p class="muted small">✓ 출석 · <span class="x">×</span> 지난 수업 미출석 · 휴 = 휴강 · 빈칸은 아직 수업 전입니다. 지금까지 수업 ' + held + "회." + (fail ? " 결석 " + fail + "회 이상은 성적 미부여 대상입니다." : "") + "</p>" +
      table(["학번", "이름"].concat(ss.map(function (s) { return s.n + s.day + '<small class="th-sub">' + (s.date.getMonth() + 1) + "/" + s.date.getDate() + "</small>"; })).concat(["출석", "결석", "출석률"]),
        ps.map(function (p) {
          var r = attRow(p, false), risk = fail && r.miss >= fail;
          return [esc(p.studentId) + (p.listed ? "" : ' <span class="chip past">명단 외</span>'), esc(p.name)].concat(r.cells)
            .concat([r.cnt + "/" + held, risk ? '<span class="chip now">' + r.miss + "회 · 위험</span>" : String(r.miss), held ? Math.round(r.cnt / held * 100) + "%" : "–"]);
        }), { empty: "출석 기록이 없습니다.", cls: "att-tbl" });
    onDl("dlAtt", "출석현황_" + stamp() + ".csv", function () {
      return [["학번", "이름", "학과"].concat(ss.map(function (s) { return s.n + "주차 " + s.day + "(" + (s.date.getMonth() + 1) + "/" + s.date.getDate() + ")"; })).concat(["출석 수", "결석 수", "지난 수업 수", "출석률(%)", "명단 포함"])]
        .concat(ps.map(function (p) {
          var r = attRow(p, true);
          return [p.studentId, p.name, p.dept].concat(r.cells).concat([r.cnt, r.miss, held, held ? Math.round(r.cnt / held * 100) : "", p.listed ? "O" : ""]);
        }));
    });
  }

  /* ---- 과제 ---- */
  function fileBlob(item) {
    var base = "submissions/" + item.uid + "/files/w" + item.n + "_", parts = [];
    var seq = Promise.resolve();
    for (var i = 0; i < (item.chunks || 0); i++) (function (i) { seq = seq.then(function () { return Store.get(base + i).then(function (d) { parts[i] = d ? d.d : ""; }); }); })(i);
    return seq.then(function () {
      var bin = atob(parts.join("")), arr = new Uint8Array(bin.length);
      for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
      return new Blob([arr], { type: item.type || "application/octet-stream" });
    });
  }
  var safeName = function (s) { return String(s).replace(/[\\/:*?"<>|]/g, "_"); };
  function tAssign(main) {
    var aw = RT().weeks.filter(function (w) { return w.raw.assignment; });
    var ps = people().filter(function (p) { return p.listed || p.loggedIn || p.subs; });
    var now = new Date(), localMode = Store.mode() !== "cloud";
    main.innerHTML = bar("과제 제출 현황", dlBtn("dlSub")) + modeHint() +
      (localMode ? '<p class="muted small">체험 모드에서는 파일 이름과 크기만 기록되어 파일을 내려받을 수 없습니다.</p>' : "") +
      '<div class="adm-assign">' + aw.map(function (w) {
        var got = ps.filter(function (p) { return p.subs && p.subs[w.n]; });
        return '<div class="adm-card"><div class="adm-bar sm"><h3>' + w.n + "주차 · " + esc(w.raw.assignment.title) + '</h3><div class="adm-bar-r"><span class="muted small">마감 ' + esc(RT().fmtDue(w.due)) + "</span>" +
          (got.length && !localMode ? '<button type="button" class="btn ghost sm" data-zip="' + w.n + '">모두 받기(.zip)</button>' : "") + "</div></div>" +
          '<p class="muted small">제출 ' + got.length + "명" + (ps.length ? " / " + (D.students.length || ps.length) + "명" : "") + (!w.due ? " · 제출 기한 추후 공지" : w.due > now ? " · 진행 중" : " · 마감") + "</p>" +
          (got.length ? table(["학번", "이름", "파일", "제출 시각", ""], got.map(function (p) {
            var it = p.subs[w.n];
            return [esc(p.studentId), esc(p.name), '<span class="cell-clip">' + esc(it.fileName) + "</span>", esc(fmtAt(it.at)) + (it.late ? ' <span class="chip past">지각</span>' : ""),
              localMode || !it.chunks ? "" : '<button type="button" class="text-btn" data-file="' + esc(p.studentId) + "|" + w.n + '">내려받기</button>'];
          })) : "") +
        "</div>";
      }).join("") + "</div>";
    var findItem = function (sid, n) { var p = ps.filter(function (x) { return x.studentId === sid; })[0]; var it = p && p.subs && p.subs[n]; return it ? { p: p, it: Object.assign({ n: n }, it) } : null; };
    main.querySelectorAll("[data-file]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.file.split("|"), f = findItem(k[0], +k[1]); if (!f) return;
        var name = safeName(f.p.studentId + "_" + f.p.name + "_" + k[1] + "주차_" + f.it.fileName), ext = name.split(".").pop().toLowerCase();
        b.textContent = "준비 중…";
        fileBlob(f.it).then(function (blob) {
          if (SAFE_EXT.indexOf(ext) >= 0 || !(window.claude && window.claude.use)) return saveFile(name, blob);
          return loadJSZip().then(function (Z) { var z = new Z(); z.file(name, blob); return z.generateAsync({ type: "blob" }); }).then(function (zb) { return saveFile(name.replace(/\.[^.]+$/, "") + ".zip", zb); });
        }).then(function () { b.textContent = "내려받기"; }, function (e) { b.textContent = "내려받기"; toast(saveErr(e)); });
      });
    });
    main.querySelectorAll("[data-zip]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.dataset.zip, got = ps.filter(function (p) { return p.subs && p.subs[n] && p.subs[n].chunks; });
        b.textContent = "묶는 중…"; b.disabled = true;
        loadJSZip().then(function (Z) {
          var z = new Z(), seq = Promise.resolve();
          got.forEach(function (p) { seq = seq.then(function () { return fileBlob(Object.assign({ n: n }, p.subs[n])).then(function (blob) { z.file(safeName(p.studentId + "_" + p.name + "_" + p.subs[n].fileName), blob); }); }); });
          return seq.then(function () { return z.generateAsync({ type: "blob" }); });
        }).then(function (zb) { return saveFile(n + "주차_과제_" + stamp() + ".zip", zb); })
          .then(function () { b.textContent = "모두 받기(.zip)"; b.disabled = false; }, function (e) { b.textContent = "모두 받기(.zip)"; b.disabled = false; toast(e && e.code === "zip" ? "압축 도구를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요." : saveErr(e)); });
      });
    });
    onDl("dlSub", "과제제출현황_" + stamp() + ".csv", function () {
      return [["학번", "이름", "학과"].concat(aw.map(function (w) { return w.n + "주차 " + w.raw.assignment.title; })).concat(["제출 수", "명단 포함"])]
        .concat(ps.map(function (p) {
          var cnt = 0;
          var cells = aw.map(function (w) { var it = p.subs && p.subs[w.n]; if (!it) return w.due && w.due <= now ? "미제출" : ""; cnt++; return fmtAt(it.at) + (it.late ? " (지각)" : "") + " " + it.fileName; });
          return [p.studentId, p.name, p.dept].concat(cells).concat([cnt, p.listed ? "O" : ""]);
        }));
    });
  }

  /* ---- 사이트 내용 편집 ---- */
  var SECTIONS = [
    ["site", "사이트 기본 정보"], ["hero", "첫 화면"], ["overview", "강의 한눈에 보기"], ["stats", "숫자 카드"], ["syllabus", "강의계획서"],
    ["strengths", "강의 장점 슬라이드"], ["tools", "실습 AI 도구"], ["curriculum", "커리큘럼과 일정"], ["portfolio", "포트폴리오"], ["guide", "수강 준비물"],
    ["apply", "수강 신청서"], ["participate", "참여 공간(투표·출석·과제)"], ["faq", "자주 묻는 질문"], ["instructor", "교수자"],
    ["popup", "첫 방문 안내 팝업"], ["welcome", "환영 효과"], ["nav", "상단 메뉴"], ["theme", "색상"]
  ];
  var KL = {
    title: "제목", kicker: "작은 머리글", lead: "안내 문구", subtitle: "부제", description: "설명", badge: "배지", buttons: "버튼", label: "글자",
    href: "연결 위치", style: "모양(primary/ghost)", items: "항목", name: "이름", body: "내용", q: "질문", a: "답변", value: "값", unit: "단위",
    note: "보조 문구", icon: "아이콘(calendar/clock/monitor/users)", maker: "만든 곳", use: "실습 활용", url: "주소", topic: "주제", content: "학습 내용",
    videos: "참고 영상", assignment: "과제", due: "마감(연-월-일 시:분)", desc: "과제 설명", startDate: "1주차 날짜(연-월-일)", time: "시간", location: "장소",
    submitUrl: "과제 제출 주소(비우면 사이트에서 제출)", weeks: "주차", prep: "준비물", prepTitle: "준비물 제목", fields: "신청서 항목", type: "입력 종류",
    required: "꼭 입력", placeholder: "입력 예시", options: "선택지", pattern: "형식 검사(정규식)", patternMsg: "형식 오류 문구", minLength: "최소 글자 수",
    text: "문구", poll: "투표", question: "질문", attendance: "출석", onlyClassDay: "수업 날짜에만 출석 가능", submission: "과제 제출", maxMB: "파일 최대 크기(MB)",
    accept: "받을 파일 형식", allowLate: "마감 후 제출 허용(지각 표시)", enabled: "사용", delaySeconds: "뜨기까지(초)", button: "버튼 글자", fireworks: "폭죽 효과 사용",
    message: "환영 문구", position: "직함", photo: "사진 파일 경로", bio: "소개", contacts: "연락처", org: "소속", semester: "학기", footerNote: "맨 아래 문구",
    blossom: "분홍색(예: #e2779f, 비우면 기본)", lilac: "보라색(예: #8f74cf, 비우면 기본)", id: "식별자(바꾸지 마세요)", doneTitle: "제출 완료 제목", doneBody: "제출 완료 안내",
    date: "날짜", concepts: "수업 핵심 질문(핵심 개념)", homework: "과제 칸", sessions: "요일별 수업", day: "요일(비우면 그 주 모든 수업)",
    badge: "표시(예: 중간고사 주간)", days: "수업 요일", holidays: "휴강일", materialsNote: "자료 안내 문구", info: "기본 정보", notes: "유의사항",
    notesTitle: "유의사항 제목", summary: "강의 개요", summaryTitle: "개요 제목", goals: "수업 목표", goalsTitle: "목표 제목", goalLead: "대표 목표",
    methods: "수업 방법·교재·과제", grading: "평가 항목", gradingTitle: "평가 제목", pct: "비율(%)", grades: "성적 기준", gradesTitle: "성적 기준 제목",
    range: "점수 구간", grade: "등급", attendanceRules: "출석 규정", attendanceTitle: "출석 규정 제목", tasks: "과제 안내", tasksTitle: "과제 안내 제목",
    etc: "기타 사항", etcTitle: "기타 사항 제목", failAbsences: "성적 미부여 결석 횟수", nationality: "국적",
    categories: "분류 목록", student: "학생(이름·학과 또는 팀)", week: "주차", kind: "자료 종류(비우면 자동)", sample: "샘플(링크 안 열림)"
  };
  var LONG = ["description", "body", "bio", "desc", "lead", "a", "text", "doneBody", "use", "subtitle", "note", "summary"];
  var kl = function (k) { return KL[k] || k; };
  function getAt(o, p) { return p.reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setAt(o, p, v) { var t = getAt(o, p.slice(0, -1)); t[p[p.length - 1]] = v; }
  function blank(v) {
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = blank(v[k]); }); return o; }
    if (typeof v === "number") return 0; if (typeof v === "boolean") return false; return "";
  }
  var P = function (p) { return esc(JSON.stringify(p)); };
  function itemTitle(it, i, key) {
    if (key === "weeks") return (i + 1) + "주차 · " + (it.topic || "");
    var t = it && (it.title || it.label || it.name || it.q || it.topic || it.value);
    return (i + 1) + ". " + (t ? String(t).slice(0, 40) : "");
  }
  function leaf(v, path, key) {
    var id = "ed-" + path.join("-"), lab = '<label class="lbl" for="' + id + '">' + esc(kl(key)) + "</label>";
    if (typeof v === "boolean") return '<label class="consent ed-bool"><input type="checkbox" id="' + id + '" data-path="' + P(path) + '"' + (v ? " checked" : "") + "><span>" + esc(kl(key)) + "</span></label>";
    if (typeof v === "number") return '<div class="ed-f">' + lab + '<input type="number" step="any" id="' + id + '" data-path="' + P(path) + '" data-t="num" value="' + esc(v) + '"></div>';
    var ro = key === "id" && v ? " readonly" : "";
    if (LONG.indexOf(key) >= 0 || String(v).length > 70) return '<div class="ed-f wide">' + lab + '<textarea id="' + id + '" rows="3" data-path="' + P(path) + '">' + esc(v) + "</textarea></div>";
    return '<div class="ed-f">' + lab + '<input type="text" id="' + id + '" data-path="' + P(path) + '" value="' + esc(v) + '"' + ro + "></div>";
  }
  function node(v, path, key, optional) {
    var rm = optional ? '<button type="button" class="text-btn danger" data-act="delkey" data-path="' + P(path) + '">이 항목 빼기</button>' : "";
    if (Array.isArray(v)) {
      var prim = v.length ? v.every(function (x) { return x == null || typeof x !== "object"; })
        : (["content", "options"].indexOf(key) >= 0 || (key === "items" && path[0] === "popup"));
      if (prim) {
        var id = "ed-" + path.join("-");
        return '<div class="ed-f wide"><label class="lbl" for="' + id + '">' + esc(kl(key)) + ' <small class="muted">· 한 줄에 하나씩</small></label><textarea id="' + id + '" rows="' + Math.max(3, v.length + 1) + '" data-path="' + P(path) + '" data-t="lines">' + esc(v.join("\n")) + "</textarea>" + rm + "</div>";
      }
      var keys = {}; v.forEach(function (it) { if (it && typeof it === "object") Object.keys(it).forEach(function (k) { keys[k] = keys[k] || it[k]; }); });
      return '<fieldset class="ed-arr"><legend>' + esc(kl(key)) + " <small class=\"muted\">" + v.length + "개</small></legend>" + rm +
        v.map(function (it, i) {
          var p = path.concat(i);
          var missing = Object.keys(keys).filter(function (k) { return !(k in it); });
          var body = typeof it === "object" && it ? Object.keys(it).map(function (k) {
            var opt = v.some(function (o) { return !(k in o); });
            return node(it[k], p.concat(k), k, opt);
          }).join("") : leaf(it, p, key);
          return '<details class="ed-item"' + (v.length <= 6 ? " open" : "") + '><summary><span>' + esc(itemTitle(it, i, key)) + '</span><span class="ed-ops">' +
            '<button type="button" data-act="up" data-path="' + P(p) + '" aria-label="위로"' + (i ? "" : " disabled") + ">↑</button>" +
            '<button type="button" data-act="down" data-path="' + P(p) + '" aria-label="아래로"' + (i < v.length - 1 ? "" : " disabled") + ">↓</button>" +
            '<button type="button" data-act="del" data-path="' + P(p) + '" aria-label="삭제" class="danger">삭제</button></span></summary>' +
            '<div class="ed-grid">' + body + "</div>" +
            (missing.length ? '<div class="adm-row">' + missing.map(function (k) { return '<button type="button" class="text-btn" data-act="addkey" data-key="' + esc(k) + '" data-path="' + P(p) + '">+ ' + esc(kl(k)) + " 추가</button>"; }).join("") + "</div>" : "") +
          "</details>";
        }).join("") +
        '<button type="button" class="btn ghost sm" data-act="add" data-path="' + P(path) + '">+ 항목 추가</button></fieldset>';
    }
    if (v && typeof v === "object") {
      return '<fieldset class="ed-obj"><legend>' + esc(kl(key)) + "</legend>" + rm + '<div class="ed-grid">' + Object.keys(v).map(function (k) { return node(v[k], path.concat(k), k, false); }).join("") + "</div></fieldset>";
    }
    return leaf(v, path, key) + (rm ? '<div class="ed-rm">' + rm + "</div>" : "");
  }
  function templateFor(p) {
    var t = window.SITE_CONFIG_FILE;
    for (var i = 0; i < p.length && t != null; i++) t = typeof p[i] === "number" ? t[0] : t[p[i]];
    if (Array.isArray(t)) { var src = t.filter(function (x) { return x && typeof x === "object"; })[0]; if (src) return blank(src); }
    var w = (window.SITE_CONFIG_FILE.curriculum || {}).weeks || [];
    if (p[p.length - 1] === "videos") return { title: "", url: "" };
    return "";
  }
  function tEdit(main) {
    var sec = draft[edSection];
    main.innerHTML = bar("사이트 내용 편집", '<span class="chip ' + (dirty ? "now" : "past") + '" id="edDirty">' + (dirty ? "적용 안 한 변경 있음" : "변경 없음") + "</span>") +
      '<p class="muted small">고친 뒤 <b>적용하기</b>를 누르면 사이트에 바로 반영됩니다.' + (Store.mode() === "cloud" ? " 공유 저장소에 저장되어 모든 방문자에게 보입니다." : " 이 브라우저에만 저장되므로, 다른 곳에 반영하려면 ‘설정 파일 · 비밀번호’에서 config.js로 저장하세요.") + "</p>" +
      '<div class="ed-top"><label class="lbl" for="edSec">고칠 부분</label><select id="edSec">' + SECTIONS.filter(function (s) { return s[0] in draft; }).map(function (s) {
        return '<option value="' + s[0] + '"' + (s[0] === edSection ? " selected" : "") + ">" + s[1] + "</option>";
      }).join("") + "</select></div>" +
      '<div class="ed" id="ed">' + (sec == null ? '<p class="adm-empty">이 항목이 설정에 없습니다.</p>' : node(sec, [edSection], (SECTIONS.filter(function (s) { return s[0] === edSection; })[0] || [0, edSection])[1], false)) + "</div>" +
      '<div class="ed-actions"><button type="button" class="btn primary" id="edApply">적용하기</button><button type="button" class="btn ghost" id="edRevert">고친 내용 되돌리기</button><span class="form-err" id="edErr" role="alert"></span></div>';
    var ed = $("#ed");
    var markDirty = function () { dirty = true; var c = $("#edDirty"); if (c) { c.textContent = "적용 안 한 변경 있음"; c.className = "chip now"; } };
    $("#edSec").addEventListener("change", function () { edSection = this.value; tEdit(main); });
    var onInput = function (e) {
      var t = e.target; if (!t.dataset || !t.dataset.path) return;
      var p = JSON.parse(t.dataset.path), v;
      if (t.type === "checkbox") v = t.checked;
      else if (t.dataset.t === "num") v = t.value === "" ? 0 : Number(t.value);
      else if (t.dataset.t === "lines") v = t.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      else v = t.value;
      setAt(draft, p, v); markDirty();
    };
    ed.addEventListener("input", onInput); ed.addEventListener("change", onInput);
    ed.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      e.preventDefault();
      var p = JSON.parse(b.dataset.path), act = b.dataset.act, y = main.scrollTop;
      if (act === "add") { var arr = getAt(draft, p); arr.push(arr.length ? blank(arr[arr.length - 1]) : templateFor(p)); }
      else if (act === "addkey") {
        var it = getAt(draft, p), arr2 = getAt(draft, p.slice(0, -1)), src = arr2.filter(function (o) { return o && b.dataset.key in o; })[0];
        it[b.dataset.key] = blank(src[b.dataset.key]);
      } else if (act === "delkey") { var parent = getAt(draft, p.slice(0, -1)); delete parent[p[p.length - 1]]; }
      else {
        var list = getAt(draft, p.slice(0, -1)), i = p[p.length - 1];
        if (act === "del") list.splice(i, 1);
        if (act === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
        if (act === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      }
      dirty = true; tEdit(main); main.scrollTop = y;
      if (act === "add") {
        var np = JSON.stringify(p.concat(getAt(draft, p).length - 1)).slice(0, -1);
        var f = $$("[data-path]", main).filter(function (x) { return x.dataset.path.indexOf(np) === 0; })[0];
        if (f) { var dd = f.closest("details"); if (dd) dd.open = true; f.focus(); }
      }
    });
    $("#edApply").addEventListener("click", function () {
      var b = this; b.disabled = true;
      applyConfig(clone(draft), true).then(function () { dirty = false; b.disabled = false; tEdit(main); toast("사이트에 적용했습니다."); },
        function () { b.disabled = false; $("#edErr").textContent = "저장하지 못했습니다. 편집 권한을 확인해 주세요."; });
    });
    $("#edRevert").addEventListener("click", function () { draft = clone(window.SITE_CONFIG); dirty = false; tEdit(main); });
  }

  /* ---- 설정 파일 · 비밀번호 ---- */
  function tSettings(main) {
    var cloud = Store.mode() === "cloud";
    var src = window.SITE_CONFIG_SOURCE === "browser" ? "이 브라우저에 저장된 수정본" : window.SITE_CONFIG_SOURCE === "shared" ? "공유 저장소에 저장된 수정본" : "config.js 파일";
    main.innerHTML = bar("설정 파일 · 비밀번호") +
      '<div class="adm-card"><h3>지금 쓰는 설정</h3><p class="muted">' + src + "</p>" +
        '<div class="adm-row">' +
          (cloud ? "" : '<button type="button" class="btn primary sm" id="sfJs">config.js로 저장</button>') +
          '<button type="button" class="btn ' + (cloud ? "primary" : "ghost") + ' sm" id="sfJson">설정 파일(.json)로 저장</button>' +
          '<label class="btn ghost sm file-btn" for="sfLoad">설정 파일 불러오기</label><input type="file" id="sfLoad" accept=".json,.js,.txt" hidden>' +
        "</div>" +
        '<p class="muted small">' + (cloud
          ? "저장한 .json 파일은 다음에 이 메뉴에서 불러오면 그대로 되살아납니다. 서버 없는 사이트 묶음(index.html)에 넣으려면, 컴퓨터에서 index.html을 열고 관리자 화면에서 이 파일을 불러온 뒤 ‘config.js로 저장’하세요."
          : "‘config.js로 저장’한 파일로 assets 폴더의 config.js를 바꾸면, 고친 내용이 어느 컴퓨터에서 열어도 적용됩니다.") + "</p>" +
        '<p class="form-err" id="sfErr" role="alert"></p>' +
        '<div class="adm-row"><button type="button" class="text-btn danger" id="sfReset">처음 상태(config.js 파일 내용)로 되돌리기</button></div></div>' +
      '<form class="adm-card adm-form" id="pwForm" novalidate><h3>관리자 비밀번호 변경</h3>' +
        '<p class="muted small">비밀번호는 그대로 저장하지 않고 되돌릴 수 없는 암호화 값(해시)으로만 설정에 들어갑니다.</p>' +
        '<label class="lbl" for="pwNew">새 비밀번호 (8자 이상)</label><input type="password" id="pwNew" autocomplete="new-password">' +
        '<label class="lbl" for="pwNew2">새 비밀번호 확인</label><input type="password" id="pwNew2" autocomplete="new-password">' +
        '<p class="form-err" id="pwErr" role="alert"></p><button type="submit" class="btn primary sm">비밀번호 바꾸기</button></form>';
    var fileOk = function (r) { if (r !== "declined") toast("설정 파일을 저장했습니다."); };
    var j = $("#sfJs"); if (j) j.addEventListener("click", function () { saveFile("config.js", configFileText(window.SITE_CONFIG)).then(fileOk, function (e) { $("#sfErr").textContent = saveErr(e); }); });
    $("#sfJson").addEventListener("click", function () { saveFile("site-settings_" + stamp() + ".json", JSON.stringify(window.SITE_CONFIG, null, 2)).then(fileOk, function (e) { $("#sfErr").textContent = saveErr(e); }); });
    $("#sfLoad").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      readText(f).then(function (t) {
        var cfg = parseConfigText(t);
        if (!cfg || !cfg.site || !cfg.nav || !cfg.hero) { $("#sfErr").textContent = "설정 파일을 읽지 못했습니다. 관리자 화면에서 저장한 파일인지 확인해 주세요."; return; }
        if (!cfg.admin) cfg.admin = clone(window.SITE_CONFIG.admin);
        return applyConfig(cfg, true).then(function () { draft = clone(cfg); dirty = false; window.SITE_CONFIG_SOURCE = cloud ? "shared" : "browser"; toast("설정 파일을 불러와 적용했습니다."); tSettings(main); });
      }).catch(function () { $("#sfErr").textContent = "파일을 적용하지 못했습니다."; });
    });
    $("#sfReset").addEventListener("click", function () {
      var b = this; if (b.dataset.confirm !== "1") { b.dataset.confirm = "1"; b.textContent = "화면에서 고친 내용이 모두 사라집니다. 한 번 더 누르면 되돌립니다"; return; }
      resetConfig().then(function () { draft = clone(window.SITE_CONFIG); dirty = false; window.SITE_CONFIG_SOURCE = ""; toast("처음 상태로 되돌렸습니다."); tSettings(main); });
    });
    $("#pwForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var a = $("#pwNew").value, b = $("#pwNew2").value, err = $("#pwErr");
      if (a.length < 8) { err.textContent = "8자 이상으로 정해 주세요."; $("#pwNew").focus(); return; }
      if (a !== b) { err.textContent = "두 비밀번호가 다릅니다."; $("#pwNew2").focus(); return; }
      var salt = "akd-" + Math.random().toString(36).slice(2, 10), cfg = clone(window.SITE_CONFIG);
      cfg.admin = { salt: salt, passwordHash: hashPw(salt, a) };
      applyConfig(cfg, true).then(function () {
        try { sessionStorage.setItem("akd:admin", cfg.admin.passwordHash); } catch (x) {}
        draft = clone(cfg); window.SITE_CONFIG_SOURCE = cloud ? "shared" : "browser";
        toast("비밀번호를 바꿨습니다."); tSettings(main);
        $("#sfErr").textContent = cloud ? "" : "다른 컴퓨터에서도 새 비밀번호를 쓰려면 config.js로 저장해 파일을 바꿔 주세요.";
      }, function () { err.textContent = "저장하지 못했습니다."; });
    });
  }

  /* ================= 시작 ================= */
  var lock = $("#lockBtn");
  if (lock) lock.addEventListener("click", openLogin);
  drawLockState();
  window.SITE_READY.then(function () {
    if (Store.mode() === "cloud") {
      return Store.get("site/config").then(function (d) {
        if (!d || !d.json) return;
        try { var cfg = JSON.parse(d.json); window.SITE_CONFIG_SOURCE = "shared"; applyConfig(cfg, false); } catch (e) {}
        try { isAdmin = sessionStorage.getItem("akd:admin") === (window.SITE_CONFIG.admin || {}).passwordHash; } catch (e) {}
        drawLockState();
      }, function () {});
    }
  }).then(loadNotices, loadNotices);
})();
