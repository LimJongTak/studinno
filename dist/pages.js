"use strict";
/* ============================================================
   STUDINNO — 페이지 템플릿 PAGES (main.ts에서 분리 · 전역 스크립트, import/export 없음)
   data.js 이후, main.js 이전 로드.
   ============================================================ */
/* ============ 페이지 템플릿 ============ */
const PAGES = {
    // ---------- 대시보드 (역량차트 + 배지 + 요약) ----------
    dashboard: () => `
    <div class="grid-3">
      ${statCard("진행 프로젝트", "3", "🏭")}
      ${statCard("보유 배지", String(DATA.badges.length), "🏅")}
      ${statCard("등록 IP", "2", "📑")}
    </div>

    <div class="card">
      <div class="rec-head">
        <h3 class="card-title">🤝 AI 추천 산학과제 <span class="muted sm">(내 역량·직무 기반 매칭)</span></h3>
        <div class="rec-nav">
          <button class="rec-arrow" data-dir="-1" id="recPrev" aria-label="이전 추천">‹</button>
          <button class="rec-arrow" data-dir="1" id="recNext" aria-label="다음 추천">›</button>
        </div>
      </div>
      <div class="rec-filters" id="recFilters">${recFilterChips()}</div>
      <div class="rec-track" id="recTrack">${recommendCards()}</div>
    </div>

    <div class="card">
      <div class="rec-head">
        <h3 class="card-title">📊 데이터 대시보드 <span class="muted sm">(교육성과 · 산업수요)</span></h3>
        <select class="input period-sel" id="periodSel">
          <option value="1m" ${dashPeriod === "1m" ? "selected" : ""}>최근 1개월</option>
          <option value="3m" ${dashPeriod === "3m" ? "selected" : ""}>최근 3개월</option>
          <option value="1y" ${dashPeriod === "1y" ? "selected" : ""}>최근 1년</option>
        </select>
      </div>
      <div class="grid-2 dash-charts">
        <div>
          <h4 class="mini-title">교육성과</h4>
          <div class="bars" id="eduBars">${eduBars(dashPeriod)}</div>
        </div>
        <div>
          <h4 class="mini-title">산업수요 분포</h4>
          <div class="donut-wrap">
            <canvas id="demandDonut" width="170" height="170"></canvas>
            <div class="donut-legend" id="donutLegend">${donutLegend(dashPeriod)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">역량 차트</h3>
        <div class="radar-wrap"><canvas id="radar" width="220" height="220"></canvas></div>
        <div class="skill-legend">
          ${DATA.skills.map((s) => `<span><i></i>${s.label} ${s.value}</span>`).join("")}
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">디지털 배지 지갑</h3>
        <div class="badge-grid">
          ${DATA.badges
        .map((b) => `
            <div class="badge-item">
              <div class="badge-ic">${b.icon}</div>
              <div class="badge-nm">${b.name}</div>
              <div class="badge-meta">${b.type} · ${b.date}</div>
            </div>`)
        .join("")}
        </div>
      </div>
    </div>`,
    // ---------- AI 매칭 엔진 (RFP ↔ 학생 역량 양방향 매칭) ----------
    matching: () => `
    <div class="card match-hero">
      <div class="mh-text">
        <h3 class="card-title">🤝 AI 매칭 엔진</h3>
        <p class="muted sm">학생 역량(6축 레이더)과 기업 RFP 요구역량을 비교해 양방향으로 추천합니다. 일치도 · 일치 근거 · 부족 역량을 함께 제시합니다.</p>
      </div>
      <div class="seg" id="matchSeg">
        <button class="seg-btn ${matchView === "student" ? "active" : ""}" data-view="student">🎓 학생 관점</button>
        <button class="seg-btn ${matchView === "company" ? "active" : ""}" data-view="company">🏢 기업 관점</button>
      </div>
    </div>
    ${matchView === "student" ? matchStudentView() : matchCompanyView()}`,
    // ---------- 산학프로젝트 + 파일 권한 ----------
    projects: () => `
    <div class="toolbar">
      <input class="input" id="projectSearch" placeholder="🔍 프로젝트 검색 (과제명·기업·기술스택)" value="${projectQuery}"/>
      <button class="btn outline" id="incomingReqBtn">
        🔔 받은 요청 <span class="req-count">${DATA.permRequests.filter((r) => r.status === "pending").length}</span>
      </button>
      <button class="btn primary" id="rfpRegBtn">+ RFP 등록</button>
    </div>
    <div class="cat-tabs" id="projectFilterTabs">${projectFilterTabs()}</div>
    <div class="grid-2" id="projectGrid">${projectGrid()}</div>`,
    // ---------- 워크스페이스 (칸반 + 결과물 공유) ----------
    workspace: () => {
        const p = DATA.projects.find((x) => x.id === currentWorkspace) || DATA.projects[0];
        currentWorkspace = p.id;
        return `
    <div class="ws-tabs">
      ${DATA.projects
            .map((x) => `<button class="ws-tab ${x.id === p.id ? "active" : ""}" data-pjt="${x.id}">${x.title}</button>`)
            .join("")}
    </div>
    <div class="card ws-head">
      <div>
        <h3 class="card-title">🗂️ ${p.title}</h3>
        <p class="muted sm">${p.company} · 👥 ${p.members.join(", ")} · 진행률 ${p.progress}%</p>
      </div>
      <button class="btn ${p.status === "완료" ? "outline" : "primary"} ws-complete-btn" data-pjt="${p.id}" ${p.status === "완료" ? "disabled" : ""}>${p.status === "완료" ? "✅ 완료됨" : "🏁 프로젝트 완료"}</button>
    </div>
    <h3 class="section-title">📋 칸반 보드 <span class="muted sm">(드래그하여 상태 변경 · Agile)</span></h3>
    <div class="kanban" id="kanban">
      ${kanbanColumn("todo", "할 일", p.id)}
      ${kanbanColumn("doing", "진행 중", p.id)}
      ${kanbanColumn("done", "완료", p.id)}
    </div>
    <div class="card">
      <h3 class="card-title">📦 결과물 공유 <span class="muted sm">(스토리지(S3) 연동)</span></h3>
      <div class="dropzone" id="deliverDrop">⬆️ 산출물 파일을 드래그하거나 클릭하여 업로드</div>
      <div class="deliver-list" id="deliverList">${deliverableRows(p.id)}</div>
    </div>`;
    },
    // ---------- 클라우드 IDE / 형상관리 ----------
    ide: () => `
    <div class="toolbar ide-toolbar">
      <div class="provider-pills">
        <span class="pill gitlab">🦊 GitLab 연동됨</span>
        <span class="pill kaggle">📊 Kaggle 연동됨</span>
        <span class="pill jupyter">📓 Jupyter 연동됨</span>
      </div>
      <button class="btn primary" id="newEnvBtn">+ 새 실습환경</button>
    </div>
    <div class="grid-3" id="envList">${DATA.ideEnvs
        .map(envCard)
        .join("")}</div>
    <div class="card">
      <div class="repo-head">
        <h3 class="card-title">🦊 GitLab 저장소 <span class="muted sm">(${pjtTitle(currentWorkspace)})</span></h3>
        <div class="repo-branch">🌿 브랜치
          <select class="input" id="repoBranchSel">${branchOptions(currentWorkspace)}</select>
        </div>
      </div>
      <div class="cat-tabs repo-tabs" id="repoTabs">${repoTabs()}</div>
      <div id="repoPanel">${repoPanel()}</div>
    </div>`,
    // ---------- Kaggle 경진대회 · 해커톤 ----------
    compete: () => `
    <div class="card comp-hero">
      <div class="mh-text">
        <h3 class="card-title">🏆 경진대회 · 해커톤 <span class="pill kaggle">📊 Kaggle 연동</span></h3>
        <p class="muted sm">산업체·지자체가 주최하는 경진대회와 해커톤에 참가해 실전 데이터로 경쟁하고, 리더보드 순위·수상 실적을 포트폴리오로 연결하세요.</p>
      </div>
    </div>
    <div class="cat-tabs" id="compFilterTabs">${compFilterTabs()}</div>
    <div class="grid-2" id="compGrid">${compGrid()}</div>
    <div class="card">
      <h3 class="card-title">📤 내 제출 이력 <span class="muted sm">(Kaggle 연동)</span></h3>
      ${submissionRows()}
    </div>`,
    // ---------- 역량 인증 · 포트폴리오 ----------
    portfolio: () => `
    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">🏅 디지털 배지 지갑 <span class="muted sm">(Open Badges)</span></h3>
        <div class="cat-tabs" id="badgeCats">
          ${["전체", "교과", "비교과", "대외"]
        .map((c, i) => `<button class="cat-tab ${i === 0 ? "active" : ""}" data-cat="${c}">${c}</button>`)
        .join("")}
        </div>
        <div class="badge-grid" id="badgeGrid">${DATA.badges
        .map(badgeCardEl)
        .join("")}</div>
      </div>
      <div class="card">
        <h3 class="card-title">📝 역량 평가 <span class="muted sm">(교수·기업 멘토용)</span></h3>
        <div class="eval-list">${evalRows()}</div>
      </div>
    </div>
    <div class="card">
      <h3 class="card-title">🏆 대회 수상·참가 실적 <span class="muted sm">(Kaggle 경진대회·해커톤 자동 집계)</span></h3>
      ${compAchievements()}
    </div>
    <div class="card portfolio-card">
      <div class="pf-head">
        <div>
          <h3 class="card-title">📄 디지털 포트폴리오</h3>
          <p class="muted sm">교과·프로젝트·배지 활동이 자동 집계되어 생성됩니다.</p>
        </div>
        <div class="pf-actions">
          <button class="btn outline" id="pfShareBtn">🔗 공유</button>
          <button class="btn primary" id="pfExportBtn">📥 PDF 내보내기</button>
        </div>
      </div>
      <div class="pf-body">
        <div class="pf-summary">
          <div class="pf-stat"><b>${DATA.badges.length}</b><span>보유 배지</span></div>
          <div class="pf-stat"><b>${DATA.projects.filter((p) => p.members.includes(DATA.user.name))
        .length}</b><span>참여 프로젝트</span></div>
          <div class="pf-stat"><b>${DATA.ip.filter((x) => x.owners.some((o) => o.name === DATA.user.name)).length}</b><span>등록 IP</span></div>
          <div class="pf-stat"><b>${myCompStats().awards}</b><span>대회 수상</span></div>
        </div>
        <div class="pf-badges">
          ${DATA.badges
        .map((b) => `<span class="pf-badge" title="${b.name}">${b.icon}</span>`)
        .join("")}
        </div>
        <div class="grad-banner">🎓 졸업·장학 연계: <b>달성</b> — 인증 배지 4개 / 기준 3개 충족</div>
      </div>
    </div>`,
    // ---------- 진로 로드맵 · 학습 가이드 ----------
    roadmap: () => {
        const job = DATA.jobTargets.find((j) => j.id === roadmapJob);
        return `
    <div class="toolbar">
      <label class="field-label" style="margin:0 8px 0 0">🎯 목표 직무</label>
      <select class="input job-select" id="jobSelect">
        ${DATA.jobTargets
            .map((j) => `<option value="${j.id}" ${j.id === roadmapJob ? "selected" : ""}>${j.name}</option>`)
            .join("")}
      </select>
    </div>
    <div class="card">
      <h3 class="card-title">🧭 진로 로드맵 타임라인 <span class="muted sm">(입학 → 졸업)</span></h3>
      <div class="timeline">${DATA.milestones.map(timelineNode).join("")}</div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">📊 역량 진단 <span class="muted sm">(현재 vs ${job.name} 목표)</span></h3>
        <div class="radar-wrap"><canvas id="roadmapRadar" width="240" height="240"></canvas></div>
        <div class="skill-legend">
          <span><i class="cur"></i>현재 역량</span>
          <span><i class="tgt"></i>${job.name} 목표</span>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">📚 학습 가이드 <span class="muted sm">(부족 역량 보완 추천)</span></h3>
        <div class="learn-list">${weakRecs(job)}</div>
      </div>
    </div>`;
    },
    // ---------- 팀구성 ----------
    team: () => `
    <div class="toolbar">
      <button class="btn primary" id="teamNewBtn">+ 팀 만들기</button>
    </div>
    <div class="grid-2">
      ${DATA.teams.length
        ? DATA.teams
            .map((t) => `
        <div class="card">
          <div class="pjt-head">
            <h3 class="card-title">${t.name}</h3>
            <span class="badge ${t.recruiting ? "open" : "done"}">${t.recruiting ? "모집중" : "구성완료"}</span>
            ${delBtn("team", t.id)}
          </div>
          <p class="muted">📌 ${t.project}</p>
          <div class="member-row">
            ${t.members.map((m) => `<span class="chip">${m}</span>`).join("")}
          </div>
          ${t.recruiting
            ? `<div class="need">구인: ${t.need
                .map((n) => `<span class="tag">${n}</span>`)
                .join("")}</div>
            <button class="btn outline full apply-team" data-team="${t.id}" ${appliedTeams.has(t.id) ? "disabled" : ""}>${appliedTeams.has(t.id) ? "✓ 지원 완료" : "지원하기"}</button>`
            : ""}
        </div>`)
            .join("")
        : emptyState("구성된 팀이 없습니다. ‘+ 팀 만들기’로 시작하세요.", "👥")}
    </div>`,
    // ---------- 인재검색 (기업용 해시태그/등급) ----------
    talent: () => `
    <div class="card filter-card">
      <div class="filter-row">
        <input class="input" id="talentSearch" placeholder="🔍 #해시태그 또는 이름 검색"/>
        <div class="range-box">코딩능력 ≥ <b id="codeVal">80</b>
          <input type="range" id="codeRange" min="0" max="100" value="80"/></div>
        <label class="blind-toggle" title="이름·사진을 가리고 역량만으로 평가">
          <input type="checkbox" id="blindToggle" ${talentBlind ? "checked" : ""}/>
          <span class="bt-track"><span class="bt-knob"></span></span>
          🕶️ 블라인드
        </label>
      </div>
    </div>
    <div class="grid-3" id="talentList">
      ${DATA.talents.map((t, i) => talentCard(t, i)).join("")}
    </div>`,
    // ---------- 지식재산권 + 공동출원 ----------
    ip: () => `
    <div class="toolbar">
      <input class="input" id="ipSearch" placeholder="🔍 시맨틱 검색 (자연어로 성과물 검색)" value="${ipQuery}"/>
      <button class="btn outline" id="ipBookmarkBtn">🔖 북마크 <span class="req-count">${ipBookmarks.size}</span></button>
      <button class="btn primary" id="ipRegBtn">+ IP 등록</button>
    </div>
    <div class="cat-tabs" id="ipFilterTabs">${ipFilterTabs()}</div>
    <div class="grid-2" id="ipGrid">${ipGrid()}</div>`,
    // ---------- 인프라 예약 (장비/공간 카테고리 + 달력 예약 신청) ----------
    infra: () => `
    <div class="toolbar infra-toolbar">
      <div class="cat-tabs" id="infraCatTabs">
        <button class="cat-tab ${infraCat === "all" ? "active" : ""}" data-cat="all">전체</button>
        <button class="cat-tab ${infraCat === "장비" ? "active" : ""}" data-cat="장비">🖥️ 장비</button>
        <button class="cat-tab ${infraCat === "공간" ? "active" : ""}" data-cat="공간">🏛️ 공간</button>
      </div>
      <button class="btn outline" id="myResvBtn">📋 내 예약 <span class="req-count">${DATA.infraReservations.filter((r) => r.requester === DATA.user.name)
        .length}</span></button>
    </div>
    <div class="infra-list" id="infraList">${infraCards()}</div>`,
    // ---------- 관리자 (성적 수동 수정) ----------
    admin: () => `
    <div class="grid-3">
      ${statCard("총 회원", String(DATA.members.length), "👤")}
      ${statCard("예약 승인 대기", String(DATA.infraReservations.filter((r) => r.status === "pending").length), "⏳")}
      ${statCard("기업 승인 대기", String(DATA.companySignups.filter((c) => c.status === "pending").length), "🏢")}
    </div>
    ${adminChartCard()}
    ${adminCompanyCard()}
    ${adminInfraResvCard()}
    ${adminMonitorCard()}
    <div class="grid-2">
      ${adminMembersCard()}
      ${adminProjectAdminCard()}
    </div>
    <div class="grid-2">
      ${adminBadgeCard()}
      ${adminSettingsCard()}
    </div>
    <div class="card">
      <h3 class="card-title">시스템 로그</h3>
      <div id="adminLogList">${adminLogRows()}</div>
    </div>`,
};
