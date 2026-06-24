/* ============================================================
   STUDINNO — F-IP 지식재산권 헬퍼 (main.ts에서 분리 · 전역 스크립트, import/export 없음)
   data.js 이후, main.js 이전 로드.
   ============================================================ */

/* ===== F-IP 지식재산권: 시맨틱 검색 · 종류 필터 · 북마크 · 상세 · 유사성과물 ===== */
function ipFilterTabs(): string {
  const types = Array.from(new Set(DATA.ip.map((x) => x.type)));
  const tabs = ["all", ...types];
  return tabs
    .map(
      (k) =>
        `<button class="cat-tab ${ipFilter === k ? "active" : ""}" data-ipf="${k}">${
          k === "all" ? "전체" : k
        }</button>`
    )
    .join("");
}
function filteredIp(): IpItem[] {
  const q = ipQuery.replace(/#/g, "").trim().toLowerCase();
  return DATA.ip.filter((x) => {
    if (ipFilter !== "all" && x.type !== ipFilter) return false;
    if (!q) return true;
    return (
      x.title.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q) ||
      x.tags.join(" ").toLowerCase().includes(q) ||
      x.owners.map((o) => o.name).join(" ").toLowerCase().includes(q)
    );
  });
}
function ipCard(x: IpItem): string {
  const bm = ipBookmarks.has(x.id);
  return `
        <div class="card ip-card" data-ip="${x.id}">
          <div class="pjt-head">
            <span class="badge ${x.type === "특허" ? "open" : "info"}">${x.type}</span>
            <span class="muted sm">${x.status}</span>
            <button class="ribbon-btn ${bm ? "on" : ""}" data-ip="${x.id}" title="북마크" aria-label="북마크">${bm ? "🔖" : "🏷️"}</button>
            ${delBtn("ip", x.id)}
          </div>
          <h3 class="card-title">${x.title}</h3>
          <div class="tags">${x.tags
            .map((t) => `<span class="tag">#${t}</span>`)
            .join("")}</div>
          ${
            x.coApply
              ? `<div class="coapply">⚖️ 사업비 활용 · 공동출원</div>`
              : ""
          }
          <div class="owners">
            ${x.owners
              .map(
                (o) => `
              <div class="owner-row">
                <span>${o.type === "기업" ? "🏢" : "🎓"} ${o.name}</span>
                <span class="share">${o.share}%</span>
              </div>`
              )
              .join("")}
          </div>
          <button class="btn outline full ip-detail-btn" data-ip="${x.id}">상세 보기 ›</button>
        </div>`;
}
function ipGrid(): string {
  const list = filteredIp();
  if (!list.length)
    return DATA.ip.length
      ? emptyState("조건에 맞는 성과물이 없습니다.", "🔍")
      : emptyState("등록된 지식재산권이 없습니다. ‘+ IP 등록’으로 추가하세요.", "📑");
  return list.map(ipCard).join("");
}
function bindIpCards(): void {
  document.querySelectorAll<HTMLElement>("#ipGrid .ip-detail-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openIpDetail(btn.dataset.ip as string);
    });
  });
  document.querySelectorAll<HTMLElement>("#ipGrid .ribbon-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleIpBookmark(btn.dataset.ip as string);
    });
  });
  // del-btn은 초기엔 전역 바인딩이 처리 → 리렌더 시 refreshIpGrid에서 재바인딩
}
function refreshIpGrid(): void {
  const grid = document.getElementById("ipGrid");
  if (grid) {
    grid.innerHTML = ipGrid();
    bindIpCards();
    grid.querySelectorAll<HTMLElement>(".del-btn").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCreated(b.dataset.del as string, b.dataset.id as string);
      });
    });
  }
  const cnt = document.querySelector("#ipBookmarkBtn .req-count");
  if (cnt) cnt.textContent = String(ipBookmarks.size);
}
function toggleIpBookmark(id: string): void {
  if (ipBookmarks.has(id)) ipBookmarks.delete(id);
  else {
    ipBookmarks.add(id);
    const x = DATA.ip.find((i) => i.id === id);
    addNotif("🔖", `성과물 <b>${x?.title || ""}</b> 북마크`);
  }
  refreshIpGrid();
}
function similarIp(x: IpItem): IpItem[] {
  return DATA.ip
    .filter((y) => y.id !== x.id && y.tags.some((t) => x.tags.includes(t)))
    .slice(0, 6);
}
function openIpDetail(id: string): void {
  const x = DATA.ip.find((i) => i.id === id);
  if (!x) return;
  const sims = similarIp(x);
  openModal(`
    <div class="modal-head"><h3>${x.type === "특허" ? "📜" : "📑"} ${x.title}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="ip-detail-meta">
      <span class="badge ${x.type === "특허" ? "open" : "info"}">${x.type}</span>
      <span class="muted sm">${x.status}</span>
      ${x.coApply ? `<span class="coapply-pill">⚖️ 공동출원</span>` : ""}
    </div>
    <p class="modal-desc">본 성과물은 산학 프로젝트 수행 과정에서 도출된 ${x.type} 결과물입니다. 핵심 기술·적용 분야는 아래 태그와 같으며, 참여 주체는 다음과 같습니다. (데모 요약)</p>
    <div class="tags">${x.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
    <h4 class="mini-title">참여자</h4>
    <div class="owners">
      ${x.owners
        .map(
          (o) => `<div class="owner-row"><span>${o.type === "기업" ? "🏢" : "🎓"} ${o.name} <span class="muted sm">(${o.type})</span></span><span class="share">${o.share}%</span></div>`
        )
        .join("")}
    </div>
    ${
      sims.length
        ? `<h4 class="mini-title">유사 성과물</h4>
    <div class="sim-track">${sims
      .map(
        (s) =>
          `<div class="sim-card" data-ip="${s.id}"><div class="sim-type">${s.type}</div><div class="sim-title">${s.title}</div><div class="tags">${s.tags
            .slice(0, 3)
            .map((t) => `<span class="tag">#${t}</span>`)
            .join("")}</div></div>`
      )
      .join("")}</div>`
        : ""
    }
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">닫기</button>
      <button class="btn primary" onclick="downloadIp('${x.id}')">⬇ 원문 다운로드</button>
    </div>`);
  // 유사 성과물 클릭 → 해당 상세로 이동
  modalBox.querySelectorAll<HTMLElement>(".sim-card").forEach((c) => {
    c.addEventListener("click", () => openIpDetail(c.dataset.ip as string));
  });
}
function downloadIp(id: string): void {
  const x = DATA.ip.find((i) => i.id === id);
  toast(`⬇ <b>${x?.title || "성과물"}</b> 원문(PDF)을 다운로드합니다. (데모)`, "success");
}
function openBookmarksModal(): void {
  const items = DATA.ip.filter((x) => ipBookmarks.has(x.id));
  openModal(`
    <div class="modal-head"><h3>🔖 북마크한 성과물 (${items.length})</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="bm-list">
      ${items
        .map(
          (x) =>
            `<div class="bm-row" data-ip="${x.id}"><span class="badge ${x.type === "특허" ? "open" : "info"}">${x.type}</span><b>${x.title}</b><span class="bm-go">상세 ›</span></div>`
        )
        .join("")}
    </div>
    <div class="modal-actions"><button class="btn primary" onclick="closeModal()">확인</button></div>`);
  modalBox.querySelectorAll<HTMLElement>(".bm-row").forEach((r) => {
    r.addEventListener("click", () => openIpDetail(r.dataset.ip as string));
  });
}
