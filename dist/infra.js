"use strict";
/* ============================================================
   STUDINNO — 인프라 예약 + 관리자 승인 (main.ts에서 분리 · 전역 스크립트)
   data.js 이후, main.js 이전 로드.
   ============================================================ */
let infraCat = "all";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
function infraIcon(type) {
    return type === "장비" ? "🖥️" : "🏛️";
}
// 오프라인/로드 실패 대비용 SVG 플레이스홀더 (인프라명 표시)
function placeholderImg(f) {
    const [c1, c2] = f.type === "장비" ? ["#3b82f6", "#6366f1"] : ["#16bace", "#22d3ee"];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='240'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/>` +
        `</linearGradient></defs>` +
        `<rect width='480' height='240' fill='url(#g)'/>` +
        `<text x='240' y='124' font-size='24' font-weight='bold' fill='#ffffff' text-anchor='middle' font-family='sans-serif'>${f.name}</text>` +
        `<text x='240' y='156' font-size='15' fill='rgba(255,255,255,.8)' text-anchor='middle' font-family='sans-serif'>이미지 준비중</text>` +
        `</svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
}
// 이미지 로드 실패 시 플레이스홀더로 교체 (인라인 onerror에서 호출)
function infraImgError(img, id) {
    img.onerror = null;
    const f = DATA.infra.find((x) => x.id === id);
    if (f)
        img.src = placeholderImg(f);
}
function infraCards() {
    const items = DATA.infra.filter((f) => infraCat === "all" || f.type === infraCat);
    if (!items.length)
        return emptyState("해당 카테고리의 인프라가 없습니다.", "🖥️");
    return items
        .map((f) => `
    <div class="card infra-card">
      <img class="infra-thumb" src="${f.image || placeholderImg(f)}" alt="${f.name}" loading="lazy" onerror="infraImgError(this,'${f.id}')"/>
      <div class="infra-head">
        <div>
          <h3 class="card-title">${infraIcon(f.type)} ${f.name}</h3>
          <p class="muted sm">📍 ${f.location}</p>
        </div>
        <span class="badge info">${f.type}</span>
      </div>
      <button class="btn primary full infra-book-btn" data-id="${f.id}">📅 예약 신청</button>
    </div>`)
        .join("");
}
let resvState = null;
let resvPurpose = "";
let resvHeadcount = "1";
let resvSeq = 100;
function pad2(n) {
    return String(n).padStart(2, "0");
}
function ymd(y, m, d) {
    return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}
