"use strict";
/* ============ 로그인 결과 반영 ============ */
(function loadLoginState() {
    const servers = JSON.parse(localStorage.getItem("studinno-servers") || '["STUDINNO"]');
    const badge = document.getElementById("serverBadge");
    if (badge)
        badge.textContent = "🟢 " + servers.join(" + ");
    // SSO 연동 상태 → 사이드바 하단 뱃지
    const sso = JSON.parse(localStorage.getItem("studinno-sso") || "{}");
    document.querySelectorAll(".lb").forEach((lb) => {
        const name = (lb.textContent || "").toLowerCase();
        if ((name === "gitlab" && sso.gitlab) || (name === "kaggle" && sso.kaggle))
            lb.classList.add("on");
    });
})();
/* ============ 테마 토글 ============ */
const themeToggle = document.getElementById("themeToggle");
function applyTheme(t) {
    document.body.classList.toggle("dark", t === "dark");
    themeToggle.textContent = t === "dark" ? "🌙" : "☀️";
    localStorage.setItem("studinno-theme", t);
}
// 기본값 = light (순천대 포털 톤)
applyTheme(localStorage.getItem("studinno-theme") || "light");
themeToggle.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
    if (currentPage === "dashboard")
        drawRadar();
});
/* ============ 라우팅 ============ */
const TITLES = {
    dashboard: "대시보드",
    matching: "AI 매칭 엔진",
    projects: "산학프로젝트",
    workspace: "워크스페이스",
    ide: "클라우드 IDE / 형상관리",
    compete: "경진대회 · 해커톤",
    team: "팀구성",
    portfolio: "역량 인증 · 포트폴리오",
    roadmap: "진로 로드맵 · 학습 가이드",
    talent: "인재검색",
    ip: "지식재산권",
    infra: "인프라예약",
    admin: "관리자",
};
// 워크스페이스에서 현재 보고 있는 프로젝트 / 진로 로드맵 목표 직무
let currentWorkspace = "PJT-001";
let roadmapJob = "ai-eng";
// 대시보드 조회 기간 / AI 추천 과제 찜 목록
let dashPeriod = "3m";
const favProjects = new Set();
// F-PM 산학프로젝트: 검색어 + 상태 필터(전체/모집중/진행중/완료)
let projectQuery = "";
let projectFilter = "all";
// F-MA 대시보드: 추천 과제 모집상태 필터
let recFilter = "all";
// F-IP 지식재산권: 검색어 + 종류 필터 + 북마크
let ipQuery = "";
let ipFilter = "all";
const ipBookmarks = new Set();
// F-AI 인재검색: 관심인재 찜
const favTalents = new Set();
// F-AI 기업 매칭: JD 자유입력 텍스트(있으면 RFP 대신 JD 기준 매칭)
let jdText = "";
// F-AD 관리자: 회원 검색/필터 + 숨김 프로젝트 + 시스템 설정 토글
let memberQuery = "";
let memberRole = "all";
const hiddenProjects = new Set();
const adminSettings = {
    tls: true,
    encrypt: true,
    twofa: false,
};
// AI 매칭 엔진: 관점 토글(학생/기업) + 기업 관점에서 선택한 RFP + 이미 지원/제안한 매칭
let matchView = "student";
let matchRfp = "PJT-001";
const matchActed = new Set(); // `${pjtId}:${talent}` 키
// 인재검색 블라인드(공정 평가): 이름·아바타 마스킹
let talentBlind = false;
// 등록/제안 CTA 상태 (제안 보낸 인재 / 지원한 팀 / 이번 세션에 직접 등록한 항목)
const proposedTalents = new Set();
const appliedTeams = new Set();
const createdItems = new Set();
const recentSearches = ["스마트팩토리", "NLP 챗봇", "GPU 예약"];
const app = document.getElementById("app");
let currentPage = "dashboard";
// Enter/Space 로도 클릭되게 (키보드 접근성)
function keyActivate(el) {
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            el.click();
        }
    });
}
document.querySelectorAll(".nav-item").forEach((item) => {
    keyActivate(item);
    item.addEventListener("click", () => {
        goPage(item.dataset.page); // active 동기화 + 스켈레톤 전환
    });
});
// GNB 호버 드롭다운: 플라이아웃 항목 클릭 → 해당 페이지 (부모 nav-item 이동 방지)
document.querySelectorAll(".fly-item").forEach((fi) => {
    keyActivate(fi);
    fi.addEventListener("click", (e) => {
        e.stopPropagation();
        goPage(fi.dataset.page);
    });
});
// 모바일 햄버거: 사이드바 오버레이 토글
const menuToggle = document.getElementById("menuToggle");
const sidebarEl = document.getElementById("sidebar");
if (menuToggle && sidebarEl)
    menuToggle.onclick = (e) => {
        e.stopPropagation();
        sidebarEl.classList.toggle("open");
    };
