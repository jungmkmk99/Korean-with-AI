/* 손그림 일러스트 (SVG) — 첫 화면, 강의 특징, 소개 띠, 마지막 안내 구역에 쓰입니다. 보통은 고칠 필요가 없습니다. */
(function () {
  var S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  var PAPER = "var(--paper)", INK = "currentColor";
  var Y = "var(--sk-yellow)", PK = "var(--sk-pink)", BL = "var(--sk-blue)", GR = "var(--sk-green)";

  function svg(vb, inner, cls) {
    return '<svg class="sk ' + (cls || "") + '" viewBox="' + vb + '" aria-hidden="true" focusable="false"><g ' + S + ">" + inner + "</g></svg>";
  }
  function p(d, extra) { return '<path d="' + d + '"' + (extra ? " " + extra : "") + "/>"; }
  function dot(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 1.4) + '" fill="currentColor" stroke="none"/>'; }

  /* 연필로 두 번 그은 듯한 액자 */
  function frame(x, y, w, h) {
    return p("M" + (x + 1) + "," + (y + 2) + " L" + (x + w - 1) + "," + y + " L" + (x + w + 1) + "," + (y + h - 1) + " L" + x + "," + (y + h + 1) + " Z", 'fill="' + PAPER + '"') +
      p("M" + (x - 1) + "," + y + " L" + (x + w + 1) + "," + (y + 2) + " L" + (x + w - 1) + "," + (y + h + 1) + " L" + (x + 2) + "," + (y + h - 1) + " Z", 'stroke-width="1.1"');
  }
  function lines(x, y, ws) {
    return ws.map(function (w, i) { return p("M" + x + "," + (y + i * 6) + " h" + w, 'stroke-width="1.5"'); }).join("");
  }

  /* 사람 상반신: 머리 중심(cx, cy) 기준, 어깨는 cy+42까지 */
  function bust(cx, cy, o) {
    o = o || {};
    var hair = o.hair || "short", look = o.look || 0, h = "";
    if (hair === "long") {
      h += p("M" + (cx - 13) + "," + (cy - 3) + " C" + (cx - 17) + "," + (cy + 10) + " " + (cx - 15) + "," + (cy + 22) + " " + (cx - 20) + "," + (cy + 30) +
        " C" + (cx - 8) + "," + (cy + 33) + " " + (cx + 8) + "," + (cy + 33) + " " + (cx + 20) + "," + (cy + 30) +
        " C" + (cx + 15) + "," + (cy + 22) + " " + (cx + 17) + "," + (cy + 10) + " " + (cx + 13) + "," + (cy - 3) + " Z", 'fill="' + INK + '"');
    }
    h += p("M" + (cx - 23) + "," + (cy + 42) + " C" + (cx - 22) + "," + (cy + 25) + " " + (cx - 11) + "," + (cy + 17) + " " + cx + "," + (cy + 17) +
      " C" + (cx + 11) + "," + (cy + 17) + " " + (cx + 22) + "," + (cy + 25) + " " + (cx + 23) + "," + (cy + 42), 'fill="' + PAPER + '"');
    if (hair === "long") h += p("M" + (cx - 19) + "," + (cy + 30) + " C" + (cx - 14) + "," + (cy + 31) + " " + (cx - 10) + "," + (cy + 26) + " " + (cx - 8) + "," + (cy + 20) + " M" + (cx + 19) + "," + (cy + 30) + " C" + (cx + 14) + "," + (cy + 31) + " " + (cx + 10) + "," + (cy + 26) + " " + (cx + 8) + "," + (cy + 20), 'fill="' + INK + '"');
    h += p("M" + (cx - 4) + "," + (cy + 10) + " v7 M" + (cx + 4) + "," + (cy + 10) + " v7");
    if (o.halo) h += '<ellipse cx="' + cx + '" cy="' + (cy - 22) + '" rx="13" ry="3.5" stroke-width="1.6"/>';
    if (hair === "bun") h += '<circle cx="' + (cx + 2) + '" cy="' + (cy - 15) + '" r="5.5" fill="currentColor"/>';
    h += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="11" ry="12.5" fill="' + PAPER + '"/>';
    if (hair === "short" || hair === "bun") {
      h += p("M" + (cx - 12) + "," + (cy - 1) + " C" + (cx - 14) + "," + (cy - 17) + " " + (cx + 9) + "," + (cy - 21) + " " + (cx + 12) + "," + (cy - 5) +
        " C" + (cx + 5) + "," + (cy - 10) + " " + (cx - 3) + "," + (cy - 7) + " " + (cx - 12) + "," + (cy - 1) + " Z", 'fill="' + INK + '"');
    } else if (hair === "curly") {
      [[-10, -5, 5], [-7, -11, 5.5], [0, -13, 6], [7, -11, 5.5], [10, -5, 4.5]].forEach(function (c) {
        h += '<circle cx="' + (cx + c[0]) + '" cy="' + (cy + c[1]) + '" r="' + c[2] + '" fill="currentColor"/>';
      });
    } else if (hair === "long") {
      h += p("M" + (cx - 12) + "," + (cy + 1) + " C" + (cx - 13) + "," + (cy - 16) + " " + (cx + 13) + "," + (cy - 16) + " " + (cx + 12) + "," + (cy + 1) +
        " C" + (cx + 7) + "," + (cy - 6) + " " + (cx - 1) + "," + (cy - 9) + " " + (cx - 12) + "," + (cy + 1) + " Z", 'fill="' + INK + '"');
    }
    h += dot(cx - 4 + look, cy + 2) + dot(cx + 4 + look, cy + 2);
    h += o.mouth === "o" ? '<circle cx="' + (cx + look) + '" cy="' + (cy + 7) + '" r="1.6" stroke-width="1.4"/>' : p("M" + (cx - 3.5 + look) + "," + (cy + 6) + " q3.5,3 7,0", 'stroke-width="1.6"');
    if (o.glasses) h += '<circle cx="' + (cx - 4 + look) + '" cy="' + (cy + 2) + '" r="3.6" stroke-width="1.4"/><circle cx="' + (cx + 4 + look) + '" cy="' + (cy + 2) + '" r="3.6" stroke-width="1.4"/>' + p("M" + (cx - .4 + look) + "," + (cy + 2) + " h.8", 'stroke-width="1.4"');
    if (o.headset) h += p("M" + (cx - 12) + "," + (cy + 2) + " C" + (cx - 13) + "," + (cy - 18) + " " + (cx + 13) + "," + (cy - 18) + " " + (cx + 12) + "," + (cy + 2), 'stroke-width="2"') +
      '<rect x="' + (cx + 10) + '" y="' + (cy - 2) + '" width="5" height="8" rx="2.5" fill="' + BL + '"/>' + p("M" + (cx + 12) + "," + (cy + 6) + " q0,6 -8,6", 'stroke-width="1.5"');
    return h;
  }

  /* 소품 */
  function hand(x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="4" ry="3.4" fill="' + PAPER + '"/>'; }
  function book(x, y, w, fill) {
    var m = x + w / 2;
    return p("M" + x + "," + (y + 3) + " Q" + (m - w / 4) + "," + (y - 3) + " " + m + "," + (y + 2) + " Q" + (m + w / 4) + "," + (y - 3) + " " + (x + w) + "," + (y + 3) + " V" + (y + w * .55) +
      " Q" + (m + w / 4) + "," + (y + w * .55 - 6) + " " + m + "," + (y + w * .55) + " Q" + (m - w / 4) + "," + (y + w * .55 - 6) + " " + x + "," + (y + w * .55) + " Z", 'fill="' + (fill || PAPER) + '"') +
      p("M" + m + "," + (y + 2) + " V" + (y + w * .55));
  }
  function robot(x, y, s) {
    s = s || 1;
    var w = 30 * s, h = 24 * s;
    return p("M" + (x + w / 2) + "," + y + " v" + (-7 * s), 'stroke-width="1.8"') + '<circle cx="' + (x + w / 2) + '" cy="' + (y - 9 * s) + '" r="' + 2.4 * s + '" fill="' + GR + '"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + 8 * s + '" fill="' + GR + '"/>' +
      '<rect x="' + (x + 5 * s) + '" y="' + (y + 6 * s) + '" width="' + (w - 10 * s) + '" height="' + (h - 12 * s) + '" rx="' + 5 * s + '" fill="' + PAPER + '" stroke-width="1.6"/>' +
      p("M" + (x + 10 * s) + "," + (y + 12 * s) + " q2," + (-2.5 * s) + " 4,0 M" + (x + 16 * s) + "," + (y + 12 * s) + " q2," + (-2.5 * s) + " 4,0", 'stroke-width="1.6"') +
      p("M" + x + "," + (y + h / 2) + " h" + (-4 * s) + " M" + (x + w) + "," + (y + h / 2) + " h" + 4 * s, 'stroke-width="1.8"');
  }
  function bubble(x, y, w, h, text, fill, tail) {
    var t = tail === "r" ? p("M" + (x + w - 10) + "," + (y + h) + " l4,6 l1,-6", 'fill="' + (fill || PAPER) + '"') : p("M" + (x + 8) + "," + (y + h) + " l-3,6 l7,-6", 'fill="' + (fill || PAPER) + '"');
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(8, h / 2) + '" fill="' + (fill || PAPER) + '"/>' + t +
      (text ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 3.2) + '" text-anchor="middle" font-size="9" font-weight="700" fill="currentColor" stroke="none">' + text + "</text>" : "");
  }
  function laptop(x, y, w, fill) {
    var h = w * .62;
    return p("M" + x + "," + y + " L" + (x + w) + "," + (y - 3) + " L" + (x + w + 4) + "," + (y + h) + " L" + (x + 4) + "," + (y + h + 2) + " Z", 'fill="' + (fill || PAPER) + '"') +
      p("M" + (x - 6) + "," + (y + h + 5) + " L" + (x + w + 10) + "," + (y + h + 2), 'stroke-width="2.4"') +
      p("M" + (x + w * .3) + "," + (y + h * .45) + " q" + (w * .2) + ",-" + (w * .12) + " " + (w * .4) + ",0", 'stroke-width="1.5"');
  }
  function camera(x, y, s, fill) {
    s = s || 1;
    return '<rect x="' + x + '" y="' + (y + 5 * s) + '" width="' + 34 * s + '" height="' + 22 * s + '" rx="' + 4 * s + '" fill="' + (fill || PAPER) + '"/>' +
      p("M" + (x + 8 * s) + "," + (y + 5 * s) + " l3," + (-5 * s) + " h" + 10 * s + " l3," + 5 * s, 'fill="' + PAPER + '"') +
      '<circle cx="' + (x + 17 * s) + '" cy="' + (y + 16 * s) + '" r="' + 7 * s + '" fill="' + PAPER + '"/><circle cx="' + (x + 17 * s) + '" cy="' + (y + 16 * s) + '" r="' + 3 * s + '" stroke-width="1.6"/>' +
      dot(x + 29 * s, y + 10 * s, 1.5);
  }
  function videoCam(x, y, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="30" height="20" rx="4" fill="' + (fill || PAPER) + '"/>' + p("M" + (x + 30) + "," + (y + 6) + " l10,-5 v18 l-10,-5", 'fill="' + PAPER + '"') +
      '<circle cx="' + (x + 8) + '" cy="' + (y - 5) + '" r="5" fill="' + PAPER + '"/><circle cx="' + (x + 20) + '" cy="' + (y - 5) + '" r="5" fill="' + PAPER + '"/>' + dot(x + 6, y + 6, 1.5);
  }
  function phone(x, y, rot) {
    return '<g transform="rotate(' + (rot || 0) + " " + (x + 12) + " " + (y + 20) + ')"><rect x="' + x + '" y="' + y + '" width="24" height="40" rx="5" fill="' + PAPER + '"/><rect x="' + (x + 4) + '" y="' + (y + 5) + '" width="16" height="26" rx="2" stroke-width="1.5"/>' + p("M" + (x + 10) + "," + (y + 35) + " h4", 'stroke-width="1.6"') + p("M" + (x + 7) + "," + (y + 22) + " l9,-9", 'stroke-width="1.3"') + "</g>";
  }
  function bulb(x, y) {
    return p("M" + (x - 7) + "," + (y + 14) + " C" + (x - 18) + "," + (y + 4) + " " + (x - 10) + "," + (y - 14) + " " + x + "," + (y - 14) + " C" + (x + 10) + "," + (y - 14) + " " + (x + 18) + "," + (y + 4) + " " + (x + 7) + "," + (y + 14) + " Z", 'fill="' + PAPER + '"') +
      p("M" + (x - 6) + "," + (y + 19) + " h12 M" + (x - 5) + "," + (y + 24) + " h10") + p("M" + (x - 3) + "," + (y + 14) + " V" + (y + 2) + " l3,-4 l3,4 V" + (y + 14), 'stroke-width="1.5"') +
      p("M" + (x - 22) + "," + (y - 18) + " l5,4 M" + (x + 22) + "," + (y - 18) + " l-5,4 M" + x + "," + (y - 26) + " v5", 'stroke-width="1.6"');
  }
  function headphones(x, y) {
    return p("M" + (x - 16) + "," + (y + 8) + " C" + (x - 18) + "," + (y - 18) + " " + (x + 18) + "," + (y - 18) + " " + (x + 16) + "," + (y + 8), 'stroke-width="2.6"') +
      '<rect x="' + (x - 22) + '" y="' + (y + 2) + '" width="10" height="17" rx="5" fill="' + PAPER + '"/><rect x="' + (x + 12) + '" y="' + (y + 2) + '" width="10" height="17" rx="5" fill="' + PAPER + '"/>';
  }
  function plane(x, y) {
    return p("M" + x + "," + (y + 12) + " L" + (x + 34) + "," + y + " L" + (x + 14) + "," + (y + 22) + " Z", 'fill="' + PAPER + '"') + p("M" + (x + 34) + "," + y + " L" + (x + 12) + "," + (y + 14) + " L" + (x + 14) + "," + (y + 22), 'stroke-width="1.6"');
  }
  function sparkle(x, y, s) {
    s = s || 1;
    return p("M" + (x - 5 * s) + "," + y + " h" + 10 * s + " M" + x + "," + (y - 5 * s) + " v" + 10 * s, 'stroke-width="1.6"');
  }
  function paper(x, y, w, h, fill, rot) {
    return '<g transform="rotate(' + (rot || 0) + " " + (x + w / 2) + " " + (y + h / 2) + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="' + (fill || PAPER) + '"/>' +
      lines(x + 4, y + 6, [w - 8, w - 12, w - 9, w - 14].slice(0, Math.max(1, Math.floor((h - 6) / 6)))) + "</g>";
  }

  /* ---------- 첫 화면: 액자 속 장면 6개 ---------- */
  var VB = "0 0 140 132";
  var scenes = [
    // 1. AI 챗봇과 대화
    frame(8, 10, 124, 90) + bust(44, 58, { hair: "short", look: 2 }) + robot(90, 52, .95) + bubble(58, 18, 30, 15, "안녕?", PAPER) + bubble(92, 22, 32, 15, "반가워", GR, "r") + lines(10, 112, [34, 22]),
    // 2. 번역 비교: 책을 펼친 학생
    frame(10, 8, 120, 92) + bust(70, 52, { hair: "curly", mouth: "o" }) + book(46, 74, 48, Y) + hand(46, 80) + hand(94, 80) +
      '<text x="58" y="88" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">가</text><text x="82" y="88" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none">A</text>' + lines(12, 112, [40, 26]),
    // 3. 칼럼 쓰기: 원고를 들어 올린 학생
    frame(8, 22, 124, 78) + bust(54, 62, { hair: "long", look: 2 }) + p("M70,86 C78,74 88,62 100,44", 'stroke-width="2.2"') + hand(101, 42) + paper(98, 6, 24, 30, PK, 12) + p("M118,4 l4,-3 M124,10 l5,-1 M114,1 l1,-5", 'stroke-width="1.5"') + lines(10, 112, [30, 44]),
    // 4. 발표: 화면을 가리키는 학생
    frame(10, 14, 120, 86) + '<rect x="72" y="22" width="50" height="36" rx="2" fill="' + BL + '"/>' + p("M82,50 v-8 M92,50 v-14 M102,50 v-10 M112,50 v-18", 'stroke-width="3"') +
      bust(40, 60, { hair: "bun", look: 2 }) + p("M58,84 C64,72 70,62 76,56", 'stroke-width="2.2"') + hand(77, 54) + lines(12, 112, [36, 20]),
    // 5. 영상 콘텐츠: 카메라를 든 학생
    frame(8, 6, 124, 94) + bust(52, 54, { hair: "short", glasses: true, look: 2 }) + videoCam(76, 66, PK) + hand(76, 82) + hand(104, 84) + p("M120,20 l6,-4 M122,30 h7", 'stroke-width="1.5"') + lines(10, 112, [42, 28]),
    // 6. 노트북으로 실습: 헤드셋을 쓴 학생
    frame(8, 18, 124, 82) + bust(98, 58, { hair: "long", headset: true, look: -2 }) + laptop(34, 62, 34, BL) + hand(76, 90) + lines(10, 112, [28, 40])
  ].map(function (inner) { return svg(VB, inner, "sk-scene"); });

  var flyer = svg("0 0 120 90", plane(6, 10) + p("M44,26 C60,30 66,46 58,56 C50,66 38,54 50,46 C66,36 86,52 84,74 C83,82 80,86 76,88", 'stroke-width="1.8" stroke-dasharray="1 6"') + sparkle(100, 16) + sparkle(14, 60, .7), "sk-flyer");

  /* ---------- 강의 특징 아이콘 ---------- */
  var FVB = "0 0 110 92";
  var features = [
    bust(34, 46, { hair: "short", look: 2 }) + bubble(56, 8, 26, 17, "가", PAPER) + bubble(72, 34, 26, 17, "A", Y, "r") + p("M84,16 q8,2 6,12", 'stroke-width="1.4" stroke-dasharray="2 3"'),
    bust(32, 46, { hair: "curly", look: 2 }) + robot(66, 36, 1) + bubble(56, 6, 30, 16, "…", GR) + sparkle(100, 14, .8),
    bust(36, 46, { hair: "long", look: 2 }) + paper(64, 24, 30, 38, PAPER, 6) + p("M96,10 L74,52", 'stroke-width="2.6"') + p("M74,52 l-1,5 l4,-3", 'stroke-width="1.6"') + hand(80, 44),
    bust(34, 46, { hair: "bun", look: 2 }) + videoCam(60, 46, PK) + p("M72,66 l-6,22 M80,66 l0,22 M88,66 l6,22", 'stroke-width="1.8"'),
    bust(40, 48, { hair: "short", halo: true, mouth: "o" }) + p("M80,30 l14,5 v12 c0,10 -6,16 -14,19 c-8,-3 -14,-9 -14,-19 v-12 Z", 'fill="' + GR + '"') + p("M74,48 l5,5 l9,-10", 'stroke-width="2.2"') + sparkle(16, 14, .8)
  ].map(function (inner) { return svg(FVB, inner, "sk-feature"); });

  /* ---------- 소개 띠: 노트북 앞 학생과 주변 소품 ---------- */
  var band = svg("0 0 400 330",
    frame(84, 40, 232, 258) +
    '<g transform="translate(200 150) scale(2.5)" stroke-width="1">' + bust(0, 0, { hair: "long", look: 1, mouth: "o" }).replace(/stroke-width="([\d.]+)"/g, function (m, v) { return 'stroke-width="' + (v / 2.3).toFixed(2) + '"'; }) + "</g>" +
    laptop(150, 214, 70, PAPER) + hand(244, 262) + hand(156, 270) +
    camera(22, 50, 1.4, PAPER) + p("M40,32 l-4,-8 M54,28 l1,-9 M68,32 l5,-7", 'stroke-width="1.6"') +
    '<g transform="rotate(8 200 14)"><rect x="176" y="0" width="48" height="30" rx="3" fill="' + PAPER + '"/><text x="200" y="21" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor" stroke="none">한</text></g>' +
    phone(330, 70, 18) + headphones(350, 214) + bulb(42, 220) + sparkle(326, 30) + sparkle(64, 150, .8),
    "sk-band");

  /* ---------- 마지막 안내 구역: 옅은 손그림 배경 ---------- */
  var bg = "", rects = [[20, 20, 46, 40], [150, 30, 110, 6], [330, 0, 100, 34], [560, 14, 70, 44], [760, 30, 120, 6], [960, 20, 50, 42], [1090, 40, 90, 6],
    [40, 120, 50, 40], [1060, 140, 70, 6], [20, 210, 64, 56], [260, 200, 70, 40], [880, 200, 60, 6], [1100, 200, 70, 60], [610, 230, 90, 30]];
  rects.forEach(function (r, i) {
    if (r[3] <= 6) bg += lines(r[0], r[1], [r[2], r[2] * .8, r[2] * .9, r[2] * .6]);
    else bg += '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="2"/>' + (i % 2 ? lines(r[0] + r[2] + 10, r[1] + 6, [40, 30, 36]) : "");
  });
  var ctaBg = '<svg class="sk sk-ctabg" viewBox="0 0 1200 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' + bg +
    '<g transform="translate(60 230)">' + camera(-20, -20, .9) + "</g>" + '<g transform="translate(1130 70)">' + phone(-12, -20, -12) + "</g>" + '<g transform="translate(980 110)">' + headphones(0, 0) + "</g>" + "</g></svg>";

  window.SITE_ART = { scenes: scenes, flyer: flyer, features: features, band: band, ctaBg: ctaBg };
})();
