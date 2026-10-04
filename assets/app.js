/* 화면 구성 스크립트 — 내용은 config.js에서 읽어 옵니다. 보통은 이 파일을 고칠 필요가 없습니다. */

/* 관리자 모드에서 고친 설정(이 브라우저에 저장된 것)이 있으면 먼저 적용 */
(function () {
  window.SITE_CONFIG_FILE = window.SITE_CONFIG ? JSON.parse(JSON.stringify(window.SITE_CONFIG)) : null;
  try {
    var o = localStorage.getItem("akd:configOverride");
    if (o && !(window.claude && window.claude.use)) { window.SITE_CONFIG = JSON.parse(o); window.SITE_CONFIG_SOURCE = "browser"; }
  } catch (e) {}
})();

window.renderSite = function () {
  var C = window.SITE_CONFIG;
  if (!C) { document.body.insertAdjacentHTML("afterbegin", "<p style='padding:20px'>config.js를 불러오지 못했습니다. assets 폴더에 config.js가 있는지 확인하세요.</p>"); return; }

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var $ = function (sel) { return document.querySelector(sel); };
  var list = function (arr, fn) { return (arr || []).map(fn).join(""); };

  var ICON = {
    calendar: '<path d="M7 3v3M17 3v3M4 9h16"/><rect x="4" y="5" width="16" height="16" rx="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrowL: '<path d="M15 5l-7 7 7 7"/>',
    arrowR: '<path d="M9 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    slides: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4M8 21h8"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    pending: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  var icon = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || ICON.check) + "</svg>"; };
  var head = function (s) {
    return '<div class="section-head"><span class="kicker">' + esc(s.kicker) + "</span><h2>" + esc(s.title) + "</h2>" + (s.lead ? "<p>" + esc(s.lead) + "</p>" : "") + "</div>";
  };
  var placeholder = function (text) {
    return '<article class="card placeholder"><span class="dot">' + icon("pending") + "</span><div><h3>준비 중</h3><p>" + esc(text) + "</p></div></article>";
  };

  /* 색상 덮어쓰기 */
  ["blossom", "lilac"].forEach(function (k) {
    var v = C.theme && C.theme[k];
    if (v) document.documentElement.style.setProperty("--" + k, v); else document.documentElement.style.removeProperty("--" + k);
  });

  /* 기본 정보 · 메뉴 */
  document.title = C.site.title + " | " + C.site.org;
  $("#brandName").textContent = C.site.title;
  $("#brandOrg").textContent = C.site.org;
  $("#navList").innerHTML = list(C.nav, function (n) {
    return '<li><a href="#' + esc(n.id) + '" data-id="' + esc(n.id) + '">' + esc(n.label) + "</a></li>";
  });

  /* ---------- 첫 화면 ---------- */
  var h = C.hero;
  $("#hero").innerHTML =
    '<div class="wrap hero-inner">' +
      '<div class="hero-copy">' +
        '<span class="badge"><span class="badge-dot"></span>' + esc(h.badge) + "</span>" +
        "<h1>" + esc(h.title).replace(/^AI/, '<span class="ai">AI</span>') + "</h1>" +
        '<p class="hero-sub">' + esc(h.subtitle) + "</p>" +
        '<p class="hero-desc">' + esc(h.description) + "</p>" +
        '<div class="btn-row">' + list(h.buttons, function (b) {
          return '<a class="btn ' + esc(b.style || "primary") + '" href="' + esc(b.href) + '">' + esc(b.label) + "</a>";
        }) + "</div>" +
      "</div>" +
      '<div class="hero-art" aria-hidden="true"><canvas id="petals"></canvas></div>' +
    "</div>";

  /* ---------- 커리큘럼 · 달력 ---------- */
  var CUR = (function () {
    var cfg = C.curriculum || {};
    var WD = ["일", "월", "화", "수", "목", "금", "토"];
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var keyOf = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
    var parseDate = function (s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
    var parseDue = function (s) {
      var m = String(s || "").match(/(\d+)-(\d+)-(\d+)(?:[ T](\d+):(\d+))?/);
      return m ? new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 23, m[5] ? +m[5] : 59) : null;
    };
    var fmtDay = function (d) { return (d.getMonth() + 1) + ". " + d.getDate() + ".(" + WD[d.getDay()] + ")"; };
    var fmtDue = function (d) { return d ? d.getFullYear() + ". " + fmtDay(d) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) : "추후 공지"; };

    var start = parseDate(cfg.startDate || "2026-09-01");
    var days = (cfg.days && cfg.days.length ? cfg.days : [WD[start.getDay()]]).map(function (d) { return WD.indexOf(d); }).filter(function (i) { return i >= 0; });
    /* 일정: type이 비었거나 '휴강'이면 휴강일, 그 밖(보강·특강·시험·행사·기타)은 달력에 일정으로 표시 */
    var hol = {}, evs = {};
    (cfg.holidays || []).forEach(function (h) {
      if (!h || !h.date) return;
      if (!h.type || h.type === "휴강") hol[h.date] = h.name || "휴강";
      else (evs[h.date] = evs[h.date] || []).push(h);
    });
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var sessions = [];
    var weeks = (cfg.weeks || []).map(function (w, i) {
      var base = w.date ? parseDate(w.date) : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7 * i);
      var wk = {
        n: i + 1, raw: w,
        time: w.time || cfg.time || "", location: w.location || cfg.location || "",
        due: w.assignment ? parseDue(w.assignment.due) : null, sessions: []
      };
      days.forEach(function (dw, j) {
        var off = (dw - base.getDay() + 7) % 7;
        var date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + off), dayName = WD[dw];
        var titles = (w.sessions || []).filter(function (s) { return !s.day || s.day === dayName; }).map(function (s) { return s.title; });
        var key = keyOf(date);
        var s = { w: wk, n: wk.n, idx: j, day: dayName, date: date, key: key, id: key, title: titles.length ? titles.join(" · ") : (w.topic || ""), holiday: hol[key] || "" };
        wk.sessions.push(s); sessions.push(s);
      });
      wk.sessions.sort(function (a, b) { return a.date - b.date; });
      wk.date = wk.sessions.length ? wk.sessions[0].date : base;
      wk.end = wk.sessions.length ? wk.sessions[wk.sessions.length - 1].date : base;
      wk.key = keyOf(wk.date);
      return wk;
    });
    sessions.sort(function (a, b) { return a.date - b.date; });

    /* 오늘 기준 다음 수업 */
    var nextSession = sessions.filter(function (s) { return s.date >= today && !s.holiday; })[0] || null;
    var nextWeek = nextSession ? nextSession.w : null;

    /* 날짜별 일정 */
    var byDay = {};
    var slot = function (k) { return (byDay[k] = byDay[k] || { cls: [], due: [], ev: [] }); };
    Object.keys(evs).forEach(function (k) { slot(k).ev = evs[k]; });
    Object.keys(hol).forEach(function (k) { if (!byDay[k]) slot(k).hol = hol[k]; });
    sessions.forEach(function (s) { slot(s.key).cls.push(s); });
    weeks.forEach(function (w) { if (w.due) slot(keyOf(w.due)).due.push(w); });

    function remain(due) {
      if (!due) return { cls: "tbd", text: "제출 기한 추후 공지" };
      var ms = due - new Date();
      if (ms <= 0) return { cls: "closed", text: "마감됨" };
      var mins = Math.floor(ms / 60000), d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
      var dday = d === 0 ? "D-day" : "D-" + d;
      var text = d > 0 ? d + "일 " + h + "시간 남음" : (h > 0 ? h + "시간 " + m + "분 남음" : m + "분 남음");
      return { cls: d < 3 ? "urgent" : "open", text: dday + " · " + text };
    }
    function remainPill(w) {
      var r = remain(w.due);
      return '<span class="due-pill ' + r.cls + '"' + (w.due ? ' data-due="' + w.n + '"' : "") + ">" + esc(r.text) + "</span>";
    }
    function statusChip(w) {
      if (today >= w.date && today <= w.end) return '<span class="chip now">이번 주</span>';
      if (nextWeek && w.n === nextWeek.n) return '<span class="chip now">다음 수업</span>';
      if (w.end < today) return '<span class="chip past">지난 수업</span>';
      return "";
    }
    var dateLine = function (w) {
      return w.sessions.map(function (s, i) {
        var t = i === 0 ? fmtDay(s.date) : (s.date.getMonth() === w.sessions[0].date.getMonth() ? s.date.getDate() + ".(" + s.day + ")" : fmtDay(s.date));
        return s.holiday ? t + " 휴강" : t;
      }).join(" · ");
    };
    var chips = function (arr, cls) { return '<div class="kc">' + list(arr, function (c) { return '<span class="kc-chip ' + (cls || "") + '">' + esc(c) + "</span>"; }) + "</div>"; };

    function weekBody(w) {
      var r = w.raw, a = r.assignment;
      var out = '<div class="week-body">' +
        '<dl class="week-meta">' +
          '<div><dt>' + icon("calendar") + "날짜</dt><dd>" + w.date.getFullYear() + ". " + esc(dateLine(w)) + "</dd></div>" +
          '<div><dt>' + icon("clock") + "시간</dt><dd>" + esc(w.time) + "</dd></div>" +
          '<div><dt>' + icon("pin") + "장소</dt><dd>" + esc(w.location) + "</dd></div>" +
        "</dl>" +
        '<div class="sessions">' + list(w.sessions, function (s) {
          return '<div class="sess' + (s.holiday ? " off" : "") + '"><span class="sess-day">' + esc(s.day) + '</span><div><span class="sess-date">' + esc(fmtDay(s.date)) + (s.holiday ? ' · 휴강(' + esc(s.holiday) + ")" : "") + '</span><b>' + esc(s.title) + "</b></div></div>";
        }) + "</div>" +
        '<div class="week-cols">' +
          "<div>" +
            ((r.concepts && r.concepts.length) ? '<h4>수업 핵심 질문 (핵심 개념)</h4>' + chips(r.concepts) : "") +
            ((r.content && r.content.length) ? '<h4>활동</h4><ul class="learn">' + list(r.content, function (c) { return "<li>" + esc(c) + "</li>"; }) + "</ul>" : "") +
            (r.homework ? '<h4>과제</h4><p class="hw">' + icon("doc") + esc(r.homework) + "</p>" : "") +
            (!(r.concepts && r.concepts.length) && !(r.content && r.content.length) && !r.homework ? '<p class="none">수업 시간에 자세히 안내합니다.</p>' : "") +
          "</div>" +
          '<div><h4>참고 자료</h4>' + ((r.videos && r.videos.length)
            ? '<ul class="videos">' + list(r.videos, function (v) {
                return '<li><a href="' + esc(v.url) + '" target="_blank" rel="noopener">' + icon("play") + "<span>" + esc(v.title) + "</span></a></li>";
              }) + "</ul>" : "") +
            (cfg.materialsNote ? '<p class="none">' + esc(cfg.materialsNote) + "</p>" : "") + "</div>" +
        "</div>";
      if (a) {
        out += '<div class="assign">' +
          '<div class="assign-head"><span class="assign-icon">' + icon("doc") + '</span><div><h4>' + esc(a.title) + '</h4><p class="assign-due">' + (w.due ? "마감 " + esc(fmtDue(w.due)) : "제출 기한 추후 공지") + "</p></div>" + (w.due ? remainPill(w) : "") + "</div>" +
          '<p class="assign-desc">' + esc(a.desc) + "</p>" +
          '<div class="assign-foot">' +
            (cfg.submitUrl || a.submitUrl
              ? '<a class="btn primary sm" href="' + esc(a.submitUrl || cfg.submitUrl) + '" target="_blank" rel="noopener">' + icon("upload") + "과제 제출하기</a>"
              : '<button type="button" class="btn primary sm submit-btn" data-week="' + w.n + '">' + icon("upload") + "과제 제출하기</button>") +
            '<span class="submit-msg" role="status"></span>' +
          "</div>" +
        "</div>";
      }
      return out + "</div>";
    }

    function render() {
      var upcoming = weeks.filter(function (w) { return w.due && w.due > new Date(); })[0];
      var html = '<section id="curriculum"><div class="wrap">' +
        '<div class="head-row">' + head(cfg) +
          (upcoming ? '<a class="next-due card" href="#week-' + upcoming.n + '" data-open="' + upcoming.n + '"><span class="nd-label">다가오는 마감</span><strong>' + esc(upcoming.raw.assignment.title) + "</strong>" + remainPill(upcoming) + "</a>" : "") +
        "</div>" +
        '<div class="week-tools"><button type="button" class="text-btn" id="openAll">모두 펼치기</button><button type="button" class="text-btn" id="closeAll">모두 접기</button></div>' +
        '<div class="weeks">' + list(weeks, function (w) {
          var isNext = nextWeek && w.n === nextWeek.n;
          return '<details class="week card' + (w.end < today && !isNext ? " is-past" : "") + '" id="week-' + w.n + '"' + (isNext ? " open" : "") + ">" +
            '<summary><span class="wk-no"><b>' + w.n + "</b>주차</span>" +
              '<span class="wk-date">' + esc(dateLine(w)) + "</span>" +
              '<span class="wk-topic">' + esc(w.raw.topic) + "</span>" +
              '<span class="wk-chips">' + statusChip(w) + (w.raw.badge ? '<span class="chip exam">' + esc(w.raw.badge) + "</span>" : "") + (w.raw.assignment ? '<span class="chip task">과제</span>' : "") + "</span>" +
              '<span class="wk-chev">' + icon("chev") + "</span>" +
            "</summary>" + weekBody(w) + "</details>";
        }) + "</div>" +
        '<div class="cal-wrap" id="calendar">' +
          '<h3 class="sub-title">월간 수업 달력</h3>' +
          '<div class="cal-grid-wrap">' +
            '<div class="card cal">' +
              '<div class="cal-head"><button type="button" class="round-btn" id="calPrev" aria-label="이전 달">' + icon("arrowL") + '</button><strong id="calTitle" aria-live="polite"></strong><button type="button" class="round-btn" id="calNext" aria-label="다음 달">' + icon("arrowR") + "</button></div>" +
              '<div class="cal-days" aria-hidden="true">' + list(WD, function (d, i) { return '<span class="' + (i === 0 ? "sun" : i === 6 ? "sat" : "") + '">' + d + "</span>"; }) + "</div>" +
              '<div class="cal-cells" id="calCells" role="grid"></div>' +
              '<div class="cal-legend"><span><i class="lg-class"></i>수업일</span><span><i class="lg-hol"></i>휴강</span><span><i class="lg-ev"></i>행사·일정</span><span><i class="lg-due"></i>과제 마감</span><span><i class="lg-today"></i>오늘</span></div>' +
            "</div>" +
            '<div class="card cal-panel" id="calPanel" aria-live="polite"></div>' +
          "</div>" +
        "</div>" +
      "</div></section>";
      return html;
    }

    var view, selected;
    function drawCal() {
      var y = view.getFullYear(), m = view.getMonth();
      $("#calTitle").textContent = y + "년 " + (m + 1) + "월";
      var first = new Date(y, m, 1), nd = new Date(y, m + 1, 0).getDate();
      var cells = "";
      for (var b = 0; b < first.getDay(); b++) cells += '<span class="cell empty"></span>';
      for (var d = 1; d <= nd; d++) {
        var dt = new Date(y, m, d), k = keyOf(dt), ev = byDay[k];
        var cls = "cell" + (dt.getDay() === 0 ? " sun" : dt.getDay() === 6 ? " sat" : "") + (k === keyOf(today) ? " today" : "") + (k === selected ? " sel" : "");
        var tags = "", label = (m + 1) + "월 " + d + "일";
        if (ev) {
          if (ev.cls.length) {
            var s0 = ev.cls[0];
            if (s0.holiday) { cls += " has-hol"; tags += '<span class="tag hol">휴강</span>'; label += ", 휴강"; }
            else { cls += " has-class"; tags += '<span class="tag cls">' + s0.n + "주차</span>"; label += ", " + s0.n + "주차 수업"; }
          }
          if (!ev.cls.length && ev.hol) { cls += " has-hol"; tags += '<span class="tag hol">휴강</span>'; label += ", 휴강"; }
          if (ev.ev.length) { cls += " has-ev"; tags += '<span class="tag ev">' + esc(ev.ev[0].type) + "</span>"; label += ", " + ev.ev.map(function (x) { return x.type + " " + x.name; }).join(", "); }
          if (ev.due.length) { cls += " has-due"; tags += '<span class="tag due">마감</span>'; label += ", 과제 마감"; }
        }
        cells += '<button type="button" class="' + cls + '" data-key="' + k + '" aria-label="' + label + '"' + (k === selected ? ' aria-pressed="true"' : "") + '><span class="num">' + d + "</span>" + tags + "</button>";
      }
      $("#calCells").innerHTML = cells;
      $("#calPrev").disabled = view <= new Date(minMonth);
      $("#calNext").disabled = view >= new Date(maxMonth);
    }
    function drawPanel() {
      var dt = parseDate(selected), ev = byDay[selected];
      var h = '<p class="cp-date">' + dt.getFullYear() + ". " + fmtDay(dt) + (selected === keyOf(today) ? ' <span class="chip now">오늘</span>' : "") + "</p>";
      if (ev && (ev.ev.length || (ev.hol && !ev.cls.length))) {
        if (ev.hol && !ev.cls.length) h += '<div class="cp-class"><span class="chip past">휴강</span><h4>' + esc(ev.hol) + "</h4></div>";
        ev.ev.forEach(function (x) {
          h += '<div class="cp-ev"><span class="chip ev">' + esc(x.type) + "</span><h4>" + esc(x.name) + "</h4>" +
            (x.time ? '<p class="cp-meta">' + icon("clock") + esc(x.time) + "</p>" : "") +
            (x.desc ? '<p class="cp-desc">' + esc(x.desc) + "</p>" : "") + "</div>";
        });
      }
      if (!ev || (!ev.cls.length && !ev.due.length && !ev.ev.length && !ev.hol)) {
        h += '<p class="cp-empty">이날은 수업이 없습니다.</p>' + (nextSession ? '<button type="button" class="text-btn" data-jump="' + nextSession.key + '">다음 수업 보기 (' + fmtDay(nextSession.date) + ")</button>" : "");
      } else if (ev) {
        ev.cls.forEach(function (s) {
          var r = s.w.raw;
          if (s.holiday) {
            h += '<div class="cp-class"><span class="chip past">' + s.n + "주차 " + esc(s.day) + "요일 · 휴강</span><h4>" + esc(s.holiday) + '</h4><p class="cp-meta">' + icon("pending") + "이날은 수업이 없습니다.</p>" +
              (nextSession ? '<button type="button" class="text-btn" data-jump="' + nextSession.key + '">다음 수업 보기 (' + fmtDay(nextSession.date) + ")</button>" : "") + "</div>";
            return;
          }
          h += '<div class="cp-class"><span class="chip task-soft">' + s.n + "주차 " + esc(s.day) + "요일 수업</span>" + (r.badge ? ' <span class="chip exam">' + esc(r.badge) + "</span>" : "") + "<h4>" + esc(s.title) + "</h4>" +
            '<p class="cp-meta">' + icon("clock") + esc(s.w.time) + "</p>" +
            '<p class="cp-meta">' + icon("pin") + esc(s.w.location) + "</p>" +
            ((r.concepts && r.concepts.length) ? chips(r.concepts) : "") +
            ((r.content && r.content.length) ? '<ul class="learn">' + list(r.content, function (c) { return "<li>" + esc(c) + "</li>"; }) + "</ul>" : "") +
            (r.homework ? '<p class="cp-note">' + icon("doc") + "과제: " + esc(r.homework) + "</p>" : "") +
            '<button type="button" class="btn ghost sm" data-open="' + s.n + '">' + s.n + "주차 자세히 보기</button></div>";
        });
        ev.due.forEach(function (w) {
          h += '<div class="cp-due"><span class="chip due">과제 마감</span><h4>' + esc(w.raw.assignment.title) + "</h4>" +
            '<p class="cp-meta">' + icon("clock") + "마감 " + pad(w.due.getHours()) + ":" + pad(w.due.getMinutes()) + "</p>" + remainPill(w) +
            '<button type="button" class="btn ghost sm" data-open="' + w.n + '">과제 보기</button></div>';
        });
      }
      $("#calPanel").innerHTML = h;
    }
    function select(k) {
      selected = k;
      var d = parseDate(k); view = new Date(d.getFullYear(), d.getMonth(), 1);
      drawCal(); drawPanel();
    }
    function openWeek(n) {
      var el = document.getElementById("week-" + n); if (!el) return;
      el.open = true;
      el.scrollIntoView({ block: "start" });
      el.querySelector("summary").focus({ preventScroll: true });
    }
    function tickDue() {
      document.querySelectorAll("[data-due]").forEach(function (el) {
        var w = weeks[+el.getAttribute("data-due") - 1]; if (!w) return;
        var r = remain(w.due);
        el.textContent = r.text; el.className = "due-pill " + r.cls;
      });
    }

    var minMonth, maxMonth;
    function init() {
      if (!weeks.length) return;
      var allDates = sessions.map(function (s) { return s.date; }).concat(weeks.filter(function (w) { return w.due; }).map(function (w) { return w.due; }));
      allDates = allDates.concat(Object.keys(evs).concat(Object.keys(hol)).map(parseDate));
      var lo = new Date(Math.min.apply(null, allDates)), hi = new Date(Math.max.apply(null, allDates));
      minMonth = new Date(lo.getFullYear(), lo.getMonth(), 1).getTime();
      maxMonth = new Date(hi.getFullYear(), hi.getMonth(), 1).getTime();
      select((nextSession || sessions[0]).key);

      $("#calPrev").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCal(); });
      $("#calNext").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(); });
      $("#calCells").addEventListener("click", function (e) { var b = e.target.closest("[data-key]"); if (b) select(b.dataset.key); });
      $("#curriculum").addEventListener("click", function (e) {
        var o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openWeek(+o.dataset.open); return; }
        var j = e.target.closest("[data-jump]"); if (j) { select(j.dataset.jump); return; }
        var s = e.target.closest(".submit-btn");
        if (s) document.dispatchEvent(new CustomEvent("site:submit", { detail: { week: +s.dataset.week } }));
      });
      $("#openAll").addEventListener("click", function () { document.querySelectorAll(".week").forEach(function (d) { d.open = true; }); });
      $("#closeAll").addEventListener("click", function () { document.querySelectorAll(".week").forEach(function (d) { d.open = false; }); });
      clearInterval(window.__dueTimer); window.__dueTimer = setInterval(tickDue, 30000);
    }
    return { render: render, init: init, weeks: weeks, sessions: sessions, keyOf: keyOf, fmtDay: fmtDay, fmtDue: fmtDue, remain: remain, parseDate: parseDate };
  })();
  window.SITE_RUNTIME = { weeks: CUR.weeks, sessions: CUR.sessions, keyOf: CUR.keyOf, fmtDay: CUR.fmtDay, fmtDue: CUR.fmtDue, remain: CUR.remain, esc: esc, icon: icon, head: head };

  /* ---------- 포트폴리오 (구글 드라이브 링크) ---------- */
  var DRIVE_KINDS = { "문서": "doc", "슬라이드": "slides", "시트": "sheet", "폴더": "folder", "파일": "doc", "영상": "video", "이미지": "image", "PDF": "doc", "설문": "doc" };
  function driveKind(url, kind) {
    if (kind && DRIVE_KINDS[kind]) return kind;
    var u = String(url || "");
    if (/docs\.google\.com\/document/.test(u)) return "문서";
    if (/docs\.google\.com\/presentation/.test(u)) return "슬라이드";
    if (/docs\.google\.com\/spreadsheets/.test(u)) return "시트";
    if (/docs\.google\.com\/forms/.test(u)) return "설문";
    if (/drive\.google\.com\/(drive\/)?(u\/\d+\/)?folders/.test(u)) return "폴더";
    return "파일";
  }
  window.SITE_DRIVE = { kind: driveKind, kinds: Object.keys(DRIVE_KINDS), valid: function (u) { return /^https:\/\/(drive|docs)\.google\.com\/\S+$/.test(String(u || "").trim()); } };
  function renderPortfolio(P) {
    if (!P) return "";
    var items = P.items || [], cats = (P.categories || []).filter(function (c) { return items.some(function (it) { return it.category === c; }); });
    items.forEach(function (it) { if (it.category && cats.indexOf(it.category) < 0) cats.push(it.category); });
    var catIdx = function (c) { return Math.max(0, (P.categories || []).indexOf(c)) % 6; };
    return '<section id="portfolio" class="sec-portfolio"><div class="wrap">' + head(P) +
      (cats.length > 1 ? '<div class="pf-filter" role="toolbar" aria-label="분류로 거르기"><button type="button" class="pf-chip on" data-cat="" aria-pressed="true">전체 <small>' + items.length + "</small></button>" +
        list(cats, function (c) { return '<button type="button" class="pf-chip" data-cat="' + esc(c) + '" aria-pressed="false">' + esc(c) + " <small>" + items.filter(function (it) { return it.category === c; }).length + "</small></button>"; }) + "</div>" : "") +
      (items.length ? '<ul class="pf-grid">' + list(items, function (it) {
        var k = driveKind(it.url, it.kind), ic = DRIVE_KINDS[k] || "doc";
        var cover = '<div class="pf-cover c' + catIdx(it.category) + '"><span class="pf-icon">' + icon(ic) + '</span><span class="pf-kind">Google Drive · ' + esc(k) + "</span>" + (it.sample ? '<span class="pf-sample">샘플</span>' : "") + "</div>";
        var body = '<div class="pf-body"><div class="pf-meta">' + (it.category ? '<span class="chip task">' + esc(it.category) + "</span>" : "") + (it.week ? "<span>" + esc(it.week) + "</span>" : "") + "</div>" +
          "<h3>" + esc(it.title) + '</h3><p class="pf-student">' + esc(it.student) + "</p>" + (it.desc ? '<p class="pf-desc">' + esc(it.desc) + "</p>" : "") +
          '<span class="pf-open">' + (it.sample ? "샘플 자료 · 실제 링크로 바꾸면 열립니다" : "구글 드라이브에서 열기 " + icon("ext")) + "</span></div>";
        return '<li class="pf-item" data-cat="' + esc(it.category || "") + '">' + (it.sample
          ? '<div class="card pf-card is-sample">' + cover + body + "</div>"
          : '<a class="card pf-card" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + cover + body + "</a>") + "</li>";
      }) + "</ul>" : '<p class="adm-empty">아직 등록된 과제물이 없습니다.</p>') +
    "</div></section>";
  }

  /* ---------- 강의계획서 ---------- */
  function renderSyllabus(S) {
    if (!S) return "";
    var maxPct = Math.max.apply(null, (S.grading || []).map(function (g) { return +g.pct || 0; }).concat([1]));
    var ul = function (arr) { return '<ul class="learn">' + list(arr, function (t) { return "<li>" + esc(t) + "</li>"; }) + "</ul>"; };
    return '<section class="sec-syllabus" id="syllabus"><div class="wrap">' + head(S) +
      (S.info && S.info.length ? '<dl class="syl-info">' + list(S.info, function (i) { return "<div><dt>" + esc(i.label) + "</dt><dd>" + esc(i.value) + "</dd></div>"; }) + "</dl>" : "") +
      (S.notes && S.notes.length ? '<div class="syl-notes"><h3><span aria-hidden="true">★★★</span> ' + esc(S.notesTitle) + ' <span aria-hidden="true">★★★</span></h3><ol>' + list(S.notes, function (t) { return "<li>" + esc(t) + "</li>"; }) + "</ol></div>" : "") +
      '<div class="syl-grid">' +
        '<article class="card syl-card"><h3>' + esc(S.summaryTitle) + "</h3><p>" + esc(S.summary) + "</p>" +
          "<h3>" + esc(S.goalsTitle) + '</h3><p class="goal-lead">' + esc(S.goalLead) + '</p><ol class="goals">' + list(S.goals, function (g) { return "<li>" + esc(g) + "</li>"; }) + "</ol>" +
          '<dl class="syl-methods">' + list(S.methods, function (m) { return "<div><dt>" + esc(m.label) + "</dt><dd>" + esc(m.value) + "</dd></div>"; }) + "</dl></article>" +
        '<article class="card syl-card"><h3>' + esc(S.gradingTitle) + '</h3><ul class="grade-bars">' + list(S.grading, function (g) {
            return '<li><span class="gb-l">' + esc(g.name) + (g.note ? "<small>" + esc(g.note) + "</small>" : "") + '</span><span class="po-track"><span class="po-bar" style="width:' + (g.pct / maxPct * 100) + '%"></span></span><span class="gb-v">' + esc(g.pct) + "%</span></li>";
          }) + "</ul>" +
          "<h3>" + esc(S.gradesTitle) + '</h3><div class="tbl-wrap"><table class="grade-tbl"><thead><tr><th scope="col">점수 구간</th><th scope="col">등급</th></tr></thead><tbody>' +
            list(S.grades, function (g) { return "<tr><td>" + esc(g.range) + "</td><th scope=\"row\">" + esc(g.grade) + "</th></tr>"; }) + "</tbody></table></div>" +
          "<h3>" + esc(S.attendanceTitle) + "</h3>" + ul(S.attendanceRules) + "</article>" +
      "</div>" +
      '<div class="syl-grid">' +
        '<article class="card syl-card"><h3>' + esc(S.tasksTitle) + "</h3>" + list(S.tasks, function (t) { return "<h4>" + esc(t.title) + "</h4>" + ul(t.items); }) + "</article>" +
        '<article class="card syl-card"><h3>' + esc(S.etcTitle) + "</h3>" + ul(S.etc) + "</article>" +
      "</div>" +
    "</div></section>";
  }

  /* ---------- 본문 ---------- */
  var toolCount = (C.tools && C.tools.items || []).length;
  var html = '<div id="notices" class="sec-notices" hidden><div class="wrap"><div id="noticeMount"></div></div></div>';

  // 프로그램 소개: 개요 + 숫자 카드
  html += '<section id="intro" class="sec-intro"><div class="wrap">' +
    '<div class="section-head"><span class="kicker">About</span><h2>강의 한눈에 보기</h2><p>' + esc(C.site.org) + " · " + esc(C.site.semester) + "</p></div>" +
    '<div class="overview">' + list(C.overview, function (o) {
      return '<div class="ov-item"><span class="ov-icon">' + icon(o.icon) + '</span><div class="ov-text"><span class="ov-label">' + esc(o.label) + '</span><strong class="ov-value">' + esc(o.value) + "</strong>" + (o.note ? '<span class="ov-note">' + esc(o.note) + "</span>" : "") + "</div></div>";
    }) + "</div>" +
    '<div class="stats">' + list(C.stats, function (s) {
      var v = s.value === "auto:tools" ? toolCount : s.value;
      return '<div class="stat"><div class="stat-num"><span class="n">' + esc(v) + '</span><span class="u">' + esc(s.unit) + '</span></div><p>' + esc(s.label) + "</p></div>";
    }) + "</div>" +
  "</div></section>";

  // 강의계획서
  html += renderSyllabus(C.syllabus);

  // 강의 장점 슬라이드
  var st = C.strengths;
  html += '<section class="sec-strengths" aria-roledescription="carousel" aria-label="' + esc(st.title) + '"><div class="wrap">' +
    '<div class="head-row">' + head(st) +
      '<div class="slider-ctrl"><button type="button" class="round-btn" id="slPrev" aria-label="이전 장점">' + icon("arrowL") + '</button><button type="button" class="round-btn" id="slNext" aria-label="다음 장점">' + icon("arrowR") + "</button></div>" +
    "</div>" +
    '<div class="slider" id="slider" tabindex="0">' + list(st.items, function (it, i) {
      return '<article class="slide card" aria-label="' + (i + 1) + " / " + st.items.length + '"><span class="slide-no">' + String(i + 1).padStart(2, "0") + "</span><h3>" + esc(it.title) + "</h3><p>" + esc(it.body) + "</p></article>";
    }) + "</div>" +
    '<div class="dots" id="dots">' + list(st.items, function (it, i) {
      return '<button type="button" aria-label="' + (i + 1) + '번째 장점 보기" data-i="' + i + '"></button>';
    }) + "</div>" +
  "</div></section>";

  // AI 도구
  var t = C.tools;
  html += '<section class="sec-tools"><div class="wrap">' + head(t) +
    '<div class="tool-grid">' + list(t.items, function (it) {
      return '<a class="card tool" href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
        '<span class="tool-mark">' + esc(it.name.charAt(0)) + "</span>" +
        '<div class="tool-body"><h3>' + esc(it.name) + ' <span class="ext">' + icon("ext") + '</span></h3><span class="tool-maker">' + esc(it.maker) + "</span><p>" + esc(it.use) + "</p></div></a>";
    }) + "</div></div></section>";

  // 커리큘럼 (3단계 자리)
  html += CUR.render();

  // 포트폴리오
  html += renderPortfolio(C.portfolio);

  // 수강 안내: 준비물
  var g = C.guide;
  html += '<section id="guide"><div class="wrap">' + head(g) +
    '<h3 class="sub-title">' + esc(g.prepTitle) + "</h3>" +
    '<ul class="prep">' + list(g.prep, function (p) {
      return '<li class="card"><span class="check">' + icon("check") + "</span><div><h4>" + esc(p.title) + "</h4><p>" + esc(p.body) + "</p></div></li>";
    }) + "</ul>" +
    '<div id="apply" class="apply-block"></div>' +
  "</div></section>";

  // 수강생 참여 (participate.js가 채움)
  var pt = C.participate || {};
  html += '<section id="participate" class="sec-participate"><div class="wrap">' + head(pt) + '<div id="partMount"></div></div></section>';

  // FAQ
  var f = C.faq;
  html += '<section id="faq"><div class="wrap narrow">' + head(f) +
    '<div class="faq">' + list(f.items, function (it, i) {
      return '<details class="card qa"' + (i === 0 ? " open" : "") + '><summary><span class="q">Q</span><span class="q-text">' + esc(it.q) + '</span><span class="plus">' + icon("plus") + '</span></summary><div class="a"><p>' + esc(it.a) + "</p></div></details>";
    }) + "</div></div></section>";

  $("#main").innerHTML = html;
  CUR.init();
  var pfF = $(".pf-filter");
  if (pfF) pfF.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    var c = b.dataset.cat;
    pfF.querySelectorAll("[data-cat]").forEach(function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
    document.querySelectorAll(".pf-item").forEach(function (li) { li.hidden = !!c && li.dataset.cat !== c; });
  });

  /* ---------- 푸터: 교수자 ---------- */
  var p = C.instructor;
  var photo = p.photo
    ? '<img src="' + esc(p.photo) + '" alt="' + esc(p.name) + ' 교수 사진">'
    : '<span class="avatar-fallback" aria-label="' + esc(p.name) + ' 교수">' + esc(p.name.charAt(0)) + "</span>";
  $("#footer").innerHTML =
    '<div class="wrap">' +
      '<div class="prof" id="instructor">' +
        '<div class="prof-photo">' + photo + "</div>" +
        '<div class="prof-main"><span class="kicker">' + esc(p.kicker) + '</span><h2>' + esc(p.name) + ' <small>' + esc(p.position) + "</small></h2><p>" + esc(p.bio) + "</p></div>" +
        '<dl class="prof-contact">' + list(p.contacts, function (c) {
          var val = c.type === "email"
            ? '<span class="sel">' + esc(c.value) + '</span><button type="button" class="copy" data-copy="' + esc(c.value) + '" aria-label="' + esc(c.label) + ' 복사">' + icon("copy") + "<span>복사</span></button>"
            : esc(c.value);
          return "<div><dt>" + esc(c.label) + "</dt><dd>" + val + "</dd></div>";
        }) + "</dl>" +
      "</div>" +
      '<div class="footer-bottom"><p class="copyright">' + esc(C.site.footerNote) + "</p></div>" +
    "</div>";

  /* 이메일 복사 */
  if (!window.__siteBound) document.addEventListener("click", function (e) {
    var b = e.target.closest(".copy"); if (!b) return;
    var text = b.getAttribute("data-copy"), label = b.querySelector("span");
    var done = function () { label.textContent = "복사됨"; setTimeout(function () { label.textContent = "복사"; }, 1600); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents(b.previousElementSibling);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); label.textContent = "선택됨";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  });

  /* ---------- 장점 슬라이드 ---------- */
  var slider = $("#slider"), dots = Array.prototype.slice.call(document.querySelectorAll("#dots button"));
  var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
  function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : slider.clientWidth; }
  function current() { return Math.round(slider.scrollLeft / step()); }
  function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); slider.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: "smooth" }); }
  function sync() {
    var i = current(), max = slider.scrollWidth - slider.clientWidth - 2;
    if (slider.scrollLeft >= max) i = slides.length - 1;
    dots.forEach(function (d, k) { d.classList.toggle("on", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
    $("#slPrev").disabled = slider.scrollLeft <= 2;
    $("#slNext").disabled = slider.scrollLeft >= max;
  }
  $("#slPrev").addEventListener("click", function () { go(current() - 1); });
  $("#slNext").addEventListener("click", function () { go(current() + 1); });
  dots.forEach(function (d) { d.addEventListener("click", function () { go(+d.dataset.i); }); });
  slider.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
  });
  slider.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
  window.__sliderSync = sync;
  if (!window.__siteBound) window.addEventListener("resize", function () { window.__sliderSync && window.__sliderSync(); });
  sync();

  /* ---------- 모바일 메뉴 ---------- */
  var nav = $("#nav"), toggle = $("#menuToggle");
  function closeNav() { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
  if (!window.__siteBound) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("click", function (e) { if (!e.target.closest("#nav") && !e.target.closest("#menuToggle")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- 스크롤: 헤더 그림자, 맨 위로 버튼, 현재 메뉴 표시 ---------- */
  var header = $("#siteHeader"), toTop = $("#toTop");
  function onScroll() {
    var links = Array.prototype.slice.call(document.querySelectorAll("#navList a"));
    var targets = (window.SITE_CONFIG.nav || []).map(function (n) { return document.getElementById(n.id); }).filter(Boolean);
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    toTop.classList.toggle("is-visible", y > 400);
    var cur = "", line = (header.offsetHeight || 64) + 40;
    targets.forEach(function (el) { if (el.getBoundingClientRect().top <= line) cur = el.id; });
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4 && targets.length) cur = targets[targets.length - 1].id;
    links.forEach(function (a) { a.classList.toggle("is-active", a.dataset.id === cur); });
  }
  if (!window.__siteBound) {
    window.addEventListener("scroll", onScroll, { passive: true });
    toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
  }
  onScroll();

  /* ---------- 첫 화면 그림: 천천히 떨어지는 벚꽃잎 ---------- */
  var cv = document.getElementById("petals");
  if (cv && cv.getContext) {
    var ctx = cv.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var css = getComputedStyle(document.documentElement);
    var W, H, petals = [];
    function colors() { return [css.getPropertyValue("--blossom").trim() || "#e2779f", css.getPropertyValue("--lilac").trim() || "#8f74cf"]; }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      petals = [];
      for (var i = 0; i < 26; i++) petals.push({
        x: Math.random() * W, y: Math.random() * H, r: 6 + Math.random() * 9,
        a: Math.random() * Math.PI * 2, va: (Math.random() - .5) * .02,
        vy: .25 + Math.random() * .45, sway: Math.random() * Math.PI * 2, c: i % 3 === 0 ? 1 : 0, o: .35 + Math.random() * .5
      });
    }
    function petal(p, col) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = p.o; ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r * .9, -p.r * .6, p.r * .7, p.r * .7, 0, p.r);
      ctx.bezierCurveTo(-p.r * .7, p.r * .7, -p.r * .9, -p.r * .6, 0, -p.r);
      ctx.fill(); ctx.restore();
    }
    function flower(cols) {
      var R = Math.min(W, H) * .2;
      ctx.save(); ctx.translate(W / 2, H / 2);
      for (var i = 0; i < 5; i++) {
        ctx.save(); ctx.rotate(i * Math.PI * 2 / 5); ctx.fillStyle = cols[0]; ctx.globalAlpha = .9;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.bezierCurveTo(R * .9, -R * .5, R * .7, -R * 1.6, R * .12, -R * 1.5);
        ctx.lineTo(0, -R * 1.32); ctx.lineTo(-R * .12, -R * 1.5);
        ctx.bezierCurveTo(-R * .7, -R * 1.6, -R * .9, -R * .5, 0, 0);
        ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = cols[1]; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, R * .22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    function draw() { var cols = colors(); ctx.clearRect(0, 0, W, H); flower(cols); petals.forEach(function (p) { petal(p, cols[p.c]); }); }
    function tick() {
      petals.forEach(function (p) {
        p.sway += .012; p.y += p.vy; p.x += Math.sin(p.sway) * .35; p.a += p.va;
        if (p.y - p.r > H) { p.y = -p.r; p.x = Math.random() * W; }
      });
      draw(); window.__petalRaf = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(window.__petalRaf);
    size(); seed(); draw();
    window.__petalHooks = { resize: function () { size(); seed(); draw(); }, draw: draw };
    if (!window.__siteBound) {
      window.addEventListener("resize", function () { window.__petalHooks && window.__petalHooks.resize(); });
      if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { window.__petalHooks && window.__petalHooks.draw(); });
    }
    if (!reduce) window.__petalRaf = requestAnimationFrame(tick);
  }
  window.__siteBound = true;
};
window.renderSite();
