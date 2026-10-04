/* ==========================================================
   사이트 설정 파일 (config.js)
   ----------------------------------------------------------
   이 파일 하나만 고치면 사이트의 글자·메뉴·색상이 바뀝니다.
   - 따옴표("") 안의 글자만 고치세요.
   - 항목 사이의 쉼표(,)는 지우지 마세요.
   - 저장 후 브라우저에서 index.html을 새로고침하면 반영됩니다.
   - [확인 필요]라고 적힌 값은 강의계획서에 없어 임시로 넣은 값입니다.
   ========================================================== */

window.SITE_CONFIG = {

  /* ---------- 1. 사이트 기본 정보 ---------- */
  site: {
    title: "AI로배우는한국어",
    org: "고려대학교 학부대학",
    semester: "2026학년도 2학기",                     // [확인 필요]
    footerNote: "Copyright 2026 AI WEB, All Right Reserved |  정미경(고려대학교 학부대학)"   // 페이지 맨 아래 한 줄
  },

  /* ---------- 2. 색상 (선택, 비워 두면 기본 벚꽃 색) ---------- */
  theme: {
    blossom: "",
    lilac: ""
  },

  /* ---------- 3. 상단 메뉴 (id는 바꾸지 마세요) ---------- */
  navRev: 3,       // 메뉴 구성 버전(바꾸지 마세요)
  contentRev: 3,   // 내용 정리 버전(바꾸지 마세요)
  nav: [
    { id: "intro",      label: "강의 소개" },
    { id: "curriculum", label: "커리큘럼" },
    { id: "guide",      label: "수강 안내" },
    { id: "portfolio",  label: "포트폴리오" },
    { id: "faq",        label: "FAQ" },
    { id: "submit",     label: "과제 제출" },
    { id: "instructor", label: "교수자" }
  ],

  /* ---------- 4. 첫 화면 ---------- */
  hero: {
    badge: "AI로배우는한국어 · UNIV102",
    title: "AI로배우는한국어",
    headline: "*생성형 AI*로 배우고 *한국어*로 표현하는 한 학기",   // *별표* 안의 글자는 기울임으로 강조됩니다
    subtitle: "AI를 활용한 한국어 능력 함양",
    description: "외국인 유학생이 생성형 AI를 활용해 한국어 의사소통 능력을 통합적으로 키우는 강의입니다. 번역기, 문법 교정기, 음성 인식, 이미지 생성 도구 등 다양한 AI 도구를 직접 활용하면서 한국어 표현력과 디지털 도구 활용 역량을 함께 신장합니다.",
    buttons: [
      { label: "수강 신청하기", href: "#apply",      style: "primary" },
      { label: "커리큘럼 보기", href: "#curriculum", style: "ghost" }
    ]
  },

  /* ---------- 5. 강의 한눈에 보기 ----------
     icon: calendar / clock / pin / monitor / users 중 선택 */
  overview: [
    { icon: "calendar", label: "일정",      value: "2026. 9. 1. ~ 12. 17.",   note: "16주 · 주 2회 수업" },              // [확인 필요] 날짜
    { icon: "clock",    label: "시간",      value: "화·목 15:00–16:15",       note: "5교시 · 3학점" },
    { icon: "pin",      label: "강의실",    value: "교양관 412호",            note: "학수번호 UNIV102" },
    { icon: "users",    label: "수강 대상", value: "외국인 유학생",           note: "TOPIK 4급 이상 · AI 활용 초~중급" }
  ],

  /* ---------- 6. 숫자 강조 카드 ----------
     value에 "auto:tools"라고 쓰면 아래 AI 도구 개수를 자동으로 셉니다. */
  stats: [
    { value: "16",         unit: "주",  label: "한 학기 과정 (주 2회)" },
    { value: "8",          unit: "주",  label: "직접 만든 AI 챗봇과 한국어 대화 연습" },
    { value: "16",         unit: "회",  label: "수업 활동 결과물 제출 (약)" },
    { value: "auto:tools", unit: "개",  label: "실습에 쓰는 대표 AI 도구" }
  ],

  /* ---------- 6-1. 강의계획서 ---------- */
  syllabus: {
    kicker: "Syllabus",
    title: "강의*계획서*",
    lead: "수강 신청 전에 과목 특성과 유의사항, 평가 방법을 꼭 확인해 주세요.",
    info: [
      { label: "학수번호",  value: "UNIV102" },
      { label: "학점",      value: "3학점" },
      { label: "시간",      value: "화·목(5교시) 15:00–16:15" },
      { label: "강의실",    value: "교양관 412호" },
      { label: "담당교수",  value: "정미경 (jungmk@korea.ac.kr)" },
      { label: "평가",      value: "절대평가 · 평가점수 비공개" }
    ],
    notesTitle: "과목 특성 및 수강신청 시 유의사항",
    notes: [
      "본 교과목은 중급 이상 한국어 숙달도(TOPIK 4급 이상)를 갖춘 외국인 유학생에게 적합한 과목입니다.",
      "AI 도구 활용 능력이 초~중급 수준인 학생에게 적합한 과목입니다.",
      "생성형 AI를 이미 사용하고 있는 학습자를 대상으로 합니다. AI를 활용한 한국어 학습 능력 향상을 위해 AI 도구 유료 가입이 필요할 수 있습니다.",
      "이 과목은 코딩, AI 도구를 학습하는 과목이 아니며, 생성형 AI로 한국어 의사소통능력을 향상시키는 데에 중점을 두는 과목입니다.",
      "<글쓰기>, <학문세계의탐구>를 이수한 학생에게 적합한 과목입니다.",
      "개인 실습과 팀별 실습이 함께 이루어지므로 협업 능력과 한국어 의사소통능력을 갖추어야 합니다.",
      "수강생의 활용 능력에 따라 수업 수준은 조정될 수 있으나 고급(하네스 엔지니어링, AI 멀티 에이전트 등 AI 설계) 수준으로 상향되지는 않습니다.",
      "생성형 AI의 여러 기능을 익혀 이미 한국어 글쓰기, 학업 및 생활 영역에서 능숙하게 AI를 활용하고 있는 수강생은 AI 활용 역량 향상에 제한이 있습니다. 주차별 강의계획을 확인한 후 수강신청을 신중히 하기 바랍니다."
    ],
    summaryTitle: "강의 개요",
    summary: "외국인 유학생을 대상으로 생성형 인공지능을 활용하여 한국어 의사소통 능력을 통합적으로 향상시키는 것을 목표로 한다. 번역기, 문법 교정기, 음성 인식, 이미지 생성 도구 등 다양한 AI 도구를 직접 활용하면서 한국어 표현력과 디지털 도구 활용 역량을 함께 신장한다. 또한 AI의 작동 원리와 한계를 이해하고, 이를 비판적으로 분석하며 윤리적으로 활용하는 AI 리터러시를 기른다. 팀 프로젝트 활동을 통해 창의적 문제 해결력과 협업 능력을 강화하며, 아울러 글로벌 역량을 심화한다.",
    goalsTitle: "수업 목표",
    goalLead: "생성형 AI 도구를 활용해 한국어 의사소통능력을 향상시킬 수 있다.",
    goals: [
      "생성형 AI 도구를 활용하여 다양한 형태의 한국어 텍스트를 생성하고 한국어 표현 능력을 신장한다.",
      "팀 프로젝트를 통해 창의적인 글쓰기 프로젝트를 수행하며 실질적인 문제 해결 능력을 기른다.",
      "생성형 AI 활용 시 데이터 윤리와 보안 문제에 대해 인식하여 안전하고 윤리적인 방식으로 AI를 활용한다."
    ],
    methods: [
      { label: "수업 방법",           value: "강의, 실습, 팀 프로젝트, 협동학습, 발표" },
      { label: "교재·참고자료",       value: "LMS에 주차별 자료 업로드" },
      { label: "과제",                value: "과제 세부 내용 및 제출 기한 추후 공지" }
    ],
    gradingTitle: "평가 방법",
    grading: [
      { name: "출석",               pct: 10 },
      { name: "수업 중 과제",        pct: 30 },
      { name: "중간고사 대체 과제",  note: "AI 한국어 챗봇", pct: 10 },
      { name: "팀 프로젝트",         note: "콘텐츠 제작",   pct: 20 },
      { name: "기말고사 대체 과제",  note: "AI 한국어 챗봇", pct: 10 },
      { name: "참여 및 태도",        pct: 10 }
    ],
    gradesTitle: "성적 산출 기준",
    grades: [
      { range: "95점 이상 100점 이하", grade: "A+" },
      { range: "90점 이상 95점 미만",  grade: "A" },
      { range: "85점 이상 90점 미만",  grade: "B+" },
      { range: "80점 이상 85점 미만",  grade: "B" },
      { range: "70점 이상 80점 미만",  grade: "C+" },
      { range: "60점 이상 70점 미만",  grade: "C" }
    ],
    attendanceTitle: "출석 관련 규정",
    attendanceRules: [
      "총 수업시간의 1/3(11회) 이상 결석하는 경우 성적을 부여할 수 없음. 단, 담당교수가 불가피한 결석으로 인정하는 경우에는 예외 적용 가능",
      "생리공결은 한 달에 1회만 인정됨."
    ],
    tasksTitle: "과제 안내",
    tasks: [
      { title: "AI 챗봇 대화 연습 (중간·기말 시험 대체 과제)",
        items: ["8주간(4주~12주) 직접 제작한 AI 챗봇과 주 2회, 회당 10~15분 동안 한국어를 연습합니다."] },
      { title: "수업 활동 결과 및 과제 제출 (약 16회)",
        items: [
          "수강생은 수업 중 활동 결과 또는 링크를 수업 시간 내에 공유 드라이브에 업로드합니다.",
          "해당 활동은 수업 내용을 충실히 들으면 수업 시간 중 완료할 수 있는 내용입니다. 수업 중 완료하지 못할 경우, 다음 수업 시작 전까지 제출합니다.",
          "수업 활동 결과물 및 과제는 총 30점이며 매주 교수자가 확인하여 평가 점수에 반영합니다.",
          "부득이한 결석 시 주차 활동 결과물을 확인하고 제출해야 활동 결과 점수를 인정받을 수 있습니다. 결석 시 수업 활동 결과물 제출 유무를 반드시 확인하고 활동 결과물 제출이 있을 시 일주일 내에 활동 결과물을 업로드합니다. 이후 제출은 감점이 있습니다."
        ] }
    ],
    etcTitle: "기타 사항",
    etc: [
      "매시간 AI 도구와 글쓰기를 실습할 수 있는 개인 노트북을 지참해야 합니다.",
      "태블릿은 노트북과 기능이 동일하지 않으며, 사용 제한이 있어 권장하지 않습니다."
    ]
  },

  /* ---------- 7. 강의 특징 (손그림 아이콘과 함께 보이는 카드) ---------- */
  strengths: {
    kicker: "Why this course",
    title: "한 학기 동안 *직접* 만들어 보는 *다섯 가지*",
    lead: "번역부터 영상 콘텐츠까지, 매주 AI 도구를 손에 쥐고 한국어로 결과물을 만듭니다.",
    items: [
      { title: "번역을 비교하며 배우는 한국어", body: "한국어→모어, 모어→한국어로 직접 번역한 글과 AI 번역 결과를 비교하며 어휘·문법·표현의 차이를 익힙니다." },
      { title: "나만의 AI 한국어 챗봇", body: "GPTs·Gems로 한국어 챗봇을 직접 만들고 고쳐 가며, 8주 동안 주 2회 대화하며 한국어를 연습합니다." },
      { title: "칼럼 쓰기에서 발표까지", body: "AI 역질문으로 칼럼 주제를 정해 쓰고 피드백을 받으며, AI Canvas로 발표 자료와 스크립트를 만들어 발표합니다." },
      { title: "팀으로 만드는 영상 콘텐츠", body: "스토리보드부터 한국어 음성과 자막까지, 팀 프로젝트로 AI 영상 콘텐츠를 제작하고 발표합니다." },
      { title: "AI 리터러시와 윤리", body: "AI의 작동 원리와 한계를 이해하고, 데이터 윤리와 보안을 지키며 AI를 비판적으로 활용하는 태도를 기릅니다." }
    ]
  },

  /* ---------- 8. 실습 AI 도구 ---------- */
  tools: {
    kicker: "AI Tools",
    title: "실습에 쓰는 *대표* AI 도구",
    lead: "번역기, 문법 교정기, 음성 인식, 이미지·영상 생성 도구 등은 수업에서 함께 탐색합니다.",
    items: [
      { name: "ChatGPT", maker: "OpenAI",    use: "GPTs로 한국어 챗봇 제작, Canvas로 발표 자료·스크립트 작성",  url: "https://chatgpt.com" },
      { name: "Gemini",  maker: "Google",    use: "Gems로 스토리북·챗봇 제작, 맞춤 설정과 번역 결과 비교",    url: "https://gemini.google.com" },
      { name: "Claude",  maker: "Anthropic", use: "칼럼 초안에 대한 피드백과 표현 다듬기",                url: "https://claude.ai" }
    ]
  },

  /* ---------- 9. 커리큘럼과 일정 ----------
     - startDate: 1주차 첫 수업 날짜. 이후 주차는 7일씩 자동 계산됩니다.
     - days: 수업 요일. 첫 수업 요일부터 순서대로 적습니다.
     - holidays: 휴강일. 달력과 주차에 '휴강'으로 표시되고 출석에서 빠집니다.
     - 주차 항목
       topic: 목록에 보일 제목 / sessions: 요일별 수업 내용(day를 비우면 그 주 모든 수업)
       concepts: 수업 핵심 질문(핵심 개념) / content: 활동 / homework: 과제 칸 내용
       badge: '중간고사 주간'처럼 붙일 표시 / videos: 참고 영상 { title, url }
       assignment: 사이트에서 제출받을 과제. due를 비워 두면 '제출 기한 추후 공지'로 표시됩니다.
     - submitUrl: 과제를 LMS 등으로 받으려면 주소를 적으세요. */
  curriculum: {
    kicker: "Curriculum",
    title: "주차별 *강의 계획*",
    lead: "주차를 누르면 요일별 수업, 핵심 개념, 활동과 과제가 펼쳐집니다. 강의 계획은 추후 변경될 수 있습니다.",
    startDate: "2026-09-01",                           // [확인 필요] 개강일(화)
    days: ["화", "목"],
    time: "15:00–16:15",
    location: "교양관 412호",
    holidays: [
      { date: "2026-09-24", name: "추석 연휴" }         // [확인 필요]
    ],
    submitUrl: "",
    weeks: [
      { topic: "강의 소개, AI 리터러시",
        concepts: ["AI 리터러시"], content: [],
        videos: [{ title: "AI 리터러시 영상 찾아보기", url: "https://www.youtube.com/results?search_query=AI+리터러시" }] },
      { topic: "AI 활용 윤리, AI 도구 탐색, 프롬프트 실습 (1)",
        concepts: ["AI 활용 윤리", "프롬프트 작성 원리"],
        content: ["AI의 부정적 사용 사례", "AI 활용 체크리스트 선별", "AI 도구 특징 검색, 정리"],
        videos: [{ title: "프롬프트 작성 원리 영상 찾아보기", url: "https://www.youtube.com/results?search_query=프롬프트+작성법" }] },
      { topic: "프롬프트 실습 (2), 스토리북 제작",
        concepts: ["프롬프트 고도화", "AI 맞춤 설정"],
        content: ["AI 맞춤 설정, AI 기능", "Gems 활용 스토리북"],
        videos: [{ title: "Gemini Gems 스토리북 영상 찾아보기", url: "https://www.youtube.com/results?search_query=Gemini+Gems+스토리북" }] },
      { topic: "AI 활용 번역 (1): 한국어 → 모어 번역",
        concepts: ["AI 번역 결과 분석"],
        content: ["모어 번역 작품 선정", "직접 번역과 AI 번역 결과 비교를 통한 한국어 학습"],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 활용 번역 (2): 모어 → 한국어 번역",
        concepts: ["AI 번역 결과 분석"],
        content: ["직접 번역과 AI 번역 결과 비교를 통한 한국어 학습"],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 활용 칼럼 쓰기 (1): 주제 선정, 개요",
        concepts: ["칼럼 쓰기 계획"],
        content: ["AI 활용 역질문을 활용한 주제 선정"],
        homework: "주 2회 챗봇 대화 연습",
        videos: [{ title: "칼럼 쓰는 법 영상 찾아보기", url: "https://www.youtube.com/results?search_query=칼럼+쓰는+법" }] },
      { topic: "AI 활용 칼럼 쓰기 (2), AI 한국어 챗봇 제작 (1)",
        sessions: [{ day: "", title: "AI 활용 칼럼 쓰기 (2): 쓰기 및 피드백" }, { day: "", title: "AI 한국어 챗봇 제작 (1)" }],
        concepts: [], content: [],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 한국어 챗봇 제작 (1), 면담", badge: "중간고사 주간",
        sessions: [{ day: "화", title: "AI 한국어 챗봇 제작 (1)" }, { day: "목", title: "면담" }],
        concepts: ["챗봇 제작(GPTs·Gems)"], content: [],
        homework: "주 2회 챗봇 대화 연습",
        videos: [{ title: "GPTs 만들기 영상 찾아보기", url: "https://www.youtube.com/results?search_query=GPTs+만들기" }],
        assignment: { title: "중간고사 대체 과제 (AI 한국어 챗봇)", desc: "직접 제작한 AI 한국어 챗봇과 대화 연습한 결과를 제출합니다. 세부 내용과 제출 기한은 추후 공지합니다.", due: "" } },
      { topic: "면담, AI 한국어 챗봇 제작 (2)",
        sessions: [{ day: "화", title: "면담" }, { day: "목", title: "AI 한국어 챗봇 제작 (2)" }],
        concepts: ["챗봇 개선·맞춤"],
        content: ["챗봇 문제 진단", "챗봇 개선 및 맞춤 설계"],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 한국어 챗봇 제작 (2), AI 활용 발표 (1)",
        sessions: [{ day: "화", title: "AI 한국어 챗봇 제작 (2)" }, { day: "목", title: "AI 활용 발표 (1): 발표 자료 제작" }],
        concepts: ["발표"],
        content: ["PPT 제작 도구 탐색", "AI Canvas 기능 활용 발표 자료·스크립트 제작"],
        homework: "주 2회 챗봇 대화 연습",
        videos: [{ title: "AI 발표 자료 만들기 영상 찾아보기", url: "https://www.youtube.com/results?search_query=AI+발표+자료+만들기" }] },
      { topic: "AI 활용 발표 (1), AI 활용 발표 (2)",
        sessions: [{ day: "화", title: "AI 활용 발표 (1): 발표 자료 제작" }, { day: "목", title: "AI 활용 발표 (2): 발표 연습 및 피드백" }],
        concepts: ["발표"], content: [],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 활용 발표 (2), AI 한국어 챗봇 제작 (3)",
        sessions: [{ day: "화", title: "AI 활용 발표 (2): 발표 연습 및 피드백" }, { day: "목", title: "AI 한국어 챗봇 제작 (3): 맞춤형 설계" }],
        concepts: ["맞춤형 챗봇 설계", "칼럼 쓰기"],
        content: ["맞춤형 챗봇 설계"],
        homework: "주 2회 챗봇 대화 연습", videos: [] },
      { topic: "AI 콘텐츠 제작 (1): 제작 방법, 주제 선정, 스토리보드",
        concepts: ["영상 콘텐츠"],
        content: ["팀프로젝트", "영상 제작 도구 탐색"],
        videos: [{ title: "AI 영상 제작 도구 영상 찾아보기", url: "https://www.youtube.com/results?search_query=AI+영상+제작+도구" }] },
      { topic: "AI 콘텐츠 제작 (2): 팀별 제작",
        concepts: ["영상 콘텐츠"],
        content: ["팀프로젝트", "한국어 음성, 자막"], videos: [] },
      { topic: "팀별 콘텐츠 발표 및 피드백, 한국어·AI 사용 성찰",
        sessions: [{ day: "", title: "팀별 콘텐츠 발표 및 피드백" }, { day: "", title: "한국어, AI 사용 성찰" }],
        concepts: ["영상 콘텐츠", "자기 성찰"],
        content: ["한국어 사용 성찰", "챗봇 및 수업 활동의 과정과 결과 성찰", "AI의 비판적 사용 성찰"],
        homework: "AI 사용 성찰 일지", videos: [],
        assignment: { title: "AI 사용 성찰 일지", desc: "한국어 사용, 챗봇 및 수업 활동의 과정과 결과, AI의 비판적 사용을 돌아보는 성찰 일지를 제출합니다. 제출 기한은 추후 공지합니다.", due: "" } },
      { topic: "기말고사", badge: "기말고사 주간",
        concepts: [], content: [], videos: [],
        assignment: { title: "기말고사 대체 과제 (AI 한국어 챗봇)", desc: "4주~12주 동안 직접 만든 AI 챗봇과 한국어로 대화 연습한 결과를 제출합니다. 세부 내용과 제출 기한은 추후 공지합니다.", due: "" } }
    ]
  },

  /* ---------- 9-1. 우수 과제 포트폴리오 ----------
     자료는 구글 드라이브(문서·슬라이드·시트·파일·폴더) 링크로만 등록합니다.
     - 드라이브에서 공유 설정을 '링크가 있는 모든 사용자 · 뷰어'로 바꾼 뒤 링크를 복사해 url에 넣으세요.
     - kind: 비워 두면 링크 모양으로 자동 판단(문서/슬라이드/시트/폴더/파일). 영상·이미지·PDF는 직접 적을 수 있습니다.
     - sample: true인 항목은 '샘플'로 표시되고 링크가 열리지 않습니다. 실제 과제물로 바꿀 때 지우세요.
     - 관리자 화면 > '포트폴리오 등록'에서 화면으로 등록할 수도 있습니다. */
  portfolio: {
    kicker: "Portfolio",
    title: "*우수* 과제 포트폴리오",
    lead: "수강생들의 우수 과제물을 소개합니다. 카드를 누르면 구글 드라이브에서 열립니다.",
    categories: ["AI 활용 번역", "AI 활용 칼럼", "AI 한국어 챗봇", "AI 활용 발표", "AI 영상 콘텐츠", "스토리북"],
    items: [
      { title: "직접 번역 vs AI 번역: 윤동주 「서시」를 베트남어로", category: "AI 활용 번역", week: "4주", student: "샘플 학생 A · 경영학과",
        desc: "같은 시를 직접 번역한 결과와 두 AI 번역기의 결과를 행마다 비교하고, 놓친 뉘앙스와 새로 배운 한국어 표현을 정리했습니다.",
        url: "https://docs.google.com/document/d/SAMPLE-translation/edit", kind: "", sample: true },
      { title: "칼럼: 유학생에게 '빨리빨리'란 무엇인가", category: "AI 활용 칼럼", week: "6–7주", student: "샘플 학생 B · 미디어학부",
        desc: "AI 역질문으로 주제를 좁히고 개요를 세운 뒤, 동료와 AI 피드백을 반영해 세 번 고쳐 쓴 칼럼입니다.",
        url: "https://docs.google.com/document/d/SAMPLE-column/edit", kind: "", sample: true },
      { title: "팀 영상: 안암동 한 끼 지도 (한국어 음성·자막)", category: "AI 영상 콘텐츠", week: "13–14주", student: "샘플 3팀",
        desc: "스토리보드부터 한국어 내레이션과 자막까지 AI 도구로 만든 3분 소개 영상입니다.",
        url: "https://drive.google.com/file/d/SAMPLE-video/view", kind: "영상", sample: true }
    ]
  },

  /* ---------- 10. 수강 준비물 ---------- */
  guide: {
    kicker: "Guide",
    title: "수강 *안내*",
    lead: "첫 수업 전에 아래 준비물을 확인해 주세요.",
    prepTitle: "수강 준비물",
    prep: [
      { title: "개인 노트북 (필수)", body: "매시간 AI 도구와 글쓰기를 실습합니다. 태블릿은 기능 제한이 있어 권장하지 않습니다." },
      { title: "생성형 AI 계정", body: "ChatGPT, Gemini 등 이미 쓰고 있는 계정을 준비하세요." },
      { title: "LMS · 공유 드라이브", body: "주차별 자료는 LMS에서 받고, 수업 활동 결과는 수업 시간 내에 공유 드라이브에 올립니다." },
      { title: "한국어 숙달도", body: "TOPIK 4급 이상 수준을 권장합니다. 개인 실습과 팀 실습이 함께 이루어집니다." }
    ]
  },

  /* ---------- 10-1. 수강 신청서 ----------
     required: true인 항목을 비우면 제출할 때 알려 줍니다.
     type: text / email / tel / select / radio / textarea / consent
     pattern: 형식 검사(정규식), patternMsg: 형식이 틀렸을 때 문구
     minLength: 최소 글자 수 */
  apply: {
    title: "수강 신청서",
    lead: "아래 신청서를 작성해 제출해 주세요. * 표시는 꼭 적어야 하는 항목입니다.",
    doneTitle: "수강 신청서가 제출되었습니다",
    doneBody: "교수자가 신청 내용을 확인한 뒤 수업 공지로 안내합니다. 제출한 내용은 아래에서 다시 고칠 수 있습니다.",
    fields: [
      { id: "name",       label: "이름",          type: "text",  required: true, placeholder: "홍길동" },
      { id: "studentId",  label: "학번",          type: "text",  required: true, placeholder: "2026123456", pattern: "^\\d{10}$", patternMsg: "학번은 숫자 10자리로 적어 주세요." },
      { id: "dept",       label: "소속 학과(학부)", type: "text", required: true, placeholder: "경영학과" },
      { id: "year",       label: "학년",          type: "select", required: true, options: ["1학년", "2학년", "3학년", "4학년", "5학년 이상"] },
      { id: "email",      label: "이메일",        type: "email", required: true, placeholder: "id@korea.ac.kr" },
      { id: "nationality", label: "국적",         type: "text",  required: false, placeholder: "베트남" },
      { id: "topik",      label: "TOPIK 급수",    type: "select", required: true, options: ["4급", "5급", "6급", "TOPIK 없음·기타"] },
      { id: "aiExp",      label: "생성형 AI 사용 수준", type: "radio", required: true, options: ["초급", "중급", "고급"] },
      { id: "motivation", label: "수강 동기",      type: "textarea", required: true, minLength: 20, placeholder: "이 강의에서 기대하는 점을 20자 이상 적어 주세요." },
      { id: "consent",    label: "개인정보 수집·이용 동의", type: "consent", required: true, text: "수강 관리를 위해 이름, 학번, 학과, 연락처를 학기 종료 시까지 보관하는 데 동의합니다." }
    ]
  },

  /* ---------- 10-2. 수강생 참여 공간 ---------- */
  participate: {
    kicker: "Join in",
    title: "참여 *공간*",
    lead: "로그인하면 과제 제출을 할 수 있습니다. 투표는 누구나 참여할 수 있습니다.",
    poll: {
      question: "가장 기대되는 수업 활동은 무엇인가요?",
      options: [
        { id: "prompt",    label: "프롬프트 실습·스토리북" },
        { id: "translate", label: "AI 활용 번역" },
        { id: "column",    label: "AI 활용 칼럼 쓰기" },
        { id: "chatbot",   label: "AI 한국어 챗봇 제작" },
        { id: "present",   label: "AI 활용 발표" },
        { id: "video",     label: "AI 영상 콘텐츠 제작" }
      ]
    },
    attendance: {
      onlyClassDay: true,   // true: 수업 날짜에만 출석 버튼이 열립니다.
      failAbsences: 11      // 이 횟수 이상 결석하면 경고를 보여 줍니다(강의계획서: 1/3, 11회).
    },
    submission: {
      maxMB: 3,                                              // 파일 1개 최대 크기(MB)
      accept: ".pdf,.docx,.hwp,.hwpx,.pptx,.txt,.jpg,.png",  // 받을 파일 형식
      allowLate: true                                        // 마감 후 제출 허용(지각 표시)
    }
  },

  /* ---------- 10-3. 첫 방문 안내 팝업 · 환영 효과 ---------- */
  popup: {
    enabled: true,
    delaySeconds: 2.5,
    title: "2026학년도 2학기 수강 신청 안내",
    body: "TOPIK 4급 이상 외국인 유학생을 위한, 생성형 AI로 한국어 의사소통능력을 키우는 강의입니다.",
    items: [
      "화·목 15:00–16:15 · 교양관 412호 · 3학점",
      "생성형 AI를 이미 사용하는 초~중급 학습자 대상",
      "AI 도구 유료 가입이 필요할 수 있습니다",
      "주차별 강의 계획을 확인한 뒤 신중히 신청해 주세요"
    ],
    button: "수강 신청서 작성하기",
    href: "#apply"
  },
  welcome: {
    fireworks: true,
    message: "「AI로배우는한국어」에 오신 것을 환영합니다!"
  },

  /* ---------- 10-4. 소개 띠 · 마지막 안내 ---------- */
  intro: {
    kicker: "About",
    title: "AI와 함께 *먼저* 말해 보는 한국어"
    // lead를 비워 두면 첫 화면 설명(hero.description)이 들어갑니다.
  },

  /* ---------- 11. 자주 묻는 질문 ---------- */
  faq: {
    kicker: "FAQ",
    title: "자주 묻는 *질문*",
    lead: "궁금한 질문을 누르면 답변이 열립니다.",
    items: [
      { q: "어떤 학생에게 맞는 과목인가요?", a: "중급 이상 한국어 숙달도(TOPIK 4급 이상)를 갖춘 외국인 유학생 가운데, 생성형 AI를 이미 사용하고 있고 활용 능력이 초~중급인 학생에게 적합합니다. <글쓰기>, <학문세계의탐구>를 이수했다면 더 좋습니다." },
      { q: "코딩이나 AI 도구 자체를 배우는 수업인가요?", a: "아니요. 생성형 AI로 한국어 의사소통능력을 향상시키는 데 중점을 둡니다. 수업 수준은 조정될 수 있으나 하네스 엔지니어링, AI 멀티 에이전트 같은 AI 설계 수준으로 올라가지는 않습니다." },
      { q: "AI를 이미 능숙하게 쓰고 있어도 들어도 되나요?", a: "이미 글쓰기, 학업, 생활에서 AI를 능숙하게 활용하고 있다면 AI 활용 역량 향상에는 한계가 있습니다. 주차별 강의 계획을 확인한 뒤 신중히 신청해 주세요." },
      { q: "AI 도구를 유료로 가입해야 하나요?", a: "AI를 활용한 한국어 학습 능력 향상을 위해 유료 가입이 필요할 수 있습니다." },
      { q: "태블릿으로 수업을 들어도 되나요?", a: "권장하지 않습니다. 태블릿은 노트북과 기능이 같지 않고 사용에 제한이 있어, 매시간 개인 노트북을 지참해야 합니다." },
      { q: "평가는 어떻게 하나요?", a: "절대평가입니다. 출석 10%, 수업 중 과제 30%, 중간고사 대체 과제(AI 한국어 챗봇) 10%, 팀 프로젝트(콘텐츠 제작) 20%, 기말고사 대체 과제(AI 한국어 챗봇) 10%, 참여 및 태도 10%이며 평가점수는 공개하지 않습니다." },
      { q: "결석하면 어떻게 되나요?", a: "총 수업시간의 1/3(11회) 이상 결석하면 성적을 받을 수 없습니다. 결석한 주의 활동 결과물은 일주일 안에 공유 드라이브에 올려야 점수를 인정받으며, 이후 제출은 감점됩니다. 생리공결은 한 달에 1회만 인정됩니다." }
    ]
  },

  /* ---------- 12. 교수자 (페이지 맨 아래) ----------
     photo: 사진 파일을 assets 폴더에 넣고 "assets/professor.webp"처럼 적으세요.
            비워 두면 이름 첫 글자가 들어간 그림이 표시됩니다. */
  instructor: {
    kicker: "Instructor",
    name: "정미경",
    position: "고려대학교 학부대학",
    photo: "assets/professor.webp",
    bio: "AI를 잘 쓰는 사람을 넘어 AI를 활용하여 한국어 능력을 향상시킬 수 있는 자기주도적 학습자가 되도록 돕는 것이 이 강의의 목표입니다.",
    contacts: [
      { label: "E-mail", value: "jungmk@korea.ac.kr", type: "email" }
    ]
  },

  /* ---------- 13. 관리자 ----------
     비밀번호는 그대로 적지 않고 '암호화된 값(해시)'으로만 보관합니다.
     비밀번호를 바꾸려면 관리자 화면 > 설정 > '관리자 비밀번호 변경'을 쓰세요.
     (이 값을 직접 지우거나 고치면 로그인할 수 없게 됩니다.) */
  admin: {
    salt: "akd-salt-7Qx2",
    passwordHash: "b681228e50fbea9b037f1645560e9e7f025cad4558205e6a18c578aa833148b0"
  }
};
