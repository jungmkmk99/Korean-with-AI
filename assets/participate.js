/* 수강생 참여 기능 — 투표 · 수강 신청서 · 로그인 · 출석 · 과제 제출 · 첫 방문 팝업 · 환영 효과
   내용은 config.js에서 읽어 옵니다. 보통은 이 파일을 고칠 필요가 없습니다.

   저장 방식
   - claude.ai에 게시된 페이지: 참여 내용이 서버(공유 저장소)에 저장되어 교수자가 모아 볼 수 있습니다.
   - 컴퓨터에서 index.html을 직접 연 경우: '체험 모드'로, 이 브라우저에만 저장됩니다. */
(function () {
  var C = window.SITE_CONFIG, R = window.SITE_RUNTIME;
  if (!C || !R) return;
  var esc = R.esc, icon = R.icon;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var P = C.participate || {};
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var hm = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };

  /* ================= 저장소 ================= */
  var Store = (function () {
    var mode = "loading", db = null, uid = null, canWrite = true, canEdit = false, local = {};
    function lsGet(k) { try { var v = localStorage.getItem("akd:" + k); return v ? JSON.parse(v) : null; } catch (e) { return local[k] || null; } }
    function lsSet(k, v) { try { localStorage.setItem("akd:" + k, JSON.stringify(v)); } catch (e) { local[k] = v; } }
    function lsDel(k) { try { localStorage.removeItem("akd:" + k); } catch (e) { delete local[k]; } }
    function lsKeys() { var out = []; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("akd:") === 0) out.push(k.slice(4)); } } catch (e) { out = Object.keys(local); } return out; }
    var subs = [];
    function notify() { subs.forEach(function (f) { f(); }); }

    /* 배포 서버(Railway + PostgreSQL)의 저장 API를 claude 저장소와 같은 모양으로 감쌈 */
    var server = false, adminToken = null, watchers = [], pollTimer = null, srvApproved = false;
    /* 관리자 로그인 토큰은 이 브라우저에 보관 → 새로고침하거나 창을 닫았다 열어도 로그인 유지(서버 기준 30일) */
    function tokenGet() { var t = lsGet("adminToken"); if (!t) { try { t = sessionStorage.getItem("akd:adminToken"); } catch (e) {} } return t || null; }
    function tokenSet(v) { if (v) lsSet("adminToken", v); else lsDel("adminToken"); try { sessionStorage.removeItem("akd:adminToken"); } catch (e) {} }
    function clientKey() {
      var k = lsGet("clientKey");
      if (!k) {
        var a = new Uint8Array(24); (window.crypto || window.msCrypto).getRandomValues(a);
        k = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
        lsSet("clientKey", k);
      }
      return k;
    }
    function api(method, url, body) {
      var headers = { "X-Client-Key": clientKey() };
      if (adminToken) headers["X-Admin-Token"] = adminToken;
      if (body !== undefined) headers["Content-Type"] = "application/json";
      return fetch(url, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok) return j;
          throw { code: r.status === 413 ? "quota_exceeded" : (j.code || "http_" + r.status), status: r.status };
        });
      });
    }
    function pollAll() { watchers.forEach(function (w) { w.tick(); }); }
    function watch(fetcher, key, cb, err) {
      var last = null, w = { tick: function () {
        fetcher().then(function (v) { var s = key(v); if (s !== last) { last = s; cb(v); } }, function (e) { if (err) err(e); });
      } };
      watchers.push(w); w.tick();
      if (!pollTimer) pollTimer = setInterval(pollAll, 5000);
      return function () { watchers = watchers.filter(function (x) { return x !== w; }); };
    }
    var serverDb = {
      doc: function (path) {
        var q = "?path=" + encodeURIComponent(path);
        var get = function () { return api("GET", "/api/doc" + q).then(function (j) { return { exists: !!j.exists, data: function () { return j.data; } }; }); };
        return {
          get: get,
          set: function (data) { return api("PUT", "/api/doc" + q, { data: data }).then(pollAll); },
          delete: function () { return api("DELETE", "/api/doc" + q).then(pollAll); },
          onSnapshot: function (cb, err) { return watch(get, function (s) { return JSON.stringify([s.exists, s.data()]); }, cb, err); }
        };
      },
      collection: function (col) {
        var get = function () {
          return api("GET", "/api/col?path=" + encodeURIComponent(col)).then(function (rows) {
            return { docs: rows.map(function (x) { return { id: x.id, data: function () { return x.data; } }; }) };
          });
        };
        return { get: get, onSnapshot: function (cb, err) {
          return watch(get, function (q) { return JSON.stringify(q.docs.map(function (d) { return [d.id, d.data()]; })); }, cb, err);
        } };
      }
    };
    function adminLogin(pw) {
      if (!server) return Promise.resolve();
      return api("POST", "/api/admin/login", { password: pw }).then(function (j) { adminToken = j.token; tokenSet(adminToken); });
    }
    function adminLogout() {
      if (!server || !adminToken) return Promise.resolve();
      var p = api("POST", "/api/admin/logout", {}).catch(function () {});
      adminToken = null; tokenSet(null); return p;
    }

    function init() {
      var useLocal = function () {
        mode = "local";
        uid = lsGet("uid"); if (!uid) { uid = "local-" + Math.random().toString(36).slice(2, 10); lsSet("uid", uid); }
      };
      if (!(window.claude && typeof window.claude.use === "function")) {
        if (location.protocol !== "http:" && location.protocol !== "https:") { useLocal(); return Promise.resolve(); }
        adminToken = tokenGet();
        return api("GET", "/api/me").then(function (j) {
          if (!j || !j.uid) throw {};
          server = true; db = serverDb; uid = j.uid; mode = "cloud"; canWrite = true; srvApproved = !!j.approved;
          if (!j.admin) { adminToken = null; tokenSet(null); } else tokenSet(adminToken);
        }).catch(function () { server = false; adminToken = null; useLocal(); });
      }
      return Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
        if (!r[0] || !r[1]) { mode = "offline"; return; }
        db = r[0];
        return Promise.all([r[1].id(), r[1].can("data.write"), r[1].canEdit()]).then(function (x) {
          uid = x[0];
          if (!uid) { mode = "offline"; return; }
          mode = "cloud";
          canWrite = x[1] !== false;
          canEdit = !!x[2];
        });
      }).catch(function () { mode = "offline"; });
    }
    function get(path) {
      if (mode === "cloud") return db.doc(path).get().then(function (s) { return s.exists ? s.data() : null; });
      return Promise.resolve(lsGet(path));
    }
    function set(path, data) {
      if (mode === "cloud") return db.doc(path).set(data);
      lsSet(path, data); notify(); return Promise.resolve();
    }
    function del(path) {
      if (mode === "cloud") return db.doc(path).delete();
      lsDel(path); notify(); return Promise.resolve();
    }
    function watchDoc(path, cb) {
      if (mode === "cloud") return db.doc(path).onSnapshot(function (s) { cb(s.exists ? s.data() : null); }, function () { cb(null); });
      var f = function () { cb(lsGet(path)); }; subs.push(f); f(); return function () {};
    }
    function list(col) {
      if (mode === "cloud") return db.collection(col).get().then(function (q) { return q.docs.map(function (d) { return { id: d.id, data: d.data() }; }); });
      return Promise.resolve(lsKeys().filter(function (k) { return k.indexOf(col + "/") === 0 && k.split("/").length === col.split("/").length + 1; })
        .map(function (k) { return { id: k.split("/").pop(), data: lsGet(k) }; }));
    }
    function watchCollection(col, cb) {
      if (mode === "cloud") return db.collection(col).onSnapshot(function (q) {
        cb(q.docs.map(function (d) { return { id: d.id, data: d.data() }; }));
      }, function () { cb([]); });
      var f = function () {
        cb(lsKeys().filter(function (k) { return k.indexOf(col + "/") === 0 && k.split("/").length === col.split("/").length + 1; })
          .map(function (k) { return { id: k.split("/").pop(), data: lsGet(k) }; }));
      };
      subs.push(f); f(); return function () {};
    }
    /* 서버에 내 승인 상태를 다시 물어봄 */
    function refreshMe() {
      if (!server) return Promise.resolve(null);
      return api("GET", "/api/me").then(function (j) {
        srvApproved = !!j.approved;
        if (!j.admin && adminToken) { adminToken = null; tokenSet(null); }
        return j;
      });
    }
    /* 지금 적용할 사이트 설정(승인 전이면 주차별 자료 · 영상이 빠진 것) */
    function fetchConfig() { return server ? api("GET", "/api/config") : Promise.reject({ code: "no_server" }); }
    return {
      init: init, get: get, set: set, del: del, list: list, watchDoc: watchDoc, watchCollection: watchCollection,
      refreshMe: refreshMe, fetchConfig: fetchConfig, srvApproved: function () { return srvApproved; },
      mode: function () { return mode; }, uid: function () { return uid; }, canWrite: function () { return canWrite; },
      canEdit: function () { return mode === "local" || (server ? !!adminToken : canEdit); },
      isServer: function () { return server; }, adminLogin: adminLogin, adminLogout: adminLogout
    };
  })();

  /* 체험 모드·권한 안내 */
  function modeNote() {
    var m = Store.mode();
    if (m === "local") return '<p class="mode-note">' + icon("pending") + "<span><b>체험 모드</b> · 저장 서버에 연결되지 않아 참여 내용이 이 브라우저에만 저장됩니다. 배포된 사이트에서는 모든 수강생의 참여 내용이 데이터베이스에 모입니다.</span></p>";
    if (m === "offline") return '<p class="mode-note warn">' + icon("pending") + "<span>참여 기능을 쓰려면 claude.ai에 로그인한 상태로 이 페이지를 열어 주세요.</span></p>";
    if (m === "cloud" && !Store.canWrite()) return '<p class="mode-note warn">' + icon("pending") + "<span>이 페이지를 보기 권한으로 열었습니다. 참여하려면 교수자에게 참여 권한을 요청해 주세요.</span></p>";
    return "";
  }
  var writable = function () { return (Store.mode() === "cloud" && Store.canWrite()) || Store.mode() === "local"; };
  function failMsg(e) {
    var c = e && e.code;
    if (c === "invalid_argument") return "저장 권한이 없습니다. 교수자에게 참여 권한을 요청해 주세요.";
    if (c === "quota_exceeded") return "저장 공간이 가득 찼습니다. 교수자에게 알려 주세요.";
    return "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  /* ================= 화면 뼈대 ================= */
  function skeleton() {
  var mount = $("#partMount"), applyMount = $("#apply");
  if (!mount || !applyMount) return false;
  mount.innerHTML =
    '<div id="modeNote"></div>' +
    '<div class="part-grid"><div class="part-col">' +
      '<div class="card part-card login-card" id="loginCard"><p class="loading">불러오는 중…</p></div>' +
      '<div class="card part-card" id="attendCard"><p class="loading">불러오는 중…</p></div>' +
      '<div class="card part-card" id="submitCard"><p class="loading">불러오는 중…</p></div>' +
    '</div><div class="part-col">' +
      '<div class="card part-card poll-card" id="pollCard"><p class="loading">불러오는 중…</p></div>' +
    "</div></div>";
  applyMount.innerHTML = '<div class="card apply-card"><p class="loading">신청서를 불러오는 중…</p></div>';
  return true;
  }
  if (!skeleton()) return;

  var me = null; // 로그인 정보 {name, studentId}

  /* ================= 접근 권한 (관리자 승인) =================
     주차별 강의 계획은 누구나 보고, 구글 드라이브 자료 · 참고 영상 · 과제 제출은 승인된 수강생과 관리자만 씁니다. 배포 서버는 승인 전이면 자료 · 영상을 아예 보내지 않습니다. */
  var ACC = window.SITE_ACCESS = window.SITE_ACCESS || { known: false, admin: false, approved: false };
  var accTimer = null, accKey = "";
  var nm = function (s) { return String(s || "").replace(/\s+/g, ""); };
  var sees = function () { return !!(ACC.admin || ACC.approved); };
  function rerender() { if (window.SITE_RERENDER) window.SITE_RERENDER(); else { if (window.renderSite) window.renderSite(); redraw(); } }
  function refreshAccess(initial) {
    var before = sees();
    var ask = Store.isServer()
      ? (initial ? Promise.resolve(Store.srvApproved()) : Store.refreshMe().then(function (j) { return !!(j && j.approved); }, function () { return Store.srvApproved(); }))
      : (me ? Store.get("approvals/" + me.studentId).then(function (a) { return !!a && (!a.name || nm(a.name) === nm(me.name)); }, function () { return false; }) : Promise.resolve(false));
    return ask.then(function (ok) {
      ACC.approved = ok; ACC.known = true; ACC.loggedIn = !!me; ACC.name = me ? me.name : ""; ACC.pending = !!me && !ok;
      clearTimeout(accTimer);
      if (ACC.pending && Store.isServer()) accTimer = setTimeout(function () { refreshAccess(false); }, 30000); // 승인되면 30초 안에 자동으로 열림
      var key = JSON.stringify([ACC.approved, ACC.loggedIn, ACC.name, ACC.admin]);
      if (!initial && before !== sees() && Store.isServer() && window.SITE_LOAD_CONFIG) { accKey = key; return window.SITE_LOAD_CONFIG(); }
      if (key !== accKey || initial) { accKey = key; rerender(); }
    });
  }
  window.SITE_ACCESS_REFRESH = function () { return refreshAccess(false); };

  /* ================= 로그인 ================= */
  function drawLogin() {
    var el = $("#loginCard");
    if (me) {
      el.innerHTML = '<div class="login-done"><span class="avatar">' + esc(me.name.charAt(0)) + '</span><div><span class="kicker">로그인됨</span><h3>' + esc(me.name) + ' 님</h3><p class="muted">학번 ' + esc(me.studentId) + '</p></div></div>' +
        (ACC.known && !ACC.admin ? (ACC.approved
          ? '<p class="appr ok"><span class="chip now">승인됨</span> 수업 자료 · 참고 영상을 보고 과제를 제출할 수 있습니다.</p>'
          : '<p class="appr"><span class="chip past">승인 대기</span> 교수자가 승인하면 수업 자료 · 참고 영상과 과제 제출이 열립니다.</p>') : "") +
        '<button type="button" class="text-btn" id="relogin">다른 학번으로 로그인</button>';
      $("#relogin").addEventListener("click", function () { me = null; drawLogin(); drawAttend(); drawSubmit(); refreshAccess(false); });
      return;
    }
    el.innerHTML = '<span class="kicker">Login</span><h3>수강생 로그인</h3><p class="muted">이름과 학번을 입력하면 출석 체크와 과제 제출을 할 수 있습니다.</p>' +
      '<form id="loginForm" class="login-form" novalidate>' +
        '<label for="lgName">이름</label><input id="lgName" type="text" autocomplete="name" placeholder="홍길동">' +
        '<label for="lgId">학번</label><input id="lgId" type="text" inputmode="numeric" placeholder="숫자 10자리">' +
        '<p class="form-err" id="lgErr" role="alert"></p>' +
        '<button type="submit" class="btn primary sm"' + (writable() ? "" : " disabled") + '>로그인</button>' +
      "</form>";
    $("#loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("#lgName").value.trim(), id = $("#lgId").value.trim(), miss = [];
      if (!n) miss.push("이름"); if (!id) miss.push("학번");
      if (miss.length) { $("#lgErr").textContent = miss.join(", ") + "을(를) 입력해 주세요."; (n ? $("#lgId") : $("#lgName")).focus(); return; }
      if (!/^\d{10}$/.test(id)) { $("#lgErr").textContent = "학번은 숫자 10자리로 적어 주세요."; $("#lgId").focus(); return; }
      var data = { name: n, studentId: id, at: new Date().toISOString() };
      Store.set("roster/" + Store.uid(), data).then(function () { me = data; drawLogin(); drawAttend(); drawSubmit(); prefillApply(); refreshAccess(false); },
        function (er) { $("#lgErr").textContent = failMsg(er); });
    });
  }

  /* ================= 투표 ================= */
  var votes = [], myVote = null;
  function drawPoll() {
    var poll = P.poll || { options: [] }, el = $("#pollCard");
    var counts = {}; poll.options.forEach(function (o) { counts[o.id] = 0; });
    votes.forEach(function (v) { if (v.data && counts.hasOwnProperty(v.data.choice)) counts[v.data.choice]++; });
    var total = votes.filter(function (v) { return v.data && counts.hasOwnProperty(v.data.choice); }).length;
    var max = Math.max.apply(null, poll.options.map(function (o) { return counts[o.id]; }).concat([1]));
    el.innerHTML = '<div class="poll-head"><div><span class="kicker">Live poll</span><h3>' + esc(poll.question) + '</h3></div><span class="live"><i></i>실시간</span></div>' +
      '<p class="muted small">' + (myVote ? "다른 항목을 누르면 내 선택을 바꿀 수 있습니다." : "하나를 골라 누르면 바로 반영됩니다.") + "</p>" +
      '<ul class="poll-list" role="list">' + poll.options.map(function (o) {
        var c = counts[o.id], pct = total ? Math.round(c / total * 100) : 0, mine = myVote === o.id;
        return '<li><button type="button" class="poll-opt' + (mine ? " mine" : "") + '" data-choice="' + esc(o.id) + '" aria-pressed="' + mine + '"' + (writable() ? "" : " disabled") + ' title="' + esc(o.label) + ": " + c + "표 (" + pct + '%)">' +
          '<span class="po-top"><span class="po-label">' + esc(o.label) + (mine ? ' <span class="chip now">내 선택</span>' : "") + '</span><span class="po-val">' + c + "표 · " + pct + "%</span></span>" +
          '<span class="po-track"><span class="po-bar" style="width:' + (c ? Math.max(2, c / max * 100) : 0) + '%"></span></span>' +
        "</button></li>";
      }).join("") + "</ul>" +
      '<p class="poll-total">총 <b>' + total + "</b>명 참여" + (Store.mode() === "local" ? " (체험 모드: 이 브라우저의 투표만 집계)" : "") + '</p><p class="form-err" id="pollErr" role="alert"></p>';
  }
  function bindPoll() {
    $("#pollCard").addEventListener("click", function (e) {
      var b = e.target.closest("[data-choice]"); if (!b || b.disabled) return;
      var choice = b.dataset.choice; if (choice === myVote) return;
      var prev = myVote; myVote = choice; drawPoll();
      Store.set("poll/" + Store.uid(), { choice: choice, at: new Date().toISOString() }).catch(function (er) {
        myVote = prev; drawPoll(); $("#pollErr").textContent = failMsg(er);
      });
    });
  }

  /* ================= 출석 ================= */
  var attend = {};
  /* 출석은 수업(세션) 단위로 기록합니다. 키 = 수업 날짜(예: 2026-10-06) */
  function sessionsList() { return (R.sessions || []).filter(function (s) { return !s.holiday; }); }
  function todaySession() { var k = R.keyOf(new Date()); return sessionsList().filter(function (s) { return s.key === k; })[0] || null; }
  function nextSession() { var t = new Date(); t.setHours(0, 0, 0, 0); return sessionsList().filter(function (s) { return s.date >= t; })[0] || null; }
  function drawAttend() {
    var el = $("#attendCard"), ts = todaySession(), only = !(P.attendance && P.attendance.onlyClassDay === false);
    var target = ts || (only ? null : nextSession());
    var fail = (P.attendance && P.attendance.failAbsences) || 0;
    var h = '<span class="kicker">Attendance</span><h3>출석 체크</h3>';
    if (!me) {
      h += '<p class="muted">로그인하면 출석할 수 있습니다.</p>';
    } else if (target && attend[target.id]) {
      h += '<div class="att-done">' + icon("check") + "<div><b>" + target.n + "주차 " + esc(target.day) + "요일 출석 완료</b><span>" + esc(R.fmtDay(target.date)) + " " + hm(new Date(attend[target.id])) + "</span></div></div>";
    } else if (target) {
      h += '<p class="muted">' + target.n + "주차 " + esc(target.day) + "요일 · " + esc(R.fmtDay(target.date)) + " " + esc(target.w.time) + "<br><b>" + esc(target.title) + "</b></p>" +
        '<button type="button" class="btn primary" id="attBtn"' + (writable() ? "" : " disabled") + ">" + icon("check") + "지금 출석하기</button>";
    } else {
      var ns = nextSession();
      h += '<p class="muted">오늘은 수업이 없습니다.' + (ns ? "<br>다음 출석: <b>" + ns.n + "주차 " + esc(ns.day) + "요일 · " + esc(R.fmtDay(ns.date)) + "</b>" : "") + "</p>";
    }
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var done = 0, held = 0, miss = 0;
    h += '<ol class="att-grid" aria-label="수업별 출석 현황">' + (R.sessions || []).map(function (s) {
      var st = s.holiday ? "hol" : attend[s.id] ? "ok" : (s.date < t0 ? "miss" : "todo");
      if (!s.holiday && (s.date <= t0 || attend[s.id])) held++;
      if (st === "ok") done++; if (st === "miss") miss++;
      var lbl = { ok: "출석", miss: "미출석", todo: "예정", hol: "휴강" }[st];
      return '<li class="att ' + st + '" title="' + s.n + "주차 " + esc(s.day) + " " + esc(R.fmtDay(s.date)) + " · " + lbl + '"><span>' + s.n + "<small>" + esc(s.day) + "</small></span></li>";
    }).join("") + "</ol>" +
      '<p class="att-legend"><span><i class="ok"></i>출석</span><span><i class="miss"></i>미출석</span><span><i class="todo"></i>예정</span><span><i class="hol"></i>휴강</span>' + (me ? '<span class="att-sum">출석 ' + done + " / " + held + "회</span>" : "") + "</p>" +
      (me && fail ? '<p class="att-warn' + (miss >= fail - 2 ? " on" : "") + '">미출석 ' + miss + "회 · " + fail + "회 이상 결석하면 성적을 받을 수 없습니다.</p>" : "") +
      '<p class="form-err" id="attErr" role="alert"></p>';
    el.innerHTML = h;
    var b = $("#attBtn");
    if (b) b.addEventListener("click", function () {
      b.disabled = true;
      var next = Object.assign({}, attend); next[target.id] = new Date().toISOString();
      Store.set("attendance/" + Store.uid(), { name: me.name, studentId: me.studentId, records: next }).then(function () {
        attend = next; drawAttend();
      }, function (er) { b.disabled = false; $("#attErr").textContent = failMsg(er); });
    });
  }

  /* ================= 과제 제출 ================= */
  var subs = {}, selWeek = null, CHUNK = 180000;
  var assignWeeks = R.weeks.filter(function (w) { return w.raw.assignment; });
  function defaultWeek() {
    var now = new Date();
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var up = assignWeeks.filter(function (w) { return w.due && w.due > now; })[0]
      || assignWeeks.filter(function (w) { return !w.due && w.end >= t0; })[0];
    return (up || assignWeeks[assignWeeks.length - 1] || {}).n;
  }
  function fmtSize(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(b / 1024)) + "KB"; }
  function drawSubmit() {
    var el = $("#submitCard"), S = P.submission || {};
    if (R.locked) { el.innerHTML = '<span class="kicker">Assignment</span><h3>과제 제출</h3><p class="muted">과제 안내는 ‘주차별 강의 계획’에서 볼 수 있고, 제출은 관리자 승인을 받은 뒤에 할 수 있습니다.</p>'; return; }
    if (!assignWeeks.length) { el.innerHTML = '<h3>과제 제출</h3><p class="muted">등록된 과제가 없습니다.</p>'; return; }
    if (selWeek == null) selWeek = defaultWeek();
    var w = assignWeeks.filter(function (x) { return x.n === selWeek; })[0] || assignWeeks[0];
    var r = R.remain(w.due), mine = subs[w.n];
    var h = '<span class="kicker">Assignment</span><h3>과제 제출</h3>' +
      '<label class="lbl" for="subSel">과제 선택</label><select id="subSel">' + assignWeeks.map(function (x) {
        return '<option value="' + x.n + '"' + (x.n === w.n ? " selected" : "") + ">" + x.n + "주차 · " + esc(x.raw.assignment.title) + (subs[x.n] ? " ✓" : "") + "</option>";
      }).join("") + "</select>" +
      '<div class="sub-due">' + (w.due ? "<span>마감 " + esc(R.fmtDue(w.due)) + "</span>" : "") + '<span class="due-pill ' + r.cls + '"' + (w.due ? ' data-due="' + w.n + '"' : "") + ">" + esc(r.text) + "</span></div>";
    if (mine) {
      h += '<div class="sub-done">' + icon("doc") + "<div><b>" + esc(mine.fileName) + "</b><span>" + fmtSize(mine.size) + " · " + esc(R.fmtDue(new Date(mine.at))) + " 제출" + (mine.late ? ' <span class="chip past">지각</span>' : "") + "</span></div></div>";
    }
    var closed = r.cls === "closed" && S.allowLate === false;
    if (!me) {
      h += '<p class="muted">로그인하면 과제 파일을 제출할 수 있습니다.</p>';
    } else if (closed) {
      h += '<p class="muted">마감된 과제입니다.</p>';
    } else {
      h += '<label class="drop" id="drop" for="subFile">' + icon("upload") +
          '<span id="dropText">' + (mine ? "다시 제출하려면 파일을 선택하세요" : "파일을 끌어다 놓거나 눌러서 선택") + "</span>" +
          '<small>' + esc((S.accept || "").replace(/,/g, " ")) + " · 최대 " + (S.maxMB || 3) + "MB</small></label>" +
        '<input type="file" id="subFile" accept="' + esc(S.accept || "") + '" hidden>' +
        '<button type="button" class="btn primary sm" id="subBtn" disabled>' + icon("upload") + (mine ? "다시 제출하기" : "제출하기") + "</button>" +
        (r.cls === "closed" ? '<p class="muted small">마감이 지났습니다. 지금 제출하면 지각으로 표시됩니다.</p>' : "");
    }
    h += '<p class="form-err" id="subErr" role="alert"></p>' + (Store.mode() === "local" ? '<p class="muted small">체험 모드에서는 파일 이름과 크기만 기록됩니다.</p>' : "");
    el.innerHTML = h;

    $("#subSel").addEventListener("change", function () { selWeek = +this.value; drawSubmit(); });
    var input = $("#subFile"), btn = $("#subBtn"), drop = $("#drop"), file = null;
    if (!input) return;
    function pick(f) {
      $("#subErr").textContent = "";
      if (!f) return;
      var max = (S.maxMB || 3) * 1048576, ext = "." + f.name.split(".").pop().toLowerCase();
      var okTypes = (S.accept || "").toLowerCase().split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      if (okTypes.length && okTypes.indexOf(ext) < 0) { $("#subErr").textContent = "받을 수 없는 파일 형식입니다. (" + okTypes.join(" ") + ")"; return; }
      if (f.size > max) { $("#subErr").textContent = "파일이 너무 큽니다. " + (S.maxMB || 3) + "MB 이하로 올려 주세요."; return; }
      file = f; $("#dropText").textContent = f.name + " (" + fmtSize(f.size) + ")"; drop.classList.add("has-file"); btn.disabled = !writable();
    }
    input.addEventListener("change", function () { pick(input.files[0]); });
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { pick(e.dataTransfer.files[0]); });
    btn.addEventListener("click", function () {
      if (!file) return;
      btn.disabled = true; btn.lastChild.textContent = "올리는 중…";
      upload(w, file).then(function () { drawSubmit(); }, function (er) {
        btn.disabled = false; btn.lastChild.textContent = "제출하기"; $("#subErr").textContent = failMsg(er);
      });
    });
  }
  function upload(w, f) {
    var base = "submissions/" + Store.uid(), late = !!w.due && new Date() > w.due;
    var meta = { fileName: f.name, size: f.size, type: f.type || "", at: new Date().toISOString(), late: late, chunks: 0 };
    var save = function () {
      var next = Object.assign({}, subs); next[w.n] = meta;
      return Store.set(base, { name: me.name, studentId: me.studentId, items: next }).then(function () { subs = next; });
    };
    if (Store.mode() !== "cloud") return save();
    return new Promise(function (res, rej) {
      var rd = new FileReader();
      rd.onerror = function () { rej({ code: "read" }); };
      rd.onload = function () {
        var b64 = String(rd.result).split(",")[1] || "", parts = [];
        for (var i = 0; i < b64.length; i += CHUNK) parts.push(b64.slice(i, i + CHUNK));
        meta.chunks = parts.length;
        var old = (subs[w.n] && subs[w.n].chunks) || 0, seq = Promise.resolve();
        parts.forEach(function (p, i) { seq = seq.then(function () { return Store.set(base + "/files/w" + w.n + "_" + i, { d: p }); }); });
        for (var j = parts.length; j < old; j++) (function (j) { seq = seq.then(function () { return Store.del(base + "/files/w" + w.n + "_" + j); }); })(j);
        seq.then(save).then(res, rej);
      };
      rd.readAsDataURL(f);
    });
  }
  document.addEventListener("site:submit", function (e) {
    selWeek = e.detail.week; drawSubmit();
    $("#submitCard").scrollIntoView({ block: "center" });
    var s = $("#subSel"); if (s) s.focus();
  });

  /* ================= 수강 신청서 ================= */
  var A = C.apply || { fields: [] }, myApp = null, editing = false;
  function fieldHtml(f) {
    var req = f.required ? ' <span class="req" aria-hidden="true">*</span>' : "";
    var aria = ' aria-describedby="err-' + f.id + '"' + (f.required ? ' aria-required="true"' : "");
    var ctl;
    if (f.type === "select") ctl = '<select id="ap-' + f.id + '" name="' + f.id + '"' + aria + '><option value="">선택하세요</option>' + f.options.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + "</select>";
    else if (f.type === "radio") ctl = '<div class="radios" role="radiogroup" id="ap-' + f.id + '"' + aria + ">" + f.options.map(function (o, i) {
      return '<label class="radio"><input type="radio" name="' + f.id + '" id="ap-' + f.id + "-" + i + '" value="' + esc(o) + '"><span>' + esc(o) + "</span></label>";
    }).join("") + "</div>";
    else if (f.type === "textarea") ctl = '<textarea id="ap-' + f.id + '" name="' + f.id + '" rows="4" placeholder="' + esc(f.placeholder || "") + '"' + aria + "></textarea>";
    else if (f.type === "consent") ctl = '<label class="consent"><input type="checkbox" id="ap-' + f.id + '" name="' + f.id + '"' + aria + "><span>" + esc(f.text) + "</span></label>";
    else ctl = '<input id="ap-' + f.id + '" name="' + f.id + '" type="' + (f.type || "text") + '" placeholder="' + esc(f.placeholder || "") + '"' + aria + ">";
    var wide = f.type === "textarea" || f.type === "consent" || f.type === "radio";
    var lab = f.type === "radio" ? '<span class="lbl" id="lb-' + f.id + '">' + esc(f.label) + req + "</span>" : '<label class="lbl" for="ap-' + f.id + '">' + esc(f.label) + req + "</label>";
    return '<div class="fld' + (wide ? " wide" : "") + '" data-f="' + f.id + '">' + lab + ctl + '<p class="fld-err" id="err-' + f.id + '"></p></div>';
  }
  function readForm(form) {
    var v = {};
    A.fields.forEach(function (f) {
      if (f.type === "radio") { var c = form.querySelector('input[name="' + f.id + '"]:checked'); v[f.id] = c ? c.value : ""; }
      else if (f.type === "consent") v[f.id] = form.querySelector("#ap-" + f.id).checked;
      else v[f.id] = form.querySelector("#ap-" + f.id).value.trim();
    });
    return v;
  }
  function fillForm(form, v) {
    A.fields.forEach(function (f) {
      var val = v[f.id]; if (val == null) return;
      if (f.type === "radio") { var r = $$('input[name="' + f.id + '"]', form).filter(function (x) { return x.value === val; })[0]; if (r) r.checked = true; }
      else if (f.type === "consent") form.querySelector("#ap-" + f.id).checked = !!val;
      else form.querySelector("#ap-" + f.id).value = val;
    });
  }
  function validate(v) {
    var errs = [];
    A.fields.forEach(function (f) {
      var val = v[f.id], msg = "";
      var empty = f.type === "consent" ? !val : !val;
      if (f.required && empty) msg = f.type === "consent" ? "동의가 필요합니다." : (f.type === "select" || f.type === "radio" ? "항목을 선택해 주세요." : "내용을 입력해 주세요.");
      else if (val && f.pattern && !new RegExp(f.pattern).test(val)) msg = f.patternMsg || "형식을 확인해 주세요.";
      else if (val && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = "이메일 주소 형식을 확인해 주세요.";
      else if (val && f.minLength && String(val).length < f.minLength) msg = f.minLength + "자 이상 적어 주세요. (지금 " + String(val).length + "자)";
      if (msg) errs.push({ f: f, msg: msg, missing: f.required && empty });
    });
    return errs;
  }
  function drawApply() {
    var el = $("#apply");
    if (myApp && !editing) {
      el.innerHTML = '<div class="card apply-card done"><div class="apply-done-head"><span class="done-mark">' + icon("check") + '</span><div><h3>' + esc(A.doneTitle) + '</h3><p class="muted">' + esc(A.doneBody) + "</p></div></div>" +
        '<dl class="apply-summary">' + A.fields.filter(function (f) { return f.type !== "consent"; }).map(function (f) {
          return "<div><dt>" + esc(f.label) + "</dt><dd>" + esc(myApp[f.id] || "—") + "</dd></div>";
        }).join("") + "</dl>" +
        '<p class="muted small">제출 시각 ' + esc(R.fmtDue(new Date(myApp.submittedAt))) + '</p><button type="button" class="btn ghost sm" id="apEdit">신청 내용 수정하기</button></div>';
      $("#apEdit").addEventListener("click", function () { editing = true; drawApply(); });
      return;
    }
    el.innerHTML = '<form class="card apply-card" id="applyForm" novalidate>' +
      '<div class="apply-head"><span class="kicker">Application</span><h3>' + esc(A.title) + '</h3><p class="muted">' + esc(A.lead) + "</p></div>" +
      '<div class="err-summary" id="errSummary" tabindex="-1" hidden></div>' +
      '<div class="fields">' + A.fields.map(fieldHtml).join("") + "</div>" +
      '<div class="apply-foot"><button type="submit" class="btn primary"' + (writable() ? "" : " disabled") + ">" + (myApp ? "수정 내용 제출하기" : "신청서 제출하기") + "</button>" +
      (myApp ? '<button type="button" class="btn ghost" id="apCancel">취소</button>' : "") + '<p class="form-err" id="apErr" role="alert"></p></div>' +
    "</form>";
    var form = $("#applyForm");
    if (myApp) fillForm(form, myApp); else prefillApply();
    if (myApp) $("#apCancel").addEventListener("click", function () { editing = false; drawApply(); });
    form.addEventListener("input", function (e) {
      var fld = e.target.closest(".fld"); if (fld && fld.classList.contains("bad")) { fld.classList.remove("bad"); $(".fld-err", fld).textContent = ""; }
    });
    form.addEventListener("change", function (e) {
      var fld = e.target.closest(".fld"); if (fld && fld.classList.contains("bad")) { fld.classList.remove("bad"); $(".fld-err", fld).textContent = ""; }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = readForm(form), errs = validate(v), sum = $("#errSummary");
      $$(".fld", form).forEach(function (f) { f.classList.remove("bad"); $(".fld-err", f).textContent = ""; });
      if (errs.length) {
        errs.forEach(function (x) { var fld = form.querySelector('[data-f="' + x.f.id + '"]'); fld.classList.add("bad"); $(".fld-err", fld).textContent = x.msg; });
        var miss = errs.filter(function (x) { return x.missing; }), other = errs.filter(function (x) { return !x.missing; });
        sum.innerHTML = "<b>" + (miss.length ? "빠진 항목이 " + miss.length + "개 있습니다." : "확인이 필요한 항목이 있습니다.") + "</b><ul>" +
          errs.map(function (x) { return '<li><a href="#ap-' + x.f.id + '" data-goto="' + x.f.id + '">' + esc(x.f.label) + "</a> · " + esc(x.msg) + "</li>"; }).join("") + "</ul>" +
          (miss.length && other.length ? "" : "");
        sum.hidden = false; sum.focus();
        return;
      }
      sum.hidden = true;
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "제출하는 중…";
      v.submittedAt = new Date().toISOString();
      Store.set("applications/" + Store.uid(), v).then(function () {
        myApp = v; editing = false; drawApply();
        /* 신청서를 내면 같은 이름·학번으로 로그인 기록도 남겨 관리자 '강의 관리'에 바로 보이게 함 */
        me = { name: v.name, studentId: v.studentId };
        Store.set("roster/" + Store.uid(), { name: v.name, studentId: v.studentId, at: v.submittedAt }).catch(function () {}).then(function () { refreshAccess(false); });
        drawLogin(); drawAttend(); drawSubmit();
        $("#apply").scrollIntoView({ block: "start" });
      }, function (er) { btn.disabled = false; btn.textContent = "신청서 제출하기"; $("#apErr").textContent = failMsg(er); });
    });
    form.addEventListener("click", function (e) {
      var a = e.target.closest("[data-goto]"); if (!a) return;
      e.preventDefault();
      var t = form.querySelector("#ap-" + a.dataset.goto); var inp = t.matches("input,select,textarea") ? t : t.querySelector("input");
      t.closest(".fld").scrollIntoView({ block: "center" }); if (inp) inp.focus({ preventScroll: true });
    });
  }
  function prefillApply() {
    var form = $("#applyForm"); if (!form || !me || myApp) return;
    var n = form.querySelector("#ap-name"), s = form.querySelector("#ap-studentId");
    if (n && !n.value) n.value = me.name; if (s && !s.value) s.value = me.studentId;
  }

  /* ================= 시작 ================= */
  var ready = false;
  function redraw() {
    C = window.SITE_CONFIG; R = window.SITE_RUNTIME; esc = R.esc; icon = R.icon;
    P = C.participate || {}; A = C.apply || { fields: [] };
    assignWeeks = R.weeks.filter(function (w) { return w.raw.assignment; });
    if (assignWeeks.every(function (w) { return w.n !== selWeek; })) selWeek = null;
    if (!skeleton() || !ready) return;
    $("#modeNote").innerHTML = modeNote();
    if (!Store.uid()) return;
    drawLogin(); drawAttend(); drawSubmit(); drawApply(); drawPoll(); bindPoll();
  }
  window.SITE_STORE = Store;
  window.SITE_PART = { redraw: redraw };
  window.SITE_READY = Store.init();
  window.SITE_READY.then(function () {
    ready = true;
    $("#modeNote").innerHTML = modeNote();
    var uid = Store.uid();
    if (!uid) {
      ["#loginCard", "#attendCard", "#submitCard"].forEach(function (s) { $(s).innerHTML = '<p class="muted">참여 기능을 사용할 수 없습니다.</p>'; });
      drawApply(); votes = []; drawPoll(); return;
    }
    Promise.all([
      Store.get("roster/" + uid), Store.get("applications/" + uid), Store.get("attendance/" + uid), Store.get("submissions/" + uid)
    ]).then(function (r) {
      if (r[0]) me = { name: r[0].name, studentId: r[0].studentId };
      myApp = r[1]; attend = (r[2] && r[2].records) || {}; subs = (r[3] && r[3].items) || {};
      /* 예전 배포판(저장 서버 없음)에서 낸 신청서는 이 브라우저에만 남아 있음 → 서버에 한 번 옮겨 관리자 화면에 보이게 함 */
      if (Store.isServer() && !myApp) {
        var legacy = function (col) { try { var l = JSON.parse(localStorage.getItem("akd:uid") || "null"); var v = l && localStorage.getItem("akd:" + col + "/" + l); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
        var oldApp = legacy("applications");
        if (oldApp && oldApp.studentId) {
          var ro = legacy("roster") || { name: oldApp.name, studentId: oldApp.studentId, at: oldApp.submittedAt };
          myApp = oldApp; me = me || { name: ro.name, studentId: ro.studentId };
          return Promise.all([Store.set("applications/" + uid, oldApp), r[0] ? null : Store.set("roster/" + uid, ro)]).catch(function () {});
        }
      }
    }, function () {}).then(function () {
      drawLogin(); drawAttend(); drawSubmit(); drawApply();
      bindPoll();
      refreshAccess(true);
      Store.watchCollection("poll", function (list) {
        votes = list;
        var mine = list.filter(function (v) { return v.id === uid; })[0];
        if (mine && mine.data) myVote = mine.data.choice;
        drawPoll();
      });
    });
  });

  /* ================= 첫 방문: 폭죽 + 안내 팝업 ================= */
  function lsGet(k) { try { return localStorage.getItem("akd:" + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem("akd:" + k, v); } catch (e) {} }
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var firstVisit = !lsGet("visited");
  lsSet("visited", "1");

  function fireworks() {
    var W = C.welcome || {};
    if (W.fireworks === false) return;
    var toast = document.createElement("div");
    toast.className = "welcome-toast"; toast.setAttribute("role", "status");
    toast.textContent = W.message || "환영합니다!";
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add("out"); setTimeout(function () { toast.remove(); }, 600); }, 3600);
    if (reduce) return;
    var cv = document.createElement("canvas"); cv.className = "fx-canvas"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr; ctx.scale(dpr, dpr);
    var css = getComputedStyle(document.documentElement);
    var cols = [css.getPropertyValue("--blossom").trim(), css.getPropertyValue("--lilac").trim(), "#ffd27a", "#ffffff", "#f7b6cf"];
    var parts = [], start = performance.now();
    function burst(x, y) {
      var n = 70;
      for (var i = 0; i < n; i++) {
        var a = Math.PI * 2 * i / n + Math.random() * .1, sp = 2.2 + Math.random() * 3.8;
        parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: cols[(Math.random() * cols.length) | 0], r: 1.6 + Math.random() * 2 });
      }
    }
    var shots = [[.25, .32, 0], [.75, .28, 350], [.5, .2, 700], [.15, .45, 1100], [.85, .42, 1400], [.5, .35, 1800]];
    shots.forEach(function (s) { setTimeout(function () { burst(w * s[0], h * s[1]); }, s[2]); });
    (function loop(t) {
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p) {
        p.vy += .06; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.life -= .012;
        if (p.life > 0) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      });
      parts = parts.filter(function (p) { return p.life > 0; });
      if (t - start < 4200 || parts.length) requestAnimationFrame(loop); else cv.remove();
    })(start);
  }

  function popup() {
    var today = R.keyOf(new Date());
    if (lsGet("popupHide") === today) return;
    var delay = ((C.popup || {}).delaySeconds || 2) * 1000;
    setTimeout(function () {
      /* 관리자가 '팝업 등록'한 일정(오늘 이후)이 있으면 그 일정을 먼저 알립니다. */
      var CF = window.SITE_CONFIG || C, Pp = CF.popup || {}, RT = window.SITE_RUNTIME || R;
      var evs = ((CF.curriculum || {}).holidays || []).filter(function (e) { return e && e.popup && e.date >= today; })
        .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      if (!evs.length && !Pp.enabled) return;
      var parse = function (k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
      var body;
      if (evs.length) {
        body = '<span class="badge"><span class="badge-dot"></span>일정 안내</span>' +
          '<h2 id="mdTitle">' + (evs.length === 1 ? esc(evs[0].name) : "다가오는 일정 " + evs.length + "건") + "</h2>" +
          '<ul class="md-evs">' + evs.map(function (e) {
            return '<li><div class="md-ev-top"><span class="chip ev">' + esc(e.type || "휴강") + "</span><b>" + esc(RT.fmtDay(parse(e.date))) + (e.time ? " " + esc(e.time) : "") + "</b></div>" +
              (evs.length > 1 ? "<strong>" + esc(e.name) + "</strong>" : "") + (e.desc ? "<p>" + esc(e.desc) + "</p>" : "") + "</li>";
          }).join("") + "</ul>" +
          '<a class="btn primary" href="#calendar" id="mdGo">달력에서 보기</a>';
      } else {
        body = '<span class="badge"><span class="badge-dot"></span>안내</span>' +
          '<h2 id="mdTitle">' + esc(Pp.title) + "</h2><p>" + esc(Pp.body) + "</p>" +
          (Pp.items && Pp.items.length ? '<ul class="learn">' + Pp.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" : "") +
          '<a class="btn primary" href="' + esc(Pp.href || "#apply") + '" id="mdGo">' + esc(Pp.button || "자세히 보기") + "</a>";
      }
      var back = document.createElement("div");
      back.className = "modal-back";
      back.innerHTML = '<div class="modal card" role="dialog" aria-modal="true" aria-labelledby="mdTitle">' +
        '<button type="button" class="modal-x" aria-label="닫기">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        body +
        '<div class="modal-foot"><label class="consent"><input type="checkbox" id="mdHide"><span>오늘 하루 보지 않기</span></label><button type="button" class="text-btn" id="mdClose">닫기</button></div>' +
      "</div>";
      document.body.appendChild(back);
      var lastFocus = document.activeElement;
      requestAnimationFrame(function () { back.classList.add("in"); });
      $("#mdGo", back).focus({ preventScroll: true });
      function close() {
        if ($("#mdHide", back).checked) lsSet("popupHide", today);
        back.classList.remove("in"); setTimeout(function () { back.remove(); }, 250);
        document.removeEventListener("keydown", onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
      function onKey(e) {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          var f = $$("a,button,input", back), first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener("keydown", onKey);
      $(".modal-x", back).addEventListener("click", close);
      $("#mdClose", back).addEventListener("click", close);
      $("#mdGo", back).addEventListener("click", close);
      back.addEventListener("click", function (e) { if (e.target === back) close(); });
    }, delay);
  }

  if (firstVisit) setTimeout(fireworks, 400);
  popup();
})();
