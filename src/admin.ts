/* ============================================================
   STUDINNO — F-AD 관리자 도구 헬퍼 (main.ts에서 분리 · 전역 스크립트, import/export 없음)
   data.js 이후, main.js 이전 로드.
   ============================================================ */

/* ===== F-AD 관리자: 운영 차트 / 회원검색 / 프로젝트관리 / 배지 / 설정 ===== */
function adminLogRows(): string {
  return DATA.adminLogs
    .map(
      (l) => `
      <div class="log-row">
        <span class="log-type ${l.type === "오류" ? "err" : ""}">${l.type}</span>
        <span class="log-msg">${l.msg}</span>
        <span class="log-time">${l.time}</span>
      </div>`
    )
    .join("");
}
function adminChartCard(): string {
  const data = [
    { m: "1월", v: 12 },
    { m: "2월", v: 18 },
    { m: "3월", v: 9 },
    { m: "4월", v: 24 },
    { m: "5월", v: 21 },
    { m: "6월", v: 30 },
  ];
  const max = Math.max(...data.map((d) => d.v));
  return `
  <div class="card">
    <h3 class="card-title">📊 운영 대시보드 <span class="muted sm">(월별 신규 가입자)</span></h3>
    <div class="vbars">
      ${data
        .map(
          (d) =>
            `<div class="vbar"><div class="vbar-track"><div class="vbar-fill" style="height:${Math.round(
              (d.v / max) * 100
            )}%"><span class="vbar-val">${d.v}</span></div></div><span class="vbar-lb">${d.m}</span></div>`
        )
        .join("")}
    </div>
    <div class="kpi-row">
      <div class="kpi"><b>${DATA.projects.length}</b><span>진행 프로젝트</span></div>
      <div class="kpi"><b>${DATA.badges.length}</b><span>발급 배지</span></div>
      <div class="kpi"><b>${DATA.ip.length}</b><span>등록 IP</span></div>
      <div class="kpi"><b>${DATA.members.length}</b><span>총 회원</span></div>
    </div>
  </div>`;
}
function adminMonitorCard(): string {
  const running = DATA.ideEnvs.filter((e) => e.status === "running");
  return `
  <div class="card">
    <h3 class="card-title">🖥️ 컨테이너 모니터링 <span class="muted sm">(CPU/RAM 추이 · 80% 초과 적색)</span></h3>
    <div class="monitor-wrap"><canvas id="adminMonitor" width="640" height="180"></canvas></div>
    <div class="monitor-legend">
      <span><i class="ml-dot ml-cpu"></i>CPU</span><span><i class="ml-dot ml-ram"></i>RAM</span>
      ${running
        .map(
          (e) =>
            `<span class="muted sm">${e.name}: CPU ${e.cpu}% · RAM ${e.ram}%</span>`
        )
        .join("")}
    </div>
  </div>`;
}
function filteredMembers(): Member[] {
  const q = memberQuery.trim().toLowerCase();
  return DATA.members.filter((m) => {
    if (memberRole !== "all" && m.role !== memberRole) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });
}
function memberRows(): string {
  const list = filteredMembers();
  if (!list.length) return emptyState("조건에 맞는 회원이 없습니다.", "👤");
  return `<table class="tbl"><thead><tr><th>ID</th><th>이름</th><th>구분</th><th>성적</th><th>상태</th></tr></thead><tbody>
    ${list
      .map(
        (m) =>
          `<tr><td>${m.id}</td><td>${m.name}</td><td>${m.role}</td><td><input class="grade-input" value="${m.grade}"/></td><td><span class="badge ${
            m.status === "활성" ? "done" : "open"
          }">${m.status}</span></td></tr>`
      )
      .join("")}
  </tbody></table>`;
}
function adminMembersCard(): string {
  const roles = ["all", "학생", "교원", "기업"];
  return `
  <div class="card">
    <h3 class="card-title">회원 관리 <span class="muted sm">(검색 · 성적 수동 수정)</span></h3>
    <input class="input adm-search" id="memberSearch" placeholder="🔍 이름·ID·구분 검색" value="${memberQuery}"/>
    <div class="cat-tabs" id="memberRoleTabs">${roles
      .map(
        (r) =>
          `<button class="cat-tab ${memberRole === r ? "active" : ""}" data-mr="${r}">${
            r === "all" ? "전체" : r
          }</button>`
      )
      .join("")}</div>
    <div id="memberTableWrap">${memberRows()}</div>
  </div>`;
}
function refreshMemberTable(): void {
  const wrap = document.getElementById("memberTableWrap");
  if (wrap) wrap.innerHTML = memberRows();
}
function adminProjectAdminCard(): string {
  return `
  <div class="card">
    <h3 class="card-title">프로젝트 관리 <span class="muted sm">(공개범위 강제 · 부적절 숨김)</span></h3>
    <div class="adm-proj-list">
      ${DATA.projects
        .map((p) => {
          const hidden = hiddenProjects.has(p.id);
          return `<div class="adm-proj-row ${hidden ? "is-hidden" : ""}">
          <div class="apr-main"><b>${p.title}</b><span class="muted sm">${p.company}</span></div>
          <button class="btn outline sm" onclick="forceVisibility('${p.id}')">${
            p.visibility === "public" ? "🌐 공개" : "🔒 비공개"
          }</button>
          <button class="btn outline sm" onclick="toggleHideProject('${p.id}')">${
            hidden ? "🙈 숨김됨" : "👁 표시"
          }</button>
        </div>`;
        })
        .join("")}
    </div>
  </div>`;
}
function forceVisibility(id: string): void {
  const p = DATA.projects.find((x) => x.id === id);
  if (!p) return;
  p.visibility = p.visibility === "public" ? "private" : "public";
  DATA.adminLogs.unshift({
    time: nowHM(),
    type: "권한",
    msg: `${p.title} 공개범위 강제변경 → ${p.visibility === "public" ? "Public" : "Private"}`,
  });
  toast(
    `🔧 <b>${p.title}</b> 공개범위를 ${p.visibility === "public" ? "공개" : "비공개"}로 변경했습니다.`,
    "info"
  );
  if (currentPage === "admin") render("admin");
}
function toggleHideProject(id: string): void {
  const p = DATA.projects.find((x) => x.id === id);
  if (hiddenProjects.has(id)) hiddenProjects.delete(id);
  else {
    hiddenProjects.add(id);
    DATA.adminLogs.unshift({
      time: nowHM(),
      type: "숨김",
      msg: `${p?.title || ""} 부적절 프로젝트 숨김(목록 비노출)`,
    });
  }
  toast(
    hiddenProjects.has(id)
      ? `🙈 <b>${p?.title || ""}</b> 숨김 처리 — 산학프로젝트 목록에서 비노출`
      : `👁 <b>${p?.title || ""}</b> 다시 표시`,
    "info"
  );
  if (currentPage === "admin") render("admin");
}
function adminBadgeCard(): string {
  return `
  <div class="card">
    <h3 class="card-title">배지 템플릿 <span class="muted sm">(등록 · 수동 회수)</span></h3>
    <div class="badge-tpl-form">
      <input class="input" id="badgeTplName" placeholder="배지명 (예: 데이터분석 마스터)"/>
      <select class="input" id="badgeTplType"><option>전공</option><option>융합</option><option>산학</option></select>
      <button class="btn primary" onclick="addBadgeTemplate(this)">+ 등록</button>
    </div>
    <div class="badge-admin-list">
      ${DATA.badges
        .map(
          (b) =>
            `<div class="badge-admin-row"><span class="bar-ic">${b.icon}</span><div class="bar-main"><b>${b.name}</b><span class="muted sm">${b.type} · ${b.date}</span></div><button class="btn outline sm" onclick="revokeBadge('${b.name.replace(
              /'/g,
              ""
            )}')">회수</button></div>`
        )
        .join("")}
    </div>
  </div>`;
}
function addBadgeTemplate(btn?: HTMLButtonElement): void {
  const name = fv("badgeTplName");
  if (!name) {
    toast("⚠️ 배지명을 입력하세요.", "warn");
    return;
  }
  const type = fv("badgeTplType") || "전공";
  busy(btn, () => {
    DATA.badges.unshift({ icon: "🏅", name, type, date: "2026-06-23" });
    DATA.adminLogs.unshift({
      time: nowHM(),
      type: "배지",
      msg: `배지 템플릿 등록 → ${name} (${type})`,
    });
    addNotif("🏅", `새 배지 발급: <b>${name}</b>`);
    toast(`✅ 배지 <b>${name}</b> 템플릿을 등록했습니다.`, "success");
    if (currentPage === "admin") render("admin");
  });
}
function revokeBadge(name: string): void {
  DATA.badges = DATA.badges.filter((b) => b.name !== name);
  DATA.adminLogs.unshift({ time: nowHM(), type: "배지", msg: `배지 수동 회수 → ${name}` });
  toast(`🗑 배지 <b>${name}</b> 을(를) 회수했습니다.`, "warn");
  if (currentPage === "admin") render("admin");
}
function adminSettingsCard(): string {
  const tog = (k: string, label: string): string =>
    `<label class="set-row"><span>${label}</span><span class="switch"><input type="checkbox" ${
      adminSettings[k] ? "checked" : ""
    } onchange="toggleSetting('${k}')"/><span class="switch-track"></span></span></label>`;
  return `
  <div class="card">
    <h3 class="card-title">시스템 설정 <span class="muted sm">(보안 · ERP)</span></h3>
    ${tog("tls", "🔒 TLS/HTTPS 강제")}
    ${tog("encrypt", "🛡️ 저장 데이터 암호화(AES-256)")}
    ${tog("twofa", "🔑 관리자 2단계 인증")}
    <button class="btn outline full" onclick="erpSync()" style="margin-top:14px">🔄 ERP 수동 동기화 (학사·인사)</button>
  </div>`;
}
function toggleSetting(k: string): void {
  adminSettings[k] = !adminSettings[k];
  DATA.adminLogs.unshift({
    time: nowHM(),
    type: "보안",
    msg: `시스템 설정 변경 → ${k} = ${adminSettings[k] ? "ON" : "OFF"}`,
  });
  toast(`⚙️ 설정을 ${adminSettings[k] ? "활성화" : "비활성화"}했습니다.`, "info");
}
function erpSync(): void {
  DATA.adminLogs.unshift({
    time: nowHM(),
    type: "동기화",
    msg: "ERP 수동 동기화 실행 (학사·인사 데이터)",
  });
  toast("🔄 ERP 동기화를 시작했습니다. (학사·인사 데이터)", "success");
  const ll = document.getElementById("adminLogList");
  if (ll) ll.innerHTML = adminLogRows();
}