function nowHM() {
    const d = new Date();
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
// 다음 정시 ("17:00" → "18:00")
function nextHour(slot) {
    return pad2(parseInt(slot.slice(0, 2), 10) + 1) + ":00";
}
// 특정 인프라·날짜의 1시간 슬롯 상태 (start <= slot < end, 반려는 제외 → 다시 신청 가능)
function slotStatus(infraId, date, slot) {
    const r = DATA.infraReservations.find((x) => x.infraId === infraId &&
        x.date === date &&
        x.status !== "rejected" &&
        x.start <= slot &&
        slot < x.end);
    if (!r)
        return "free";
    return r.status === "approved" ? "approved" : "pending";
}
// [start, end) 구간의 모든 슬롯이 비어있는지
function rangeFree(infraId, date, start, end) {
    return DATA.infraSlots
        .filter((s) => s >= start && s < end)
        .every((s) => slotStatus(infraId, date, s) === "free");
}
// 연속 시간 선택 (시작점 클릭 → 1시간, 이후 슬롯 클릭 → 종료시각 확장)
function pickSlot(slot) {
    const st = resvState;
    if (st.start === null || slot < st.start) {
        st.start = slot;
        st.end = nextHour(slot);
        return;
    }
    const proposedEnd = nextHour(slot);
    if (!rangeFree(st.infraId, st.date, st.start, proposedEnd)) {
        toast("⚠️ 중간에 예약된 시간이 있어 연속 예약할 수 없습니다.", "warn");
        return;
    }
    st.end = proposedEnd;
}
function openInfraReservation(infraId) {
    const now = new Date();
    resvState = {
        infraId,
        year: now.getFullYear(),
        month: now.getMonth(),
        date: null,
        start: null,
        end: null,
    };
    resvPurpose = "";
    resvHeadcount = "1";
    renderResvModal();
}
function buildCalendar() {
    const st = resvState;
    const startDow = new Date(st.year, st.month, 1).getDay();
    const daysInMonth = new Date(st.year, st.month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cells = "";
    for (let i = 0; i < startDow; i++)
        cells += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = ymd(st.year, st.month, d);
        const cellDate = new Date(st.year, st.month, d);
        const past = cellDate < today;
        const cls = ["cal-day"];
        if (past)
            cls.push("disabled");
        if (cellDate.getTime() === today.getTime())
            cls.push("today");
        if (st.date === ds)
            cls.push("selected");
        cells += `<button class="${cls.join(" ")}" data-date="${ds}" ${past ? "disabled" : ""}>${d}</button>`;
    }
    return `
    <div class="cal">
      <div class="cal-head">
        <button class="cal-nav" data-nav="-1">‹</button>
        <span class="cal-title">${st.year}년 ${st.month + 1}월</span>
        <button class="cal-nav" data-nav="1">›</button>
      </div>
      <div class="cal-grid cal-dow">${WEEKDAYS.map((w) => `<div class="cal-w">${w}</div>`).join("")}</div>
      <div class="cal-grid cal-days">${cells}</div>
    </div>`;
}
function buildResvForm(f) {
    const st = resvState;
    const slots = DATA.infraSlots
        .map((s) => {
        const status = slotStatus(st.infraId, st.date, s);
        const selected = st.start !== null && st.end !== null && s >= st.start && s < st.end;
        const cls = ["slot"];
        if (status === "approved")
            cls.push("booked");
        if (status === "pending")
            cls.push("pending");
        if (selected)
            cls.push("selected");
        return `<button class="${cls.join(" ")}" data-time="${s}" ${status !== "free" ? "disabled" : ""}>${s}</button>`;
    })
        .join("");
    const rangeLabel = st.start && st.end ? `${st.start} ~ ${st.end}` : "시작 시간을 선택하세요";
    return `
    <div class="resv-form">
      <label class="field-label">⏰ 2단계 · 시간 선택 <span class="muted sm">(${st.date} · 09–18시 · 연속 선택 가능)</span></label>
      <div class="slots">${slots}</div>
      <p class="resv-range">선택 시간: <b>${rangeLabel}</b></p>
      <label class="field-label" style="margin-top:14px">📝 사용 목적</label>
      <textarea class="modal-textarea" id="resvPurpose" placeholder="예) 불량검출 모델 학습">${resvPurpose}</textarea>
      <label class="field-label" style="margin-top:10px">👥 사용 인원</label>
      <input class="resv-num" id="resvHeadcount" type="number" min="1" value="${resvHeadcount}"/>
      <div class="modal-actions">
        <button class="btn outline" onclick="closeModal()">취소</button>
        <button class="btn primary" id="resvSubmit">신청하기</button>
      </div>
    </div>`;
}
function renderResvModal() {
    if (!resvState)
        return;
    const f = DATA.infra.find((x) => x.id === resvState.infraId);
    if (!f)
        return;
    openModal(`
    <div class="modal-head">
      <h3>📅 ${infraIcon(f.type)} ${f.name} 예약</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <img class="resv-thumb" src="${f.image || placeholderImg(f)}" alt="${f.name}" onerror="infraImgError(this,'${f.id}')"/>
    <p class="modal-desc"><span class="muted sm">📍 ${f.location} · ${f.type}</span><br/>1단계 · 날짜를 선택한 뒤 시간과 사용 목적을 입력하세요.</p>
    ${buildCalendar()}
    ${resvState.date
        ? buildResvForm(f)
        : `<p class="muted sm" style="text-align:center;padding:10px">⬆️ 먼저 날짜를 선택하세요.</p>`}
  `);
    bindResvModalEvents();
}
function cacheResvForm() {
    const p = document.getElementById("resvPurpose");
    if (p)
        resvPurpose = p.value;
    const h = document.getElementById("resvHeadcount");
    if (h)
        resvHeadcount = h.value;
}
function bindResvModalEvents() {
    // 달 이동
    document.querySelectorAll(".cal-nav").forEach((b) => {
        b.addEventListener("click", () => {
            const st = resvState;
            let m = st.month + Number(b.dataset.nav);
            let y = st.year;
            if (m < 0) {
                m = 11;
                y--;
            }
            if (m > 11) {
                m = 0;
                y++;
            }
            st.month = m;
            st.year = y;
            cacheResvForm();
            renderResvModal();
        });
    });
    // 날짜 선택
    document
        .querySelectorAll(".cal-day[data-date]")
        .forEach((b) => {
        b.addEventListener("click", () => {
            if (b.disabled)
                return;
            cacheResvForm();
            resvState.date = b.dataset.date;
            resvState.start = null;
            resvState.end = null;
            renderResvModal();
        });
    });
    // 시간 선택 (연속 범위)
    document
        .querySelectorAll(".resv-form .slot[data-time]")
        .forEach((b) => {
        b.addEventListener("click", () => {
            if (b.disabled)
                return;
            cacheResvForm();
            pickSlot(b.dataset.time);
            renderResvModal();
        });
    });
    // 목적/인원 즉시 캐시
    const p = document.getElementById("resvPurpose");
    if (p)
        p.addEventListener("input", () => (resvPurpose = p.value));
    const h = document.getElementById("resvHeadcount");
    if (h)
        h.addEventListener("input", () => (resvHeadcount = h.value));
    // 신청
    const sub = document.getElementById("resvSubmit");
    if (sub)
        sub.addEventListener("click", submitReservation);
}
function submitReservation() {
    const st = resvState;
    if (!st)
        return;
    cacheResvForm();
    if (!st.date) {
        toast("⚠️ 날짜를 선택하세요.", "warn");
        return;
    }
    if (!st.start || !st.end) {
        toast("⚠️ 시간을 선택하세요.", "warn");
        return;
    }
    // 제출 직전 가용성 재확인 (동시 신청 방지)
    if (!rangeFree(st.infraId, st.date, st.start, st.end)) {
        toast("⚠️ 선택한 시간에 이미 다른 예약이 있습니다.", "warn");
        return;
    }
    const purpose = resvPurpose.trim();
    if (!purpose) {
        toast("⚠️ 사용 목적을 입력하세요.", "warn");
        return;
    }
    const f = DATA.infra.find((x) => x.id === st.infraId);
    if (!f)
        return;
    resvSeq++;
    DATA.infraReservations.push({
        id: "RV-" + resvSeq,
        infraId: f.id,
        infraName: f.name,
        type: f.type,
        date: st.date,
        start: st.start,
        end: st.end,
        purpose,
        headcount: Math.max(1, parseInt(resvHeadcount, 10) || 1),
        requester: DATA.user.name,
        status: "pending",
    });
    closeModal();
    resvState = null;
    addNotif("📅", `예약 신청: <b>${f.name}</b> ${st.date} ${st.start}~${st.end} (승인 대기)`);
    toast(`📅 <b>${f.name}</b> · ${st.date} ${st.start}~${st.end} 예약을 신청했습니다. 관리자 승인 대기 중입니다.`, "info");
}
/* ----- 내 예약 조회 ----- */
function resvStatusMeta(s) {
    if (s === "approved")
        return { cls: "approved", label: "✅ 승인됨" };
    if (s === "rejected")
        return { cls: "rejected", label: "🚫 반려됨" };
    return { cls: "pending", label: "⏳ 승인대기" };
}
function openMyReservationsModal() {
    const mine = DATA.infraReservations.filter((r) => r.requester === DATA.user.name);
    openModal(`
    <div class="modal-head">
      <h3>📋 내 인프라 예약</h3>
      <button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button>
    </div>
    <div class="req-list">
      ${mine.length
        ? mine
            .map((r) => {
            const m = resvStatusMeta(r.status);
            return `
        <div class="req-item">
          <div class="req-top">
            <span class="req-file">${infraIcon(r.type)} ${r.infraName}</span>
            <span class="badge ${m.cls}">${m.label}</span>
          </div>
          <div class="req-who">📅 ${r.date} · ⏰ ${r.start}~${r.end} · 👥 ${r.headcount}명</div>
          <div class="req-reason">"${r.purpose}"</div>
        </div>`;
        })
            .join("")
        : `<p class="muted" style="text-align:center;padding:20px">예약 내역이 없습니다.</p>`}
    </div>
  `);
}
/* ----- F-MA: AI 추천 과제 찜 토글 ----- */
function bindFavButtons() {
    document.querySelectorAll(".fav-btn").forEach((b) => {
        b.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = b.dataset.pjt;
            if (favProjects.has(id)) {
                favProjects.delete(id);
                b.classList.remove("on");
                b.textContent = "☆";
            }
            else {
                favProjects.add(id);
                b.classList.add("on");
                b.textContent = "★";
                toast("⭐ 관심 과제 보관함에 추가했습니다.", "success");
            }
        });
    });
}
/* ----- F-AD: 기업 회원 가입 승인 ----- */
function adminCompanyCard() {
    const pending = DATA.companySignups.filter((c) => c.status === "pending");
    return `
    <div class="card">
      <h3 class="card-title">🏢 기업 회원 가입 승인 <span class="req-count">${pending.length}</span></h3>
      ${pending.length
        ? `<table class="tbl">
        <thead><tr><th>기업명</th><th>사업자번호</th><th>담당자</th><th>부서</th><th>신청일</th><th>처리</th></tr></thead>
        <tbody>
          ${pending
            .map((c) => `
            <tr id="cs-${c.id}">
              <td><b>${c.company}</b></td>
              <td class="muted sm">${c.biz}</td>
              <td>${c.manager}</td>
              <td class="muted sm">${c.dept}</td>
              <td class="muted sm">${c.date}</td>
              <td class="resv-actions">
                <button class="btn outline sm" onclick="handleCompanyApproval('${c.id}','reject')">반려</button>
                <button class="btn primary sm" onclick="handleCompanyApproval('${c.id}','approve')">승인</button>
              </td>
            </tr>`)
            .join("")}
        </tbody>
      </table>`
        : emptyState("승인 대기 중인 기업 회원이 없습니다.", "🏢")}
    </div>`;
}
function handleCompanyApproval(id, action) {
    const c = DATA.companySignups.find((x) => x.id === id);
    if (!c)
        return;
    c.status = action === "approve" ? "approved" : "rejected";
    // 회원 목록에도 상태 반영
    const m = DATA.members.find((x) => x.name === c.company);
    if (m && action === "approve")
        m.status = "활성";
    const row = document.getElementById("cs-" + id);
    if (row) {
        row.style.opacity = "0";
        // 페이드 후 admin 재렌더 → 대기 카운트·빈 상태(마지막 항목 처리) 갱신
        setTimeout(() => {
            row.remove();
            if (currentPage === "admin")
                render("admin");
        }, 260);
    }
    DATA.adminLogs.unshift({
        time: nowHM(),
        type: "가입",
        msg: `${c.company} 기업 회원 ${action === "approve" ? "승인" : "반려"}`,
    });
    toast(action === "approve"
        ? `✅ <b>${c.company}</b> 기업 가입을 승인했습니다. (안내 메일 발송)`
        : `🚫 <b>${c.company}</b> 기업 가입을 반려했습니다.`, action === "approve" ? "success" : "warn");
}
/* ----- 관리자: 예약 승인/반려 ----- */
function adminInfraResvCard() {
    const pending = DATA.infraReservations.filter((r) => r.status === "pending");
    return `
    <div class="card">
      <h3 class="card-title">🏗️ 인프라 예약 승인 <span class="req-count">${pending.length}</span></h3>
      ${pending.length
        ? `<table class="tbl resv-tbl">
        <thead><tr><th>구분</th><th>인프라</th><th>신청자</th><th>일시</th><th>인원</th><th>사용목적</th><th>처리</th></tr></thead>
        <tbody>
          ${pending
            .map((r) => `
            <tr id="resv-${r.id}">
              <td><span class="badge info">${r.type}</span></td>
              <td>${infraIcon(r.type)} ${r.infraName}</td>
              <td>${r.requester}</td>
              <td>${r.date}<br/><span class="muted sm">${r.start}~${r.end}</span></td>
              <td>${r.headcount}명</td>
              <td class="muted sm">${r.purpose}</td>
              <td class="resv-actions">
                <button class="btn outline sm" onclick="handleInfraResv('${r.id}','reject')">반려</button>
                <button class="btn primary sm" onclick="handleInfraResv('${r.id}','approve')">승인</button>
              </td>
            </tr>`)
            .join("")}
        </tbody>
      </table>`
        : emptyState("대기 중인 예약 신청이 없습니다.", "🏗️")}
    </div>`;
}
function handleInfraResv(id, action) {
    const r = DATA.infraReservations.find((x) => x.id === id);
    if (!r)
        return;
    r.status = action === "approve" ? "approved" : "rejected";
    const row = document.getElementById("resv-" + id);
    if (row) {
        row.style.opacity = "0";
        // 페이드 후 admin 재렌더 → 승인 대기 카운트·빈 상태 갱신
        setTimeout(() => {
            row.remove();
            if (currentPage === "admin")
                render("admin");
        }, 260);
    }
    DATA.adminLogs.unshift({
        time: nowHM(),
        type: "예약",
        msg: `${r.infraName} ${r.date} ${r.start}~${r.end} 예약 ${action === "approve" ? "승인" : "반려"} (${r.requester})`,
    });
    toast(action === "approve"
        ? `✅ <b>${r.infraName}</b> 예약을 승인했습니다.`
        : `🚫 <b>${r.infraName}</b> 예약을 반려했습니다.`, action === "approve" ? "success" : "warn");
}