// 사이드바 내부 클릭은 유지, 바깥 클릭 시 닫기 (모바일)
sidebarEl === null || sidebarEl === void 0 ? void 0 : sidebarEl.addEventListener("click", (e) => e.stopPropagation());
document.addEventListener("click", () => sidebarEl === null || sidebarEl === void 0 ? void 0 : sidebarEl.classList.remove("open"));
function render(page) {
    var _a;
    currentPage = page;
    document.getElementById("pageTitle").textContent =
        TITLES[page];
    app.innerHTML = PAGES[page]();
    if (page === "dashboard") {
        drawRadar();
        drawDemandDonut(dashPeriod);
        bindDonutTooltip();
    }
    if (page === "roadmap")
        drawRoadmapRadar();
    if (page === "admin")
        drawAdminMonitor();
    bindPageEvents(page);
    (_a = document.getElementById("sidebar")) === null || _a === void 0 ? void 0 : _a.classList.remove("open"); // 모바일: 이동 후 닫기
}
// 다른 모듈/버튼에서 페이지 이동 + 사이드바 active 동기화
// (워크스페이스·IDE·인재검색·로드맵은 플라이아웃 자식 → 부모 그룹 메뉴를 active 처리)
// 페이지 간 이동 시에만 스켈레톤을 잠깐 노출(데이터 로딩 시뮬레이션). 빠른 연타는 navSeq로 무효화.
let navSeq = 0;
function goPage(page) {
    var _a;
    document.querySelectorAll(".nav-item").forEach((n) => {
        const owns = n.dataset.page === page ||
            !!n.querySelector(`.fly-item[data-page="${page}"]`);
        n.classList.toggle("active", owns);
        if (owns)
            n.setAttribute("aria-current", "page");
        else
            n.removeAttribute("aria-current");
    });
    const seq = ++navSeq;
    currentPage = page;
    document.getElementById("pageTitle").textContent =
        TITLES[page];
    (_a = document.getElementById("sidebar")) === null || _a === void 0 ? void 0 : _a.classList.remove("open");
    app.innerHTML = skeletonFor(page);
    window.setTimeout(() => {
        if (seq === navSeq)
            render(page);
    }, 420);
}
/* ============ 헬퍼 ============ */
function statCard(label, val, ic) {
    return `
  <div class="card stat"><div class="stat-ic">${ic}</div>
  <div><div class="stat-val">${val}</div><div class="stat-lb">${label}</div></div></div>`;
}
/* ===== F-PM 산학프로젝트: 검색·상태 필터 + 카드 ===== */
function projectFilterTabs() {
    const tabs = [
        ["all", "전체"],
        ["모집중", "모집중"],
        ["진행중", "진행중"],
        ["완료", "완료"],
    ];
    return tabs
        .map(([k, label]) => `<button class="cat-tab ${projectFilter === k ? "active" : ""}" data-pf="${k}">${label}</button>`)
        .join("");
}
function filteredProjects() {
    const q = projectQuery.replace(/#/g, "").trim().toLowerCase();
    return DATA.projects.filter((p) => {
        if (hiddenProjects.has(p.id))
            return false; // 관리자가 숨김 처리한 프로젝트 비노출
        if (projectFilter !== "all" && p.status !== projectFilter)
            return false;
        if (!q)
            return true;
        return (p.title.toLowerCase().includes(q) ||
            p.company.toLowerCase().includes(q) ||
            p.category.join(" ").toLowerCase().includes(q) ||
            p.reqTags.join(" ").toLowerCase().includes(q));
    });
}
function projectCard(p) {
    return `
        <div class="card pjt">
          <div class="pjt-head">
            <span class="badge ${stClass(p.status)}">${p.status}</span>
            <span class="ide-btn">${p.ide === "gitlab" ? "🦊 GitLab IDE" : "📊 Kaggle"}</span>
            ${delBtn("project", p.id)}
          </div>
          <h3 class="card-title">${p.title}</h3>
          <p class="muted">${p.company} · 👥 ${p.members.length}명</p>
          <div class="tags">${p.category
        .map((c) => `<span class="tag">#${c}</span>`)
        .join("")}</div>
          <div class="repo-meta">
            <span class="lic-badge">⚖️ ${p.license}</span>
            <span class="vis-badge ${p.visibility}">${p.visibility === "public" ? "🌐 Public" : "🔒 Private"}</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${p.progress}%"></div></div>
          <p class="muted sm">진행률 ${p.progress}%</p>
          <button class="btn primary full ws-enter-btn" data-pjt="${p.id}">🗂️ 워크스페이스 입장</button>
          <div class="files">
            <div class="files-title">
              📁 파일 (열람권한)
              <button class="perm-edit-btn" data-pjt="${p.id}">⚙️ 권한수정</button>
            </div>
            ${p.files
        .map((f) => `
              <div class="file-row" data-pjt="${p.id}" data-file="${f.name}" data-perm="${f.perm}">
                <span>${permIcon(f.perm)} ${f.name}</span>
                <span class="perm ${f.perm}">${permLabel(f.perm)}</span>
              </div>`)
        .join("")}
          </div>
        </div>`;
}
function projectGrid() {
    const list = filteredProjects();
    if (!list.length)
        return DATA.projects.length
            ? emptyState("조건에 맞는 산학과제가 없습니다.", "🔍")
            : emptyState("등록된 산학과제가 없습니다. ‘+ RFP 등록’으로 추가하세요.", "🏭");
    return list.map(projectCard).join("");
}
// 프로젝트 카드 내부 버튼 바인딩 (그리드 리렌더 시 재호출)
function bindProjectCards() {
    document.querySelectorAll("#projectGrid .file-row").forEach((row) => {
        row.addEventListener("click", () => {
            const perm = row.dataset.perm;
            const file = row.dataset.file;
            const pjt = row.dataset.pjt;
            if (perm === "public")
                toast(`📄 <b>${file}</b> 열람을 시작합니다.`, "success");
            else
                openRequestModal(pjt, file, perm);
        });
    });
    document.querySelectorAll("#projectGrid .perm-edit-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openPermEditModal(btn.dataset.pjt);
        });
    });
    document.querySelectorAll("#projectGrid .ws-enter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            currentWorkspace = btn.dataset.pjt;
            goPage("workspace");
        });
    });
    // del-btn은 초기엔 bindPageEvents 상단의 전역 바인딩이 처리(중복 방지) → 리렌더 시에만 재바인딩
}
function refreshProjectGrid() {
    const grid = document.getElementById("projectGrid");
    if (!grid)
        return;
    grid.innerHTML = projectGrid();
    bindProjectCards();
    grid.querySelectorAll(".del-btn").forEach((b) => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteCreated(b.dataset.del, b.dataset.id);
        });
    });
}
function talentCard(t, idx = 0) {
    // 블라인드: 이름·아바타만 가리고 역량·태그는 그대로 노출 (공정 평가)
    const avatar = talentBlind ? "🙈" : t.name.slice(0, 2);
    const name = talentBlind ? `지원자 ${String.fromCharCode(65 + idx)}` : t.name;
    const faved = favTalents.has(t.name);
    return `
  <div class="card talent-card${talentBlind ? " blind" : ""}">
    <button class="fav-btn talent-fav ${faved ? "on" : ""}" data-fav="${t.name}" title="관심 인재" aria-label="관심 인재">${faved ? "★" : "☆"}</button>
    <div class="avatar">${avatar}</div>
    <h3 class="card-title">${name}</h3>
    <p class="muted sm">${t.major}</p>
    <div class="score-row"><span>코딩 ${t.coding}</span><span>실무 ${t.practice}</span></div>
    <div class="tags">${t.tags.map((g) => `<span class="tag">${g}</span>`).join("")}</div>
    ${compAwardBadge(t.name)}
    <button class="btn outline full propose-btn" data-name="${t.name}" ${proposedTalents.has(t.name) ? "disabled" : ""}>${proposedTalents.has(t.name) ? "✓ 제안 완료" : "제안하기"}</button>
  </div>`;
}
function toggleFavTalent(name) {
    if (favTalents.has(name))
        favTalents.delete(name);
    else {
        favTalents.add(name);
        addNotif("⭐", `관심 인재 등록: <b>${name}</b>`);
    }
    const btn = document.querySelector(`.talent-fav[data-fav="${name}"]`);
    if (btn) {
        const on = favTalents.has(name);
        btn.classList.toggle("on", on);
        btn.textContent = on ? "★" : "☆";
    }
}
const stClass = (s) => s === "진행중" ? "open" : s === "완료" ? "done" : "info";
const permIcon = (p) => p === "public" ? "🌐" : p === "private" ? "🔒" : "📨";
const permLabel = (p) => p === "public" ? "공개" : p === "private" ? "비공개" : "요청필요";
const pjtTitle = (id) => { var _a; return ((_a = DATA.projects.find((p) => p.id === id)) === null || _a === void 0 ? void 0 : _a.title) || "프로젝트"; };
/* ===== F-MA 대시보드: AI 추천 과제 / 차트 헬퍼 ===== */
function recFilterChips() {
    const tabs = [
        ["all", "전체"],
        ["모집중", "모집중"],
        ["진행중", "진행중"],
        ["완료", "완료"],
    ];
    return tabs
        .map(([k, label]) => `<button class="chip sm ${recFilter === k ? "active" : ""}" data-rf="${k}">${label}</button>`)
        .join("");
}
// 추천 카드(찜·클릭→매칭상세) 바인딩 — 필터 리렌더 시 재호출
function bindRecCards() {
    bindFavButtons();
    document.querySelectorAll("#recTrack .rec-card").forEach((c) => {
        c.addEventListener("click", (e) => {
            if (e.target.closest(".fav-btn"))
                return;
            matchView = "student";
            openMatchDetail(c.dataset.pjt, myTalent().name);
        });
    });
}
function recommendCards() {
    // AI 매칭 엔진과 동일한 skillMatch() 로 매칭률 산출 (전체 일관성)
    const me = myTalent();
    const recs = [...DATA.projects]
        .filter((p) => recFilter === "all" || p.status === recFilter)
        .sort((a, b) => skillMatch(b.req, me.skills) - skillMatch(a.req, me.skills));
    if (!recs.length)
        return emptyState("해당 모집상태의 추천 과제가 없습니다.", "🤝");
    return recs
        .map((p) => {
        const rate = skillMatch(p.req, me.skills);
        const fav = favProjects.has(p.id);
        return `
    <div class="rec-card" data-pjt="${p.id}">
      <div class="rec-top">
        <span class="match-ring ${ringClass(rate)}">${rate}%</span>
        <button class="fav-btn ${fav ? "on" : ""}" data-pjt="${p.id}" title="관심 과제">${fav ? "★" : "☆"}</button>
      </div>
      <h4 class="rec-title">${p.title}</h4>
      <p class="muted sm">${p.company}</p>
      <div class="tags">${p.category
            .slice(0, 3)
            .map((c) => `<span class="tag">#${c}</span>`)
            .join("")}</div>
      <div class="rec-foot muted sm">👥 ${p.members.length}명 · <span class="badge ${stClass(p.status)}">${p.status}</span></div>
    </div>`;
    })
        .join("");
}
/* ===== F-AI: AI 매칭 엔진 (RFP 요구역량 ↔ 학생 보유역량) ===== */
// 역량 6축 라벨 (DATA.skills 와 동일 순서)
const SKILL_AXES = DATA.skills.map((s) => s.label);
// 현재 로그인 사용자의 인재 프로필 (역량 6축·태그)
function myTalent() {
    return DATA.talents.find((t) => t.name === DATA.user.name) || DATA.talents[0];
}
// 요구역량 충족률 % : Σ min(보유, 요구) / Σ 요구
function skillMatch(req, skills) {
    let need = 0, have = 0;
    SKILL_AXES.forEach((k) => {
        const r = req[k] || 0;
        need += r;
        have += Math.min(skills[k] || 0, r);
    });
    return need ? Math.round((have / need) * 100) : 0;
}
// RFP 요구 태그 ∩ 인재 보유 태그 (둘 다 "#xxx" 형식)
function matchedTags(reqTags, talentTags) {
    return reqTags.filter((t) => talentTags.includes(t));
}
// 부족 역량 (요구 > 보유) 만 내림차순
function gapSkills(req, skills) {
    return SKILL_AXES.map((k) => ({ skill: k, deficit: (req[k] || 0) - (skills[k] || 0) }))
        .filter((g) => g.deficit > 0)
        .sort((a, b) => b.deficit - a.deficit);
}
// 매칭률 → 링 색상 클래스
function ringClass(pct) {
    return pct >= 85 ? "hi" : pct >= 70 ? "mid" : "lo";
}
// 일치 태그 + 부족역량 칩 묶음 (행 공통)
function matchTagRow(reqTags, talentTags, gaps) {
    const tags = matchedTags(reqTags, talentTags);
    const tagHtml = tags.length
        ? tags.map((t) => `<span class="tag on">${t} ✓</span>`).join("")
        : `<span class="muted sm">공통 태그 없음</span>`;
    const gapHtml = gaps.length
        ? `<span class="gap-chip">보완 ${gaps[0].skill} −${gaps[0].deficit}</span>`
        : `<span class="tag full">요구역량 충족 ✓</span>`;
    return `<div class="mr-tags">${tagHtml}${gapHtml}</div>`;
}
// ----- 학생 관점: 내 역량과 일치하는 RFP -----
function matchRowStudent(p) {
    const me = myTalent();
    const pct = skillMatch(p.req, me.skills);
    const gaps = gapSkills(p.req, me.skills);
    return `
    <div class="match-row">
      <div class="mr-ring ${ringClass(pct)}"><span>${pct}<i>%</i></span></div>
      <div class="mr-body">
        <div class="mr-top"><h4>${p.title}</h4><span class="badge ${stClass(p.status)}">${p.status}</span></div>
        <p class="muted sm">${p.company} · 👥 ${p.members.length}명</p>
        ${matchTagRow(p.reqTags, me.tags, gaps)}
      </div>
      <button class="btn outline mr-detail" data-rfp="${p.id}" data-talent="${me.name}">매칭 상세 ›</button>
    </div>`;
}
function matchStudentView() {
    const me = myTalent();
    const ranked = [...DATA.projects].sort((a, b) => skillMatch(b.req, me.skills) - skillMatch(a.req, me.skills));
    return `
    <div class="card">
      <h3 class="card-title">🎯 내 역량과 일치하는 산학과제 <span class="muted sm">(${me.name} · 6축 역량 기준)</span></h3>
      <div class="match-list">${ranked.length
        ? ranked.map(matchRowStudent).join("")
        : emptyState("매칭할 산학과제가 없습니다. 산학프로젝트에서 RFP를 등록하세요.", "🎯")}</div>
    </div>`;
}
// ----- 기업 관점: 선택한 RFP에 추천되는 인재 -----
function matchRowTalent(t, p) {
    const base = skillMatch(p.req, t.skills);
    const bonus = talentCompBonus(t.name);
    const pct = Math.min(100, base + bonus);
    const gaps = gapSkills(p.req, t.skills);
    return `
    <div class="match-row">
      <div class="mr-ring ${ringClass(pct)}"><span>${pct}<i>%</i></span></div>
      <div class="mr-body">
        <div class="mr-top"><h4>${t.name}</h4><span class="muted sm">${t.major}</span>${bonus ? `<span class="match-bonus" title="역량 ${base}% + 대회가점 ${bonus}">🏆 +${bonus}</span>` : ""}</div>
        <p class="muted sm">코딩 ${t.coding} · 실무 ${t.practice} · 프로젝트 ${t.projects}건</p>
        ${matchTagRow(p.reqTags, t.tags, gaps)}
        ${compAwardBadge(t.name)}
      </div>
      <button class="btn outline mr-detail" data-rfp="${p.id}" data-talent="${t.name}">매칭 상세 ›</button>
    </div>`;
}
// JD 자유입력 → 키워드 토큰화 후 인재 태그와 매칭 점수 산출
function jdKeywords() {
    return Array.from(new Set(jdText
        .toLowerCase()
        .split(/[^a-z0-9가-힣]+/)
        .filter((w) => w.length >= 2)));
}
function jdMatchedTags(t) {
    const kws = jdKeywords();
    return t.tags.filter((tag) => {
        const lt = tag.replace(/#/g, "").toLowerCase();
        return kws.some((k) => lt.includes(k) || k.includes(lt));
    });
}
function jdScore(t) {
    if (!jdKeywords().length)
        return 0;
    const ratio = t.tags.length ? jdMatchedTags(t).length / t.tags.length : 0;
    return Math.min(99, Math.round(ratio * 60 + ((t.coding + t.practice) / 2) * 0.4));
}
function matchRowTalentJd(t) {
    var _a;
    const pct = jdScore(t);
    const matched = jdMatchedTags(t);
    const rfpId = ((_a = DATA.projects[0]) === null || _a === void 0 ? void 0 : _a.id) || "";
    return `
    <div class="match-row">
      <div class="mr-ring ${ringClass(pct)}"><span>${pct}<i>%</i></span></div>
      <div class="mr-body">
        <div class="mr-top"><h4>${t.name}</h4><span class="muted sm">${t.major}</span></div>
        <p class="muted sm">코딩 ${t.coding} · 실무 ${t.practice} · 프로젝트 ${t.projects}건</p>
        <div class="tags">${t.tags
        .map((g) => `<span class="tag ${matched.includes(g) ? "hit" : ""}">${g}</span>`)
        .join("")}</div>
      </div>
      <button class="btn outline mr-detail" data-rfp="${rfpId}" data-talent="${t.name}">매칭 상세 ›</button>
    </div>`;
}
function matchCompanyView() {
    const jdActive = jdText.trim().length > 0;
    const jdBox = `
    <div class="jd-box">
      <label class="field-label">📝 채용 공고(JD) 자유 입력 <span class="muted sm">— 붙여넣으면 AI가 요구 역량을 분석해 매칭</span></label>
      <textarea class="modal-textarea" id="jdInput" placeholder="예) Python·컴퓨터비전 기반 제조 불량검출 모델 개발. PyTorch, OpenCV 경험 우대. 데이터 전처리 및 MLOps 역량 필요.">${jdText}</textarea>
      <div class="jd-actions">
        <button class="btn primary" onclick="analyzeJd(this)">🤖 JD로 매칭 분석</button>
        ${jdActive ? `<button class="btn outline" onclick="clearJd()">RFP 선택으로 전환</button>` : ""}
      </div>
    </div>`;
    if (jdActive) {
        const ranked = [...DATA.talents].sort((a, b) => jdScore(b) - jdScore(a));
        return `
    <div class="card">
      <h3 class="card-title">🏢 추천 인재 <span class="muted sm">(JD 분석 · 키워드 매칭순)</span></h3>
      ${jdBox}
      <div class="rfp-req muted sm">🔑 추출 키워드: ${jdKeywords()
            .slice(0, 10)
            .map((k) => `<span class="tag">${k}</span>`)
            .join("")}</div>
      <div class="match-list">${ranked.map((t) => matchRowTalentJd(t)).join("")}</div>
    </div>`;
    }
    const p = DATA.projects.find((x) => x.id === matchRfp) || DATA.projects[0];
    if (!p)
        return `<div class="card">${emptyState("등록된 RFP가 없습니다. 산학프로젝트에서 RFP를 등록하세요.", "🏢")}</div>`;
    // 종합 점수 = 역량 매칭% + 대회 입상 가점 (대회 우승팀원이 상위 랭크)
    const compScore = (t) => Math.min(100, skillMatch(p.req, t.skills) + talentCompBonus(t.name));
    const ranked = [...DATA.talents].sort((a, b) => compScore(b) - compScore(a));
    return `
    <div class="card">
      <h3 class="card-title">🏢 RFP별 추천 인재 <span class="muted sm">(역량 매칭 + 🏆 대회 가점 종합순)</span></h3>
      ${jdBox}
      <div class="rfp-chips" id="rfpChips">
        ${DATA.projects
        .map((x) => `<button class="chip ${matchRfp === x.id ? "active" : ""}" data-rfp="${x.id}">${x.title}</button>`)
        .join("")}
      </div>
      <div class="rfp-req muted sm">요구 기술: ${p.reqTags
        .map((t) => `<span class="tag">${t}</span>`)
        .join("")}</div>
      <div class="match-list">${ranked.map((t) => matchRowTalent(t, p)).join("")}</div>
    </div>`;
}
function analyzeJd(btn) {
    const ta = document.getElementById("jdInput");
    const val = ta ? ta.value.trim() : "";
    if (!val) {
        toast("⚠️ JD(채용공고) 내용을 입력하세요.", "warn");
        return;
    }
    busy(btn, () => {
        jdText = val;
        addNotif("🤖", "JD 기반 인재 매칭 분석 완료");
        toast("🤖 JD를 분석해 추천 인재를 갱신했습니다.", "success");
        render("matching");
    });
}
function clearJd() {
    jdText = "";
    render("matching");
}
// ----- 매칭 상세 모달 (레이더 오버레이 + 일치근거 + 부족역량·학습추천) -----
function openMatchDetail(rfpId, talentName) {
    const p = DATA.projects.find((x) => x.id === rfpId);
    const t = DATA.talents.find((x) => x.name === talentName);
    if (!p || !t)
        return;
    const pct = skillMatch(p.req, t.skills);
    const tags = matchedTags(p.reqTags, t.tags);
    const gaps = gapSkills(p.req, t.skills);
    const reasonHtml = tags.length
        ? tags.map((tg) => `<span class="tag on">${tg} ✓</span>`).join("")
        : `<span class="muted sm">공통 기술 태그가 없습니다.</span>`;
    // 요구역량 충족 축도 근거로 표시
    const metAxes = SKILL_AXES.filter((k) => (t.skills[k] || 0) >= (p.req[k] || 0) && (p.req[k] || 0) > 0);
    const metHtml = metAxes.length
        ? `<div class="met-axes">${metAxes
            .map((k) => `<span class="tag on">${k} 충족 ✓</span>`)
            .join("")}</div>`
        : "";
    const gapHtml = gaps.length
        ? gaps
            .map((g) => {
            const rec = DATA.learnRecs.find((r) => r.skill === g.skill);
            const recHtml = rec
                ? `<div class="gap-rec">↳ 추천: <b>${rec.title}</b> <span class="muted sm">(${rec.kind} · 예상 +${rec.gain})</span></div>`
                : `<div class="gap-rec muted sm">↳ 관련 비교과/프로젝트 참여 권장</div>`;
            return `
        <div class="gap-item">
          <div class="gap-line"><span class="gap-chip">${g.skill}</span><span class="muted sm">요구 ${p.req[g.skill]} · 보유 ${t.skills[g.skill] || 0} (−${g.deficit})</span></div>
          ${recHtml}
        </div>`;
        })
            .join("")
        : `<p class="muted sm">요구역량을 모두 충족합니다. 🎉</p>`;
    const key = `${p.id}:${t.name}`;
    const acted = matchActed.has(key);
    const actLabel = matchView === "company" ? "이 인재에게 제안 보내기" : "이 과제 지원하기";
    const doneLabel = matchView === "company" ? "✓ 제안 완료" : "✓ 지원 완료";
    const actBtn = acted
        ? `<button class="btn" disabled>${doneLabel}</button>`
        : `<button class="btn primary" onclick="matchAct('${p.id}','${t.name}')">${actLabel}</button>`;
    openModal(`
    <div class="modal-head">
      <h3>🤝 매칭 상세</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <div class="match-detail">
      <div class="md-head">
        <div class="md-side"><span class="muted sm">RFP</span><b>${p.title}</b><span class="muted sm">${p.company}</span></div>
        <div class="md-score ${ringClass(pct)}">${pct}<i>%</i></div>
        <div class="md-side right"><span class="muted sm">인재</span><b>${t.name}</b><span class="muted sm">${t.major}</span></div>
      </div>
      <div class="md-radar">
        <canvas id="matchRadar" width="240" height="240"></canvas>
        <div class="skill-legend">
          <span><i class="tgt"></i>RFP 요구역량</span>
          <span><i class="cur"></i>${t.name} 보유역량</span>
        </div>
      </div>
      <div class="md-grid">
        <div>
          <h4 class="mini-title">✅ 일치 근거</h4>
          <div class="mr-tags">${reasonHtml}</div>
          ${metHtml}
        </div>
        <div>
          <h4 class="mini-title">📉 부족 역량 · 학습 추천</h4>
          <div class="gap-list">${gapHtml}</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn outline" onclick="closeModal()">닫기</button>
        ${actBtn}
      </div>
    </div>
  `);
    drawMatchRadar("matchRadar", p.req, t.skills);
}
function matchAct(rfpId, talent) {
    matchActed.add(`${rfpId}:${talent}`);
    closeModal();
    const msg = matchView === "company"
        ? `🏢 <b>${talent}</b>님에게 매칭 제안을 보냈습니다. 수락 시 알림을 드립니다.`
        : `🎓 <b>${pjtTitle(rfpId)}</b> 과제에 지원했습니다. 기업 검토 후 알림을 드립니다.`;
    addNotif(matchView === "company" ? "🤝" : "🎓", msg);
    toast(msg, "success");
}
/* ===== F-PM 워크스페이스: 칸반 / 결과물 헬퍼 ===== */
const KANBAN_LABELS = {
    todo: "할 일",
    doing: "진행 중",
    done: "완료",
};
function kanbanCard(t) {
    return `
  <div class="kb-card" draggable="true" data-id="${t.id}">
    <div class="kb-title">${t.title}</div>
    <div class="kb-meta"><span class="chip sm">${t.assignee}</span><span class="kb-due">📅 ${t.due}</span></div>
  </div>`;
}
function kanbanColumn(col, label, pjt) {
    const cards = DATA.kanban.filter((t) => t.project === pjt && t.col === col);
    return `
  <div class="kb-col" data-col="${col}">
    <div class="kb-col-head">${label} <span class="kb-count">${cards.length}</span>${col === "todo"
        ? ` <button class="kb-add" data-pjt="${pjt}" title="새 Task">+</button>`
        : ""}</div>
    <div class="kb-drop" data-col="${col}">${cards
        .map(kanbanCard)
        .join("")}</div>
  </div>`;
}
function deliverableRows(pjt) {
    const items = DATA.deliverables.filter((d) => d.project === pjt);
    if (!items.length)
        return `<p class="muted sm">업로드된 산출물이 없습니다.</p>`;
    return items
        .map((d) => `
    <div class="deliver-row">
      <span class="dl-name">📄 ${d.name}</span>
      <span class="muted sm">${d.size} · ${d.by} · ${d.time}</span>
    </div>`)
        .join("");
}
/* ===== F-ID 클라우드 IDE / 형상관리 헬퍼 ===== */
function providerMeta(p) {
    if (p === "gitlab")
        return { ic: "🦊", label: "GitLab 웹IDE" };
    if (p === "kaggle")
        return { ic: "📊", label: "Kaggle 노트북" };
    return { ic: "📓", label: "Jupyter Lab" };
}
function envCard(e) {
    const pm = providerMeta(e.provider);
    const running = e.status === "running";
    return `
  <div class="card env-card">
    <div class="env-head">
      <span class="env-prov ${e.provider}">${pm.ic} ${pm.label}</span>
      <span class="badge ${running ? "open" : "info"}">${running ? "● 실행중" : "○ 중지됨"}</span>
    </div>
    <h3 class="card-title">${e.name}</h3>
    <p class="muted sm">🧱 ${e.stack} ${e.version} · ${running ? `CPU ${e.cpu}% · RAM ${e.ram}%` : "리소스 0%"}</p>
    <div class="env-actions">
      <button class="btn ${running ? "primary" : "outline"} sm env-run-btn" data-id="${e.id}">${running ? "↗ 새 창 열기" : "▶ 시작"}</button>
      <button class="btn outline sm env-toggle-btn" data-id="${e.id}">${running ? "⏹ 중지" : ""}</button>
    </div>
  </div>`;
}
function commitRows(pjt) {
    const list = DATA.commits.filter((c) => c.project === pjt);
    if (!list.length)
        return `<p class="muted sm">커밋 내역이 없습니다.</p>`;
    return list
        .map((c) => `
    <div class="commit-row" data-id="${c.id}">
      <span class="commit-graph">●</span>
      <div class="commit-body">
        <div class="commit-msg">${c.msg}</div>
        <div class="commit-meta muted sm">${c.author} · ${c.time} · <code>${c.id}</code>
          <span class="diff-stat"><b class="add">+${c.added}</b> <b class="del">−${c.removed}</b></span>
        </div>
      </div>
      <button class="btn outline sm diff-btn" data-id="${c.id}">Diff 보기</button>
    </div>`)
        .join("");
}
/* ===== F-CR 역량인증 / 포트폴리오 헬퍼 ===== */
function badgeCardEl(b) {
    return `
  <div class="badge-item clickable" data-badge="${b.name}" data-type="${b.type}">
    <div class="badge-ic">${b.icon}</div>
    <div class="badge-nm">${b.name}</div>
    <div class="badge-meta">${b.type} · ${b.date}</div>
  </div>`;
}
function evalRows() {
    return DATA.evaluations
        .map((e) => `
    <div class="eval-row">
      <div>
        <div class="eval-stu">🎓 ${e.student} <span class="muted sm">· ${pjtTitle(e.project)}</span></div>
        <div class="muted sm">평가자: ${e.evaluator}</div>
      </div>
      ${e.done
        ? `<span class="badge done">✅ ${e.quant}점 · ${e.badge}</span>`
        : `<button class="btn primary sm eval-btn" data-id="${e.id}">평가하기</button>`}
    </div>`)
        .join("");
}
/* ===== F-AI 진로 로드맵 / 학습 가이드 헬퍼 ===== */
function timelineNode(m) {
    const ic = m.type === "프로젝트" ? "🏭" : m.type === "인증" ? "🏅" : "📘";
    return `
  <div class="tl-node ${m.done ? "done" : "future"}">
    <div class="tl-dot">${m.done ? "✓" : ""}</div>
    <div class="tl-card">
      <div class="tl-period">${m.period}</div>
      <div class="tl-label">${ic} ${m.label}</div>
    </div>
  </div>`;
}
function weakRecs(job) {
    // 현재 역량 대비 목표 갭이 큰 역량부터 정렬, 해당 역량 보완 추천 우선 노출
    const cur = {};
    DATA.skills.forEach((s) => (cur[s.label] = s.value));
    const gap = (skill) => (job.target[skill] || 0) - (cur[skill] || 0);
    const recs = [...DATA.learnRecs].sort((a, b) => gap(b.skill) - gap(a.skill));
    return recs
        .map((r) => {
        const g = gap(r.skill);
        return `
    <div class="learn-row ${g > 0 ? "weak" : ""}">
      <div>
        <div class="learn-title">${r.kind === "교과" ? "📘" : "🧩"} ${r.title}</div>
        <div class="muted sm">보완 역량: ${r.skill}${g > 0 ? ` <span class="gap">(목표 대비 −${g})</span>` : ""}</div>
      </div>
      <div class="learn-right">
        <span class="gain">+${r.gain}</span>
        <button class="btn outline sm" onclick="toast('📚 <b>${r.title}</b> 신청 페이지로 이동합니다.','info')">신청</button>
      </div>
    </div>`;
    })
        .join("");
}
/* ============ 등록/제안 CTA + 알림 이벤트화 ============ */
// 입력값 읽기 (input/select/textarea 공통)
function fv(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
// "#a, b c" → ["#a","#b","#c"] (hash=true) 또는 ["a","b","c"]
function parseTags(s, hash) {
    return s
        .split(/[,\s]+/)
        .map((x) => x.replace(/^#+/, ""))
        .filter(Boolean)
        .map((x) => (hash ? "#" + x : x));
}
// 고유 ID (접두어 + 타임스탬프)
function uid(prefix) {
    return prefix + "-" + Date.now();
}
// 알림함에 새 알림 추가 (미확인 dot 갱신)
function addNotif(icon, title) {
    DATA.notifs.unshift({ id: uid("N"), icon, title, time: "방금", read: false });
    renderNotifs();
}
// 빈 목록 플레이스홀더
function emptyState(msg, icon = "📭") {
    return `<div class="empty-state"><div class="es-ic">${icon}</div><p>${msg}</p></div>`;
}
// 스켈레톤 셸 (페이지 전환 시 잠깐 노출 → 데이터 로딩 시뮬레이션)
function skCard() {
    return `<div class="sk-card">
    <div class="sk sk-title"></div>
    <div class="sk sk-line w90"></div>
    <div class="sk sk-line w70"></div>
    <div class="sk-chips"><span class="sk sk-chip"></span><span class="sk sk-chip"></span><span class="sk sk-chip"></span></div>
  </div>`;
}
function skeletonFor(page) {
    const cards = (n) => Array.from({ length: n }, skCard).join("");
    const statRow = `<div class="grid-3">${'<div class="sk-card"><div class="sk sk-stat"></div></div>'.repeat(3)}</div>`;
    const block = `<div class="sk-card"><div class="sk sk-block"></div></div>`;
    if (page === "dashboard")
        return `<div class="skeleton-wrap">${statRow}${block}<div class="grid-2">${block}${block}</div></div>`;
    if (page === "admin")
        return `<div class="skeleton-wrap">${statRow}${block}<div class="grid-2">${block}${block}</div></div>`;
    if (page === "ide" || page === "workspace")
        return `<div class="skeleton-wrap">${block}</div>`;
    // 기본: 툴바 + 카드 그리드 (projects/team/talent/ip/infra/matching/portfolio/roadmap)
    return `<div class="skeleton-wrap"><div class="sk-card"><div class="sk sk-line w30"></div></div><div class="grid-2">${cards(4)}</div></div>`;
}
// 내가 등록한 항목에만 노출되는 삭제 버튼
function delBtn(kind, id) {
    return createdItems.has(id)
        ? `<button class="del-btn" data-del="${kind}" data-id="${id}" title="삭제" aria-label="삭제">🗑</button>`
        : "";
}
// 자체 등록 항목 삭제
function deleteCreated(kind, id) {
    if (kind === "project") {
        DATA.projects = DATA.projects.filter((p) => p.id !== id);
        hiddenProjects.delete(id); // 숨김 상태도 정리 (스테일 방지)
    }
    else if (kind === "team")
        DATA.teams = DATA.teams.filter((t) => t.id !== id);
    else if (kind === "ip") {
        DATA.ip = DATA.ip.filter((x) => x.id !== id);
        ipBookmarks.delete(id); // 북마크 카운터 스테일 방지
    }
    createdItems.delete(id);
    toast("🗑 항목을 삭제했습니다.", "info");
    render(currentPage);
}
/* ----- RFP 등록 (기업) ----- */
function openRfpModal() {
    const axisInputs = SKILL_AXES.map((k, i) => `<label class="rq-axis">${k}<input class="input" id="rfpReq${i}" type="number" min="0" max="100" value="80"/></label>`).join("");
    openModal(`
    <div class="modal-head"><h3>🏭 RFP(산학과제) 등록</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="form-grid">
      <div class="fld"><label class="field-label">과제명 *</label><input class="input" id="rfpTitle" placeholder="예) 스마트팩토리 불량 검출 AI"/></div>
      <div class="fld"><label class="field-label">기업명 *</label><input class="input" id="rfpCompany" placeholder="예) ㈜대한정밀"/></div>
      <div class="fld"><label class="field-label">분야 (쉼표 구분)</label><input class="input" id="rfpCats" placeholder="AI, 비전, 실무"/></div>
      <div class="fld"><label class="field-label">요구 기술 태그</label><input class="input" id="rfpTags" placeholder="#비전 #Python"/></div>
      <div class="fld"><label class="field-label">라이선스</label>
        <select class="input" id="rfpLicense"><option>MIT</option><option>Apache-2.0</option><option>GPL-3.0</option><option>BSD-3-Clause</option></select></div>
      <div class="fld"><label class="field-label">공개 범위</label>
        <select class="input" id="rfpVis"><option value="private">🔒 Private</option><option value="public">🌐 Public</option></select></div>
      <div class="fld"><label class="field-label">연동 IDE</label>
        <select class="input" id="rfpIde"><option value="gitlab">🦊 GitLab</option><option value="kaggle">📊 Kaggle</option></select></div>
    </div>
    <label class="field-label">요구 역량 (0-100)</label>
    <div class="rq-grid">${axisInputs}</div>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="createRfp(this)">등록</button>
    </div>`);
}
function createRfp(btn) {
    const title = fv("rfpTitle");
    const company = fv("rfpCompany");
    if (!title || !company) {
        toast("⚠️ 과제명과 기업명을 입력하세요.", "warn");
        return;
    }
    const req = {};
    SKILL_AXES.forEach((k, i) => {
        const n = parseInt(fv("rfpReq" + i), 10);
        req[k] = isNaN(n) ? 80 : Math.max(0, Math.min(100, n));
    });
    const cats = parseTags(fv("rfpCats"), false);
    const id = uid("PJT");
    const newProject = {
        id,
        title,
        company,
        status: "모집중",
        category: cats.length ? cats : ["일반"],
        members: [],
        progress: 0,
        files: [{ name: "README.md", perm: "public" }],
        ide: fv("rfpIde") || "gitlab",
        license: fv("rfpLicense") || "MIT",
        visibility: fv("rfpVis") || "private",
        req,
        reqTags: parseTags(fv("rfpTags"), true),
    };
    busy(btn, () => {
        createdItems.add(id);
        DATA.projects.unshift(newProject);
        closeModal();
        addNotif("🏭", `새 RFP 등록: <b>${title}</b> (${company})`);
        toast(`✅ <b>${title}</b> 과제를 등록했습니다. AI 매칭에 반영됩니다.`, "success");
        render("projects");
    });
}
/* ----- 팀 만들기 ----- */
function openTeamModal() {
    const opts = DATA.projects
        .map((p) => `<option value="${p.title}">${p.title}</option>`)
        .join("");
    openModal(`
    <div class="modal-head"><h3>👥 팀 만들기</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="fld"><label class="field-label">팀명 *</label><input class="input" id="teamName" placeholder="예) 비전마스터즈"/></div>
    <div class="fld"><label class="field-label">연결 프로젝트</label><select class="input" id="teamProject">${opts}</select></div>
    <label class="agree-all" style="margin:4px 0 12px"><input type="checkbox" id="teamRecruit" checked/><span class="chk"></span><b>팀원 모집 중</b></label>
    <div class="fld"><label class="field-label">구인 역할 (쉼표 구분)</label><input class="input" id="teamNeed" placeholder="프론트엔드, 기획"/></div>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="createTeam(this)">만들기</button>
    </div>`);
}
function createTeam(btn) {
    var _a, _b, _c;
    const name = fv("teamName");
    if (!name) {
        toast("⚠️ 팀명을 입력하세요.", "warn");
        return;
    }
    const recruiting = (_b = (_a = document.getElementById("teamRecruit")) === null || _a === void 0 ? void 0 : _a.checked) !== null && _b !== void 0 ? _b : true;
    const id = uid("T");
    const newTeam = {
        id,
        name,
        project: fv("teamProject") || ((_c = DATA.projects[0]) === null || _c === void 0 ? void 0 : _c.title) || "",
        members: [DATA.user.name],
        recruiting,
        need: recruiting ? parseTags(fv("teamNeed"), false) : [],
    };
    busy(btn, () => {
        createdItems.add(id);
        DATA.teams.unshift(newTeam);
        closeModal();
        addNotif("👥", `팀 <b>${name}</b> 이(가) 생성되었습니다.`);
        toast(`✅ 팀 <b>${name}</b> 을(를) 만들었습니다.`, "success");
        render("team");
    });
}
function applyTeam(id) {
    appliedTeams.add(id);
    const t = DATA.teams.find((x) => x.id === id);
    addNotif("🙋", `팀 <b>${(t === null || t === void 0 ? void 0 : t.name) || ""}</b> 에 지원했습니다.`);
    toast(`✅ <b>${(t === null || t === void 0 ? void 0 : t.name) || "팀"}</b> 에 지원했습니다. 팀장 검토 후 알림을 드립니다.`, "success");
    render("team");
}
/* ----- IP 등록 ----- */
function openIpModal() {
    openModal(`
    <div class="modal-head"><h3>📑 지식재산권 등록</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="fld"><label class="field-label">제목 *</label><input class="input" id="ipTitle" placeholder="예) 불량 검출 영상처리 알고리즘"/></div>
    <div class="form-grid">
      <div class="fld"><label class="field-label">유형</label>
        <select class="input" id="ipType"><option>특허</option><option>저작권</option><option>디자인권</option><option>상표권</option></select></div>
      <div class="fld"><label class="field-label">상태</label>
        <select class="input" id="ipStatus"><option>출원중</option><option>출원완료</option><option>등록</option></select></div>
    </div>
    <div class="fld"><label class="field-label">태그 (쉼표 구분)</label><input class="input" id="ipTags" placeholder="비전, AI, 제조"/></div>
    <label class="agree-all" style="margin:4px 0 12px"><input type="checkbox" id="ipCoApply"/><span class="chk"></span><b>사업비 활용 → 기업과 공동출원</b></label>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="createIp(this)">등록</button>
    </div>`);
}
function createIp(btn) {
    var _a, _b;
    const title = fv("ipTitle");
    if (!title) {
        toast("⚠️ 제목을 입력하세요.", "warn");
        return;
    }
    const coApply = (_b = (_a = document.getElementById("ipCoApply")) === null || _a === void 0 ? void 0 : _a.checked) !== null && _b !== void 0 ? _b : false;
    const id = uid("IP");
    const newIp = {
        id,
        title,
        type: fv("ipType") || "특허",
        status: fv("ipStatus") || "출원중",
        owners: coApply
            ? [
                { name: DATA.user.name, type: "학생", share: 50 },
                { name: "산학협력기업", type: "기업", share: 50 },
            ]
            : [{ name: DATA.user.name, type: "학생", share: 100 }],
        coApply,
        tags: parseTags(fv("ipTags"), false),
    };
    busy(btn, () => {
        createdItems.add(id);
        DATA.ip.unshift(newIp);
        closeModal();
        addNotif("📑", `지식재산권 등록: <b>${title}</b>`);
        toast(`✅ <b>${title}</b> 을(를) 등록했습니다.`, "success");
        render("ip");
    });
}
/* ----- 인재 제안 (기업) ----- */
function openProposeModal(name) {
    openModal(`
    <div class="modal-head"><h3>📨 입사 제안</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc"><b>${name}</b> 님에게 입사·인턴 제안을 보냅니다.</p>
    <label class="field-label">제안 메시지</label>
    <textarea class="modal-textarea" id="proposeMsg" placeholder="예) 귀하의 비전/AI 역량에 맞는 포지션을 제안드립니다."></textarea>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="proposeTalent('${name}', this)">제안 보내기</button>
    </div>`);
}
function proposeTalent(name, btn) {
    busy(btn, () => {
        proposedTalents.add(name);
        closeModal();
        addNotif("📨", `<b>${name}</b> 님에게 입사 제안을 보냈습니다.`);
        toast(`✅ <b>${name}</b> 님에게 제안을 보냈습니다.`, "success");
        document
            .querySelectorAll(`.propose-btn[data-name="${name}"]`)
            .forEach((b) => {
            b.disabled = true;
            b.textContent = "✓ 제안 완료";
        });
    });
}
function bindPageEvents(page) {
    var _a, _b, _c, _d;
    // 자체 등록 항목 삭제 버튼 (projects/team/ip 공통)
    document.querySelectorAll(".del-btn").forEach((b) => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteCreated(b.dataset.del, b.dataset.id);
        });
    });
    /* ===== 대시보드: 기간필터 / 추천 슬라이드 / 찜 ===== */
    if (page === "dashboard") {
        const sel = document.getElementById("periodSel");
        if (sel)
            sel.addEventListener("change", () => {
                dashPeriod = sel.value;
                const bars = document.getElementById("eduBars");
                if (bars)
                    bars.innerHTML = eduBars(dashPeriod);
                const leg = document.getElementById("donutLegend");
                if (leg)
                    leg.innerHTML = donutLegend(dashPeriod);
                drawDemandDonut(dashPeriod);
            });
        const track = document.getElementById("recTrack");
        document.querySelectorAll(".rec-arrow").forEach((b) => {
            b.addEventListener("click", () => {
                if (track)
                    track.scrollBy({ left: Number(b.dataset.dir) * 280, behavior: "smooth" });
            });
        });
        bindRecCards();
        // 추천 과제 모집상태 필터
        document.querySelectorAll("#recFilters .chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                recFilter = chip.dataset.rf;
                document
                    .querySelectorAll("#recFilters .chip")
                    .forEach((c) => c.classList.remove("active"));
                chip.classList.add("active");
                if (track) {
                    track.innerHTML = recommendCards();
                    bindRecCards();
                }
            });
        });
    }
    /* ===== AI 매칭 엔진: 관점 토글 / RFP 선택 / 상세 ===== */
    if (page === "matching") {
        document.querySelectorAll("#matchSeg .seg-btn").forEach((b) => {
            b.addEventListener("click", () => {
                matchView = b.dataset.view;
                render("matching");
            });
        });
        document.querySelectorAll("#rfpChips .chip").forEach((c) => {
            c.addEventListener("click", () => {
                matchRfp = c.dataset.rfp;
                render("matching");
            });
        });
        document.querySelectorAll(".mr-detail").forEach((b) => {
            b.addEventListener("click", () => openMatchDetail(b.dataset.rfp, b.dataset.talent));
        });
    }
    if (page === "talent") {
        const r = document.getElementById("codeRange");
        const v = document.getElementById("codeVal");
        const s = document.getElementById("talentSearch");
        const list = document.getElementById("talentList");
        const refresh = () => {
            const min = +r.value;
            const q = s.value.replace("#", "").toLowerCase();
            list.innerHTML =
                DATA.talents
                    .filter((t) => t.coding >= min &&
                    (q === "" ||
                        t.name.toLowerCase().includes(q) ||
                        t.tags.join("").toLowerCase().includes(q)))
                    .map((t, i) => talentCard(t, i))
                    .join("") || emptyState("조건에 맞는 인재가 없습니다.", "🎯");
        };
        r.oninput = () => {
            v.textContent = r.value;
            refresh();
        };
        s.oninput = refresh;
        const blind = document.getElementById("blindToggle");
        if (blind)
            blind.addEventListener("change", () => {
                talentBlind = blind.checked;
                refresh();
            });
        // 제안하기 + 관심인재 찜 (리스트 리렌더와 무관하게 위임 바인딩)
        list.addEventListener("click", (e) => {
            const target = e.target;
            const fav = target.closest(".talent-fav");
            if (fav) {
                toggleFavTalent(fav.dataset.fav);
                return;
            }
            const btn = target.closest(".propose-btn");
            if (btn && !btn.disabled)
                openProposeModal(btn.dataset.name);
        });
    }
    /* ===== 산학프로젝트: 파일 열람권한 ===== */
    if (page === "projects") {
        bindProjectCards();
        // 요청 알림(받은 요청) 버튼
        const reqBtn = document.getElementById("incomingReqBtn");
        if (reqBtn)
            reqBtn.addEventListener("click", openIncomingModal);
        // RFP 등록
        (_a = document.getElementById("rfpRegBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", openRfpModal);
        // 검색어 → 그리드 필터 (리렌더 후 카드 재바인딩)
        const ps = document.getElementById("projectSearch");
        if (ps)
            ps.oninput = () => {
                projectQuery = ps.value;
                refreshProjectGrid();
            };
        // 상태 필터 탭
        document
            .querySelectorAll("#projectFilterTabs .cat-tab")
            .forEach((tab) => {
            tab.addEventListener("click", () => {
                projectFilter = tab.dataset.pf;
                document
                    .querySelectorAll("#projectFilterTabs .cat-tab")
                    .forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                refreshProjectGrid();
            });
        });
    }
    /* ===== 팀구성: 팀 만들기 / 지원하기 ===== */
    if (page === "team") {
        (_b = document.getElementById("teamNewBtn")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", openTeamModal);
        document.querySelectorAll(".apply-team").forEach((b) => {
            b.addEventListener("click", () => applyTeam(b.dataset.team));
        });
    }
    /* ===== 지식재산권: 등록 / 검색 / 필터 / 북마크 / 상세 ===== */
    if (page === "ip") {
        (_c = document.getElementById("ipRegBtn")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", openIpModal);
        bindIpCards();
        const is = document.getElementById("ipSearch");
        if (is)
            is.oninput = () => {
                ipQuery = is.value;
                refreshIpGrid();
            };
        document
            .querySelectorAll("#ipFilterTabs .cat-tab")
            .forEach((tab) => {
            tab.addEventListener("click", () => {
                ipFilter = tab.dataset.ipf;
                document
                    .querySelectorAll("#ipFilterTabs .cat-tab")
                    .forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                refreshIpGrid();
            });
        });
        // 북마크만 보기 토글
        (_d = document.getElementById("ipBookmarkBtn")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => {
            if (!ipBookmarks.size) {
                toast("북마크한 성과물이 없습니다.", "info");
                return;
            }
            openBookmarksModal();
        });
    }
    /* ===== 관리자: 회원 검색 / 구분 필터 ===== */
    if (page === "admin") {
        const ms = document.getElementById("memberSearch");
        if (ms)
            ms.oninput = () => {
                memberQuery = ms.value;
                refreshMemberTable();
            };
        document
            .querySelectorAll("#memberRoleTabs .cat-tab")
            .forEach((tab) => {
            tab.addEventListener("click", () => {
                memberRole = tab.dataset.mr;
                document
                    .querySelectorAll("#memberRoleTabs .cat-tab")
                    .forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                refreshMemberTable();
            });
        });
    }
    /* ===== 인프라 예약: 카테고리 탭 + 예약 신청 ===== */
    if (page === "infra") {
        // 카테고리(전체/장비/공간) 탭
        document
            .querySelectorAll("#infraCatTabs .cat-tab")
            .forEach((tab) => {
            tab.addEventListener("click", () => {
                infraCat = tab.dataset.cat;
                document
                    .querySelectorAll("#infraCatTabs .cat-tab")
                    .forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                const list = document.getElementById("infraList");
                if (list)
                    list.innerHTML = infraCards();
                bindInfraBookButtons();
            });
        });
        bindInfraBookButtons();
        // 내 예약 조회
        const myBtn = document.getElementById("myResvBtn");
        if (myBtn)
            myBtn.addEventListener("click", openMyReservationsModal);
    }
    /* ===== 워크스페이스: 탭 전환 / 칸반 DnD / 완료 / 업로드 ===== */
    if (page === "workspace") {
        document.querySelectorAll(".ws-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                currentWorkspace = tab.dataset.pjt;
                render("workspace");
            });
        });
        bindKanbanDnD();
        document.querySelectorAll(".kb-add").forEach((b) => {
            b.addEventListener("click", () => openAddTaskModal(b.dataset.pjt));
        });
        const comp = document.querySelector(".ws-complete-btn");
        if (comp && !comp.disabled)
            comp.addEventListener("click", () => completeProject(comp.dataset.pjt));
        // 결과물 업로드(드롭존)
        const drop = document.getElementById("deliverDrop");
        if (drop) {
            const doUpload = () => uploadDeliverable(currentWorkspace);
            drop.addEventListener("click", doUpload);
            drop.addEventListener("dragover", (e) => {
                e.preventDefault();
                drop.classList.add("drag");
            });
            drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
            drop.addEventListener("drop", (e) => {
                e.preventDefault();
                drop.classList.remove("drag");
                doUpload();
            });
        }
    }
    /* ===== 클라우드 IDE / 형상관리 ===== */
    if (page === "ide") {
        const nb = document.getElementById("newEnvBtn");
        if (nb)
            nb.addEventListener("click", openNewEnvModal);
        document.querySelectorAll(".env-run-btn").forEach((b) => {
            b.addEventListener("click", () => runEnv(b.dataset.id));
        });
        document.querySelectorAll(".env-toggle-btn").forEach((b) => {
            b.addEventListener("click", () => toggleEnv(b.dataset.id));
        });
        // GitLab 저장소 서브탭(커밋/브랜치/MR/이슈/파이프라인) + 패널 + 브랜치 선택
        bindRepoTabs();
        bindRepoPanel();
        const bs = document.getElementById("repoBranchSel");
        if (bs)
            bs.addEventListener("change", () => toast(`🌿 브랜치 <b>${bs.value}</b> 로 전환했습니다.`, "info"));
    }
    /* ===== Kaggle 경진대회 · 해커톤 ===== */
    if (page === "compete") {
        bindCompete();
    }
    /* ===== 역량인증 / 포트폴리오 ===== */
    if (page === "portfolio") {
        // 배지 카테고리 필터
        document
            .querySelectorAll("#badgeCats .cat-tab")
            .forEach((tab) => {
            tab.addEventListener("click", () => {
                document
                    .querySelectorAll("#badgeCats .cat-tab")
                    .forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                const cat = tab.dataset.cat;
                const grid = document.getElementById("badgeGrid");
                if (grid)
                    grid.innerHTML = DATA.badges
                        .filter((b) => cat === "전체" || b.type === cat)
                        .map(badgeCardEl)
                        .join("");
                bindBadgeClicks();
            });
        });
        bindBadgeClicks();
        // 평가하기
        document.querySelectorAll(".eval-btn").forEach((b) => {
            b.addEventListener("click", () => openEvalModal(b.dataset.id));
        });
        // 포트폴리오 내보내기 / 공유
        const ex = document.getElementById("pfExportBtn");
        if (ex)
            ex.addEventListener("click", () => toast("📥 디지털 포트폴리오를 PDF로 내보냈습니다. (다운로드 시작)", "success"));
        const sh = document.getElementById("pfShareBtn");
        if (sh)
            sh.addEventListener("click", () => toast("🔗 공유 링크가 클립보드에 복사되었습니다.", "info"));
    }
    /* ===== 진로 로드맵 / 학습 가이드 ===== */
    if (page === "roadmap") {
        const sel = document.getElementById("jobSelect");
        if (sel)
            sel.addEventListener("change", () => {
                roadmapJob = sel.value;
                render("roadmap");
            });
    }
}
function bindBadgeClicks() {
    document
        .querySelectorAll(".badge-item.clickable")
        .forEach((el) => {
        el.addEventListener("click", () => openBadgeDetail(el.dataset.badge));
    });
}
function bindInfraBookButtons() {
    document.querySelectorAll(".infra-book-btn").forEach((btn) => {
        btn.addEventListener("click", () => openInfraReservation(btn.dataset.id));
    });
}
/* ============ 인증 · 상태 영속화 · 공통 크롬 ============ */
const DATA_VERSION = "2026-06-23-2"; // 스키마 변경 시 올려 옛 스냅샷 무효화 (대회 팀·정밀 필드 추가)
// 미인증이면 로그인으로 보냄
function authGate() {
    if (!localStorage.getItem("studinno-auth")) {
        location.href = "pages/login.html";
        return false;
    }
    return true;
}
// 직전 세션 상태 복원 (DATA 스냅샷 + UI 상태)
function loadState() {
    try {
        if (localStorage.getItem("studinno-data-v") !== DATA_VERSION)
            return;
        const saved = localStorage.getItem("studinno-data");
        if (saved) {
            const obj = JSON.parse(saved);
            Object.keys(obj).forEach((k) => {
                DATA[k] = obj[k];
            });
        }
        const ui = localStorage.getItem("studinno-ui");
        if (ui) {
            const u = JSON.parse(ui);
            favProjects.clear();
            (u.fav || []).forEach((x) => favProjects.add(x));
            matchActed.clear();
            (u.acted || []).forEach((x) => matchActed.add(x));
            if (u.dashPeriod)
                dashPeriod = u.dashPeriod;
            if (u.matchView)
                matchView = u.matchView;
            if (u.matchRfp)
                matchRfp = u.matchRfp;
            talentBlind = !!u.blind;
            proposedTalents.clear();
            (u.proposed || []).forEach((x) => proposedTalents.add(x));
            appliedTeams.clear();
            (u.applied || []).forEach((x) => appliedTeams.add(x));
            createdItems.clear();
            (u.created || []).forEach((x) => createdItems.add(x));
            // 갭충전 신규 상태
            ipBookmarks.clear();
            (u.bookmarks || []).forEach((x) => ipBookmarks.add(x));
            favTalents.clear();
            (u.favTalents || []).forEach((x) => favTalents.add(x));
            hiddenProjects.clear();
            (u.hidden || []).forEach((x) => hiddenProjects.add(x));
            if (u.settings && typeof u.settings === "object") {
                Object.keys(adminSettings).forEach((k) => {
                    if (typeof u.settings[k] === "boolean")
                        adminSettings[k] = u.settings[k];
                });
            }
            if (u.projectFilter)
                projectFilter = u.projectFilter;
            if (u.ipFilter)
                ipFilter = u.ipFilter;
            if (u.recFilter)
                recFilter = u.recFilter;
        }
    }
    catch (e) {
        /* 손상된 스냅샷 무시 */
    }
}
// 현재 상태 저장 (페이지 이탈 시)
function saveState() {
    try {
        localStorage.setItem("studinno-data-v", DATA_VERSION);
        localStorage.setItem("studinno-data", JSON.stringify(DATA));
        localStorage.setItem("studinno-ui", JSON.stringify({
            fav: [...favProjects],
            acted: [...matchActed],
            dashPeriod,
            matchView,
            matchRfp,
            blind: talentBlind,
            proposed: [...proposedTalents],
            applied: [...appliedTeams],
            created: [...createdItems],
            bookmarks: [...ipBookmarks],
            favTalents: [...favTalents],
            hidden: [...hiddenProjects],
            settings: adminSettings,
            projectFilter,
            ipFilter,
            recFilter,
        }));
    }
    catch (e) {
        /* 용량 초과 등 무시 */
    }
}
// 로그인 결과(서버/SSO)를 사용자 프로필·사이드바 뱃지에 반영
function syncUserFromLogin() {
    try {
        const servers = JSON.parse(localStorage.getItem("studinno-servers") || "[]");
        const sso = JSON.parse(localStorage.getItem("studinno-sso") || "{}");
        if (servers.length)
            DATA.user.servers = servers;
        DATA.user.linked.gitlab = !!sso.gitlab;
        DATA.user.linked.kaggle = !!sso.kaggle;
        DATA.user.linked.sems = servers.includes("S.E.M.S");
    }
    catch (e) {
        /* 무시 */
    }
    renderLinkBadges();
}
function renderLinkBadges() {
    const map = {
        gitlab: DATA.user.linked.gitlab,
        kaggle: DATA.user.linked.kaggle,
        sems: DATA.user.linked.sems,
    };
    document.querySelectorAll("#linkBadges .lb").forEach((b) => {
        const on = !!map[b.dataset.link || ""];
        b.classList.toggle("on", on);
        b.classList.toggle("off", !on);
    });
}
// 회원가입(기업)에서 쌓인 승인 대기건을 관리자 큐에 병합
function mergeCompanySignups() {
    try {
        const arr = JSON.parse(localStorage.getItem("studinno-company-signups") || "[]");
        arr.forEach((cs) => {
            if (!DATA.companySignups.some((x) => x.id === cs.id)) {
                DATA.companySignups.unshift(cs);
            }
        });
    }
    catch (e) {
        /* 무시 */
    }
}
// 약관/개인정보 모달 (Footer)
function openDocModal(doc) {
    openModal(`
    <div class="modal-head"><h3>${doc}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc">본 ${doc}은(는) STUDINNO 플랫폼 이용에 적용됩니다. (데모용 요약)</p>
    <div class="doc-scroll">
      <p>제1조 (목적) 본 ${doc}은(는) STUDINNO 통합 플랫폼이 제공하는 산학협력·지식재산권·인프라 예약 서비스의 이용 조건을 규정합니다.</p>
      <p>제2조 (회원의 의무) 회원은 학사·산학 활동 관련 정보를 정확히 제공하며, 타인의 권리를 침해하지 않습니다.</p>
      <p>제3조 (개인정보) 수집된 정보는 인재 매칭·역량 인증·산학 연계 목적에 한해 활용됩니다.</p>
    </div>
    <div class="modal-actions"><button class="btn primary" onclick="closeModal()">확인</button></div>`);
}
function logout() {
    saveState();
    localStorage.removeItem("studinno-auth");
    location.href = "pages/login.html";
}
// 데모 데이터 초기화 (로그인 상태는 유지, 누적 변경분만 제거)
function resetDemo() {
    ["studinno-data", "studinno-data-v", "studinno-ui", "studinno-company-signups"].forEach((k) => localStorage.removeItem(k));
    location.reload();
}
// 로고(홈) · 프로필 팝업 · Footer 약관 바인딩 (시작 시 1회)
function initChrome() {
    var _a, _b, _c, _d;
    (_a = document
        .getElementById("brandHome")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => goPage("dashboard"));
    const chip = document.getElementById("userChip");
    const pop = document.getElementById("profilePop");
    if (chip && pop) {
        const roleLabel = DATA.user.role === "student" ? "학생" : DATA.user.role === "prof" ? "교원" : DATA.user.role;
        pop.innerHTML = `
      <div class="pp-head">
        <span class="user-avatar lg">${DATA.user.avatar}</span>
        <div>
          <div class="pp-name">${DATA.user.name}</div>
          <div class="pp-sub">${roleLabel} · ${DATA.user.id}</div>
        </div>
      </div>
      <div class="pp-servers">${DATA.user.servers
            .map((s) => `<span class="tag">🟢 ${s}</span>`)
            .join("")}</div>
      <button class="pp-item" id="ppProfile">🏅 내 역량·포트폴리오</button>
      <button class="pp-item" id="ppReset">🧹 데모 데이터 초기화</button>
      <button class="pp-item danger" id="ppLogout">🚪 로그아웃</button>`;
        chip.addEventListener("click", (e) => {
            e.stopPropagation();
            pop.hidden = !pop.hidden;
        });
        pop.addEventListener("click", (e) => e.stopPropagation());
        document.addEventListener("click", () => {
            pop.hidden = true;
        });
        (_b = document.getElementById("ppProfile")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            pop.hidden = true;
            goPage("portfolio");
        });
        (_c = document.getElementById("ppReset")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", resetDemo);
        (_d = document.getElementById("ppLogout")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", logout);
    }
    document.querySelectorAll(".foot-doc").forEach((a) => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            openDocModal(a.dataset.doc || "약관");
        });
    });
}
/* ============ 시작 ============ */
if (authGate()) {
    loadState();
    mergeCompanySignups();
    syncUserFromLogin();
    render("dashboard");
    initTopbar();
    initChrome();
    window.addEventListener("beforeunload", saveState);
    window.addEventListener("pagehide", saveState);
}
/* ============ 공통 모달 / 토스트 ============ */
const overlay = document.getElementById("modalOverlay");
const modalBox = document.getElementById("modalBox");
let lastFocused = null;
function openModal(html) {
    lastFocused = document.activeElement;
    modalBox.innerHTML = html;
    overlay.classList.add("show");
    // 첫 포커스 가능한 요소(없으면 모달 박스)로 이동
    const first = modalBox.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (first || modalBox).focus();
}
function closeModal() {
    overlay.classList.remove("show");
    lastFocused === null || lastFocused === void 0 ? void 0 : lastFocused.focus(); // 열기 전 위치로 포커스 복원
    lastFocused = null;
}
overlay.addEventListener("click", (e) => {
    if (e.target === overlay)
        closeModal();
});
// ESC 닫기 + Tab 포커스 트랩 (모달이 열려 있을 때만)
document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("show"))
        return;
    if (e.key === "Escape") {
        closeModal();
        return;
    }
    if (e.key !== "Tab")
        return;
    const items = Array.from(modalBox.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
    if (!items.length)
        return;
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === firstEl || active === modalBox)) {
        e.preventDefault();
        lastEl.focus();
    }
    else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
    }
});
// 제출 버튼 로딩 상태: 검증 통과 후 커밋만 지연 실행(비동기 저장 시뮬레이션).
// 버튼 없으면 즉시 실행, 이중 제출 차단, 모달이 닫히면 버튼 복원 생략.
function busy(btn, done, ms = 650) {
    if (!btn) {
        done();
        return;
    }
    if (btn.dataset.busy === "1")
        return; // 이중 제출 방지
    btn.dataset.busy = "1";
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = `<span class="btn-spin" aria-hidden="true"></span>처리 중…`;
    window.setTimeout(() => {
        done();
        if (document.body.contains(btn)) {
            // 모달이 안 닫힌 경우(예: 같은 화면 유지) 버튼 원복
            btn.disabled = false;
            btn.classList.remove("loading");
            btn.innerHTML = orig;
            delete btn.dataset.busy;
        }
    }, ms);
}
function toast(msg, type = "info") {
    const wrap = document.getElementById("toastWrap");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = msg;
    wrap.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 300);
    }, 2800);
}
/* ============ 열람 요청 모달 (요청자) ============ */
function openRequestModal(pjtId, file, perm) {
    const locked = perm === "private";
    openModal(`
    <div class="modal-head">
      <h3>${locked ? "🔒" : "📨"} 파일 열람 요청</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <p class="modal-desc">
      <b>${file}</b> 은(는) ${locked ? "비공개" : "요청 승인이 필요한"} 파일입니다.<br/>
      프로젝트 소유자에게 열람 권한을 요청하시겠습니까?
    </p>
    <label class="field-label">요청 사유</label>
    <textarea class="modal-textarea" id="reqReason" placeholder="예) 채용 평가를 위한 코드 검토"></textarea>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="sendRequestStub('${file}')">요청 보내기</button>
    </div>
  `);
}
function sendRequestStub(file) {
    closeModal();
    toast(`📨 <b>${file}</b> 열람 요청을 보냈습니다. 승인 시 알림을 드립니다.`, "info");
}
/* ============ 권한 수정 모달 (소유자/학생) ============ */
function openPermEditModal(pjtId) {
    const pjt = DATA.projects.find((p) => p.id === pjtId);
    if (!pjt)
        return;
    openModal(`
    <div class="modal-head">
      <h3>⚙️ 파일 열람권한 설정</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <p class="modal-desc">${pjt.title}<br/>
      <span class="muted sm">기본값은 README만 공개됩니다. 파일별로 권한을 조정하세요.</span></p>
    <div class="perm-edit-list">
      ${pjt.files
        .map((f, i) => `
        <div class="perm-edit-row">
          <span>📄 ${f.name}</span>
          <select class="perm-select" data-idx="${i}">
            <option value="public"  ${f.perm === "public" ? "selected" : ""}>🌐 공개</option>
            <option value="request" ${f.perm === "request" ? "selected" : ""}>📨 요청필요</option>
            <option value="private" ${f.perm === "private" ? "selected" : ""}>🔒 비공개</option>
          </select>
        </div>`)
        .join("")}
    </div>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="savePerm('${pjtId}')">저장</button>
    </div>
  `);
}
function savePerm(pjtId) {
    const pjt = DATA.projects.find((p) => p.id === pjtId);
    if (!pjt)
        return;
    document.querySelectorAll(".perm-select").forEach((sel) => {
        pjt.files[+sel.dataset.idx].perm = sel.value;
    });
    closeModal();
    render("projects"); // 다시 그려서 반영
    toast("✅ 열람권한이 저장되었습니다.", "success");
}
/* ============ 받은 요청 처리 모달 (소유자) ============ */
function openIncomingModal() {
    const pend = DATA.permRequests.filter((r) => r.status === "pending");
    openModal(`
    <div class="modal-head">
      <h3>🔔 받은 열람 요청 (${pend.length})</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <div class="req-list">
      ${pend.length
        ? pend
            .map((r) => `
        <div class="req-item" id="ri-${r.id}">
          <div class="req-top">
            <span class="req-file">📄 ${r.file}</span>
            <span class="req-time">${r.time}</span>
          </div>
          <div class="req-who">👤 ${r.requester}</div>
          <div class="req-reason">"${r.reason}"</div>
          <div class="req-btns">
            <button class="btn outline sm" onclick="handleReq('${r.id}','reject')">반려</button>
            <button class="btn primary sm" onclick="handleReq('${r.id}','approve')">승인</button>
          </div>
        </div>`)
            .join("")
        : `<p class="muted" style="text-align:center;padding:20px">대기 중인 요청이 없습니다.</p>`}
    </div>
  `);
}
function handleReq(reqId, action) {
    const req = DATA.permRequests.find((r) => r.id === reqId);
    if (!req)
        return;
    req.status = action === "approve" ? "approved" : "rejected";
    // 승인 시 해당 파일 권한을 public 으로 전환 (요청자 열람 가능)
    if (action === "approve") {
        const pjt = DATA.projects.find((p) => p.id === req.project);
        const f = pjt === null || pjt === void 0 ? void 0 : pjt.files.find((f) => f.name === req.file);
        if (f)
            f.perm = "public";
    }
    // 처리된 카드 즉시 제거
    const card = document.getElementById("ri-" + reqId);
    if (card) {
        card.style.opacity = "0";
        setTimeout(() => card.remove(), 250);
    }
    toast(action === "approve"
        ? `✅ <b>${req.file}</b> 열람을 승인했습니다.`
        : `🚫 <b>${req.file}</b> 요청을 반려했습니다.`, action === "approve" ? "success" : "warn");
}
/* ============ 공용 유틸 ============ */
function escapeHtml(s) {
    return s.replace(/[&<>]/g, (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;");
}
/* ============ F-PM 워크스페이스: 칸반 드래그앤드롭 ============ */
let dragTaskId = null;
function rerenderKanban() {
    const board = document.getElementById("kanban");
    if (!board)
        return;
    const pjt = currentWorkspace;
    board.innerHTML =
        kanbanColumn("todo", KANBAN_LABELS.todo, pjt) +
            kanbanColumn("doing", KANBAN_LABELS.doing, pjt) +
            kanbanColumn("done", KANBAN_LABELS.done, pjt);
    bindKanbanDnD();
    document.querySelectorAll(".kb-add").forEach((b) => {
        b.addEventListener("click", () => openAddTaskModal(b.dataset.pjt));
    });
}
function bindKanbanDnD() {
    document.querySelectorAll(".kb-card").forEach((card) => {
        card.addEventListener("dragstart", () => {
            dragTaskId = card.dataset.id;
            card.classList.add("dragging");
        });
        card.addEventListener("dragend", () => card.classList.remove("dragging"));
    });
    document.querySelectorAll(".kb-drop").forEach((zone) => {
        zone.addEventListener("dragover", (e) => {
            e.preventDefault();
            zone.classList.add("over");
        });
        zone.addEventListener("dragleave", () => zone.classList.remove("over"));
        zone.addEventListener("drop", (e) => {
            e.preventDefault();
            zone.classList.remove("over");
            if (!dragTaskId)
                return;
            const t = DATA.kanban.find((x) => x.id === dragTaskId);
            if (t)
                t.col = zone.dataset.col;
            dragTaskId = null;
            rerenderKanban();
        });
    });
}
let kanbanSeq = 100;
function openAddTaskModal(pjt) {
    var _a, _b;
    const members = ((_a = DATA.projects.find((p) => p.id === pjt)) === null || _a === void 0 ? void 0 : _a.members) || [];
    openModal(`
    <div class="modal-head"><h3>➕ 새 Task</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <label class="field-label">업무명</label>
    <input class="input" id="taskTitle" placeholder="예) 데이터 전처리 스크립트 작성"/>
    <label class="field-label" style="margin-top:10px">담당자</label>
    <select class="input" id="taskAssignee">${members
        .map((m) => `<option>${m}</option>`)
        .join("")}</select>
    <label class="field-label" style="margin-top:10px">마감 기한</label>
    <input class="input" id="taskDue" type="date"/>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" id="taskSave">추가</button>
    </div>
  `);
    (_b = document.getElementById("taskSave")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
        const title = document.getElementById("taskTitle").value.trim();
        if (!title) {
            toast("⚠️ 업무명을 입력하세요.", "warn");
            return;
        }
        const assignee = document.getElementById("taskAssignee").value;
        const dueRaw = document.getElementById("taskDue")
            .value;
        kanbanSeq++;
        DATA.kanban.push({
            id: "K-" + kanbanSeq,
            project: pjt,
            title,
            assignee,
            due: dueRaw ? dueRaw.slice(5) : "미정",
            col: "todo",
        });
        closeModal();
        render("workspace");
        toast("✅ Task가 추가되었습니다.", "success");
    });
}
function completeProject(pjt) {
    const p = DATA.projects.find((x) => x.id === pjt);
    if (!p)
        return;
    p.status = "완료";
    p.progress = 100;
    DATA.adminLogs.unshift({
        time: nowHM(),
        type: "프로젝트",
        msg: `${p.title} 프로젝트 완료 처리`,
    });
    render("workspace");
    toast(`🏁 <b>${p.title}</b> 완료! 역량 평가(디지털 배지) 단계로 연계됩니다.`, "success");
}
let deliverSeq = 100;
function uploadDeliverable(pjt) {
    deliverSeq++;
    DATA.deliverables.push({
        id: "D-" + deliverSeq,
        project: pjt,
        name: `산출물_${deliverSeq}.zip`,
        size: "12MB",
        by: DATA.user.name,
        time: "방금",
    });
    const list = document.getElementById("deliverList");
    if (list)
        list.innerHTML = deliverableRows(pjt);
    toast("📦 산출물이 업로드되었습니다. (스토리지 연동)", "success");
}
/* ============ F-ID 클라우드 IDE / 형상관리 ============ */
let envSeq = 10;
function openNewEnvModal() {
    var _a;
    openModal(`
    <div class="modal-head"><h3>💻 새 실습환경 생성</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc muted sm">Docker/Kubernetes 기반 컨테이너형 클라우드 환경을 생성합니다.</p>
    <label class="field-label">환경 이름</label>
    <input class="input" id="envName" placeholder="예) 캡스톤-실험"/>
    <label class="field-label" style="margin-top:10px">개발 스택</label>
    <select class="input" id="envStack">
      <option>Python</option><option>Node.js</option><option>Java</option><option>R</option>
    </select>
    <label class="field-label" style="margin-top:10px">버전</label>
    <input class="input" id="envVer" placeholder="예) 3.11"/>
    <label class="field-label" style="margin-top:10px">연동 환경</label>
    <select class="input" id="envProv">
      <option value="jupyter">📓 Jupyter Lab</option>
      <option value="gitlab">🦊 GitLab 웹IDE</option>
      <option value="kaggle">📊 Kaggle 노트북</option>
    </select>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" id="envCreate">생성</button>
    </div>
  `);
    (_a = document.getElementById("envCreate")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        const name = document.getElementById("envName").value.trim() ||
            "새 실습환경";
        const stack = document.getElementById("envStack")
            .value;
        const version = document.getElementById("envVer").value.trim() ||
            "latest";
        const provider = document.getElementById("envProv")
            .value;
        envSeq++;
        DATA.ideEnvs.unshift({
            id: "ENV-" + envSeq,
            name,
            stack,
            version,
            provider,
            status: "running",
            cpu: 5,
            ram: 12,
        });
        closeModal();
        render("ide");
        toast(`💻 <b>${name}</b> 환경을 생성했습니다.`, "success");
    });
}
function runEnv(id) {
    const e = DATA.ideEnvs.find((x) => x.id === id);
    if (!e)
        return;
    if (e.status === "stopped") {
        e.status = "running";
        e.cpu = 5;
        e.ram = 12;
        render("ide");
        toast(`▶ <b>${e.name}</b> 환경을 시작했습니다.`, "success");
        return;
    }
    toast(`↗ <b>${e.name}</b> · ${providerMeta(e.provider).label}를 새 탭으로 엽니다.`, "info");
}
function toggleEnv(id) {
    const e = DATA.ideEnvs.find((x) => x.id === id);
    if (!e)
        return;
    if (e.status === "running") {
        e.status = "stopped";
        e.cpu = 0;
        e.ram = 0;
    }
    else {
        e.status = "running";
        e.cpu = 5;
        e.ram = 12;
    }
    render("ide");
}
function openDiffModal(id) {
    const c = DATA.commits.find((x) => x.id === id);
    if (!c)
        return;
    openModal(`
    <div class="modal-head"><h3>🔍 ${c.msg}</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc muted sm">${c.author} · ${c.time} · <code>${c.id}</code></p>
    ${c.diff
        .map((d) => `
      <div class="diff-file">📄 ${d.file}</div>
      <div class="diff-block">${d.lines
        .map((l) => `<div class="diff-line ${l.type}">${l.type === "add" ? "+" : l.type === "del" ? "−" : " "} ${escapeHtml(l.text)}</div>`)
        .join("")}</div>`)
        .join("")}
    <div class="modal-actions"><button class="btn primary" onclick="closeModal()">닫기</button></div>
  `);
}
/* ============ F-CR 배지 상세 / 역량 평가 ============ */
function openBadgeDetail(name) {
    var _a, _b, _c, _d;
    const b = DATA.badges.find((x) => x.name === name);
    if (!b)
        return;
    openModal(`
    <div class="modal-head"><h3>${b.icon} ${b.name}</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="badge-detail">
      <div class="bd-score">${(_a = b.score) !== null && _a !== void 0 ? _a : "-"}<span>점</span></div>
      <div class="bd-info">
        <p><b>구분</b> ${b.type}</p>
        <p><b>발급</b> ${(_b = b.issuer) !== null && _b !== void 0 ? _b : "-"} · ${b.date}</p>
        <p><b>기준</b> ${(_c = b.criteria) !== null && _c !== void 0 ? _c : "-"}</p>
      </div>
    </div>
    <p class="modal-desc">${(_d = b.desc) !== null && _d !== void 0 ? _d : ""}</p>
    <div class="modal-actions"><button class="btn primary" onclick="closeModal()">닫기</button></div>
  `);
}
function openEvalModal(id) {
    var _a;
    const e = DATA.evaluations.find((x) => x.id === id);
    if (!e)
        return;
    openModal(`
    <div class="modal-head"><h3>📝 역량 평가 — ${e.student}</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc muted sm">${pjtTitle(e.project)} · 평가자 ${e.evaluator}</p>
    <label class="field-label">정량 평가 <b id="evalQuantVal">80</b>점</label>
    <input type="range" id="evalQuant" min="0" max="100" value="80" class="eval-range"/>
    <label class="field-label" style="margin-top:10px">발급 배지명</label>
    <input class="input" id="evalBadge" placeholder="예) 산학PJT 우수상"/>
    <label class="field-label" style="margin-top:10px">정성 평가</label>
    <textarea class="modal-textarea" id="evalQual" placeholder="강점·기여도 등 서술"></textarea>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" id="evalSubmit">평가 제출 · 배지 발급</button>
    </div>
  `);
    const range = document.getElementById("evalQuant");
    const val = document.getElementById("evalQuantVal");
    range.addEventListener("input", () => (val.textContent = range.value));
    (_a = document.getElementById("evalSubmit")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        const quant = +range.value;
        const badge = document.getElementById("evalBadge").value.trim() ||
            "실무역량 인증";
        const qual = document.getElementById("evalQual").value.trim();
        if (!qual) {
            toast("⚠️ 정성 평가를 입력하세요.", "warn");
            return;
        }
        e.quant = quant;
        e.qual = qual;
        e.badge = badge;
        e.done = true;
        DATA.badges.push({
            name: badge,
            icon: "🎖️",
            date: "2026-06",
            type: "비교과",
            issuer: e.evaluator,
            criteria: "산학프로젝트 역량 평가",
            score: quant,
            desc: `${pjtTitle(e.project)} 평가 결과`,
        });
        closeModal();
        addNotif("🏅", `디지털 배지 '${e.badge}' 가 <b>${e.student}</b>에게 발급되었습니다.`);
        render("portfolio");
        toast(`✅ 평가 제출 완료 — <b>${e.student}</b>에게 디지털 배지를 발급했습니다. (Push)`, "success");
    });
}
function searchIndex() {
    return [
        ...DATA.projects.map((p) => ({
            label: p.title,
            sub: `산학과제 · ${p.company}`,
            page: "projects",
            icon: "🏭",
        })),
        ...DATA.ip.map((x) => ({
            label: x.title,
            sub: `지식재산권 · ${x.type}`,
            page: "ip",
            icon: "📑",
        })),
        ...DATA.talents.map((t) => ({
            label: t.name,
            sub: `인재 · ${t.major}`,
            page: "talent",
            icon: "🎯",
        })),
        ...DATA.teams.map((t) => ({
            label: t.name,
            sub: `팀 · ${t.project}`,
            page: "team",
            icon: "👥",
        })),
        ...DATA.badges.map((b) => ({
            label: b.name,
            sub: `배지 · ${b.type}`,
            page: "portfolio",
            icon: "🏅",
        })),
    ];
}
function renderNotifs() {
    const list = document.getElementById("notifList");
    const dot = document.getElementById("notifDot");
    const unread = DATA.notifs.filter((n) => !n.read).length;
    if (dot) {
        dot.textContent = unread ? String(unread) : "";
        dot.style.display = unread ? "grid" : "none";
    }
    if (list)
        list.innerHTML = DATA.notifs.length
            ? DATA.notifs
                .map((n) => `
      <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}">
        <span class="notif-ic">${n.icon}</span>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>`)
                .join("")
            : `<p class="muted" style="text-align:center;padding:24px">알림이 없습니다.</p>`;
    list === null || list === void 0 ? void 0 : list.querySelectorAll(".notif-item").forEach((it) => {
        it.addEventListener("click", () => {
            var _a, _b;
            const n = DATA.notifs.find((x) => x.id === it.dataset.id);
            if (!n)
                return;
            n.read = true;
            renderNotifs();
            // 알림 종류별 페이지로 이동 + 알림함 닫기
            (_a = document.getElementById("notifPanel")) === null || _a === void 0 ? void 0 : _a.classList.remove("open");
            (_b = document.getElementById("notifScrim")) === null || _b === void 0 ? void 0 : _b.classList.remove("show");
            goPage(notifPage(n.icon));
        });
    });
}
// 알림 아이콘 → 이동할 페이지
function notifPage(icon) {
    const map = {
        "🤝": "matching",
        "🎓": "matching",
        "🏅": "portfolio",
        "📨": "projects",
        "🏭": "projects",
        "👥": "team",
        "🙋": "team",
        "📑": "ip",
        "📅": "infra",
        "✅": "infra",
    };
    return map[icon] || "dashboard";
}
function initTopbar() {
    var _a, _b, _c;
    /* ----- 알림함 ----- */
    renderNotifs();
    const panel = document.getElementById("notifPanel");
    const scrim = document.getElementById("notifScrim");
    const openNotif = () => {
        panel === null || panel === void 0 ? void 0 : panel.classList.add("open");
        scrim === null || scrim === void 0 ? void 0 : scrim.classList.add("show");
    };
    const closeNotif = () => {
        panel === null || panel === void 0 ? void 0 : panel.classList.remove("open");
        scrim === null || scrim === void 0 ? void 0 : scrim.classList.remove("show");
    };
    (_a = document.getElementById("notifBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", openNotif);
    scrim === null || scrim === void 0 ? void 0 : scrim.addEventListener("click", closeNotif);
    (_b = document.getElementById("notifClose")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", closeNotif);
    (_c = document.getElementById("notifReadAll")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => {
        DATA.notifs.forEach((n) => (n.read = true));
        renderNotifs();
    });
    /* ----- 통합검색 (자동완성) ----- */
    const wrap = document.getElementById("gsearch");
    const input = document.getElementById("globalSearch");
    const drop = document.getElementById("globalSearchDrop");
    const xBtn = document.getElementById("globalSearchX");
    if (!wrap || !input || !drop || !xBtn)
        return;
    const go = (page) => {
        goPage(page);
        wrap.classList.remove("focus");
        input.blur();
    };
    const bindDropItems = () => {
        drop.querySelectorAll(".gs-item").forEach((it) => {
            it.addEventListener("mousedown", () => {
                input.value = it.dataset.q;
                renderDrop();
            });
        });
        drop.querySelectorAll(".gs-hit").forEach((it) => {
            it.addEventListener("mousedown", () => go(it.dataset.page));
        });
    };
    const renderDrop = () => {
        const q = input.value.trim().toLowerCase();
        xBtn.style.display = q ? "grid" : "none";
        if (!q) {
            const reco = ["스마트팩토리 AI", "관광 챗봇", "탄소배출 대시보드"];
            drop.innerHTML =
                `<div class="gs-sec">🕘 최근 검색어</div>` +
                    recentSearches
                        .map((t) => `<div class="gs-item" data-q="${t}"><span>🕘</span>${t}</div>`)
                        .join("") +
                    `<div class="gs-sec">🔥 추천 검색어</div>` +
                    reco
                        .map((t) => `<div class="gs-item" data-q="${t}"><span>🔥</span>${t}</div>`)
                        .join("");
        }
        else {
            const hits = searchIndex().filter((h) => h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q));
            drop.innerHTML = hits.length
                ? hits
                    .map((h) => `
        <div class="gs-hit" data-page="${h.page}">
          <span class="gs-ic">${h.icon}</span>
          <div><div class="gs-l">${h.label}</div><div class="gs-s">${h.sub}</div></div>
        </div>`)
                    .join("")
                : `<div class="gs-empty">검색 결과가 없습니다.</div>`;
        }
        bindDropItems();
    };
    input.addEventListener("focus", () => {
        wrap.classList.add("focus");
        renderDrop();
    });
    input.addEventListener("input", renderDrop);
    input.addEventListener("blur", () => {
        setTimeout(() => wrap.classList.remove("focus"), 150);
    });
    input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter")
            return;
        const q = input.value.trim();
        if (!q)
            return;
        const hit = searchIndex().find((h) => h.label.toLowerCase().includes(q.toLowerCase()));
        if (recentSearches[0] !== q)
            recentSearches.unshift(q);
        if (recentSearches.length > 5)
            recentSearches.pop();
        if (hit)
            go(hit.page);
        else {
            toast(`"${q}" 에 대한 검색 결과가 없습니다.`, "warn");
            wrap.classList.remove("focus");
            input.blur();
        }
    });
    xBtn.addEventListener("click", () => {
        input.value = "";
        input.focus();
        renderDrop();
    });
}
