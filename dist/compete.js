"use strict";
/* ============================================================
   STUDINNO — F-ID(Kaggle) 경진대회·해커톤 대회 서비스
   전역 스크립트(import/export 없음). data.js 이후, main.js 이전 로드.
   대회 목록 · 리더보드 · 내 제출 · 참가/제출 · 상세 모달.
   ============================================================ */
let compFilter = "all"; // all | 경진대회 | 해커톤 | mine
function compStatusMeta(s) {
    if (s === "진행중")
        return { cls: "open", label: "🟢 진행중" };
    if (s === "예정")
        return { cls: "info", label: "🔜 예정" };
    return { cls: "done", label: "🏁 종료" };
}
function compFilterTabs() {
    const tabs = [
        ["all", "전체"],
        ["경진대회", "🏆 경진대회"],
        ["해커톤", "⚡ 해커톤"],
        ["mine", "⭐ 내 참가"],
    ];
    return tabs
        .map(([k, label]) => `<button class="cat-tab ${compFilter === k ? "active" : ""}" data-cf="${k}">${label}</button>`)
        .join("");
}
function filteredComps() {
    return DATA.competitions.filter((c) => {
        if (compFilter === "mine")
            return c.joined;
        if (compFilter === "경진대회" || compFilter === "해커톤")
            return c.type === compFilter;
        return true;
    });
}
function myRank(c) {
    return c.leaderboard.find((r) => r.isMe);
}
function teamLabel(c) {
    return c.teamMax > 1 ? `👥 ${c.teamMin}~${c.teamMax}인 팀` : "👤 개인전";
}
function compCard(c) {
    const sm = compStatusMeta(c.status);
    const mine = myRank(c);
    return `
  <div class="card comp-card" data-comp="${c.id}">
    <div class="comp-top">
      <span class="comp-type ${c.type === "해커톤" ? "hack" : "race"}">${c.type === "해커톤" ? "⚡ 해커톤" : "🏆 경진대회"}</span>
      <span class="badge ${sm.cls}">${sm.label}</span>
    </div>
    <h3 class="card-title">${c.title}</h3>
    <p class="muted sm">🏛️ ${c.host}</p>
    <div class="tags">${c.tags.map((t) => `<span class="tag">#${t}</span>`).join("")}</div>
    <div class="comp-meta">
      <span>📏 ${c.metric}</span>
      <span>⏰ ~${c.deadline}</span>
      <span>👥 ${c.participants}팀</span>
      <span class="comp-teamtag">${teamLabel(c)}</span>
    </div>
    <div class="comp-prize">🏆 ${c.prize}</div>
    ${c.joined && c.myTeam
        ? `<div class="comp-myrank">🧑‍🤝‍🧑 <b>${c.myTeam.name}</b> (${c.myTeam.members.length}명)${mine ? ` · 현재 <b>${mine.rank}위</b> ${rankChange(mine.change)}` : ""}</div>`
        : mine
            ? `<div class="comp-myrank">내 순위 <b>${mine.rank}위</b> · 점수 ${mine.score} ${rankChange(mine.change)}</div>`
            : ""}
    <div class="comp-actions">
      <button class="btn outline sm comp-detail-btn" data-comp="${c.id}">📊 리더보드·상세</button>
      ${c.status === "종료"
        ? `<button class="btn outline sm" disabled>종료됨</button>`
        : c.joined
            ? `<button class="btn primary sm comp-submit-btn" data-comp="${c.id}">⬆ 제출 (${c.usedToday}/${c.dailyLimit})</button>`
            : `<button class="btn primary sm comp-join-btn" data-comp="${c.id}">+ 참가</button>`}
    </div>
  </div>`;
}
function rankChange(ch) {
    if (ch > 0)
        return `<span class="rc up">▲${ch}</span>`;
    if (ch < 0)
        return `<span class="rc down">▼${-ch}</span>`;
    return `<span class="rc same">–</span>`;
}
function compGrid() {
    const list = filteredComps();
    if (!list.length)
        return emptyState("해당 조건의 대회가 없습니다.", "🏆");
    return list.map(compCard).join("");
}
function leaderboardTable(c) {
    if (!c.leaderboard.length)
        return `<p class="muted sm">아직 제출이 없어 리더보드가 비어 있습니다.</p>`;
    return `<table class="tbl lb-tbl">
    <thead><tr><th>순위</th><th>팀</th><th>인원</th><th>${c.metric}</th><th>제출</th><th>변동</th></tr></thead>
    <tbody>
      ${c.leaderboard
        .map((r) => `<tr class="${r.isMe ? "lb-me" : ""}"><td class="lb-rank ${r.rank <= 3 ? "top" : ""}">${r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</td><td>${r.team}${r.isMe ? ' <span class="lb-metag">나</span>' : ""}</td><td class="muted sm">${r.members}명</td><td><b>${r.score}</b></td><td class="muted sm">${r.entries}</td><td>${rankChange(r.change)}</td></tr>`)
        .join("")}
    </tbody>
  </table>`;
}
function submissionRows() {
    if (!DATA.submissions.length)
        return emptyState("제출 이력이 없습니다. 대회에 참가해 제출해 보세요.", "📤");
    return `<table class="tbl">
    <thead><tr><th>대회</th><th>팀</th><th>파일</th><th>점수</th><th>순위</th><th>일시</th><th>상태</th></tr></thead>
    <tbody>
      ${DATA.submissions
        .map((s) => {
        const c = DATA.competitions.find((x) => x.id === s.comp);
        const st = s.status === "scored"
            ? `<span class="badge done">✔ 채점완료</span>`
            : s.status === "scoring"
                ? `<span class="badge info">◐ 채점중</span>`
                : `<span class="badge open">✕ 오류</span>`;
        return `<tr><td>${c ? c.title : s.comp}</td><td>${s.team}</td><td><code>${s.file}</code></td><td><b>${s.score}</b></td><td>${s.rank}위</td><td class="muted sm">${s.time}</td><td>${st}</td></tr>`;
    })
        .join("")}
    </tbody>
  </table>`;
}
function phaseBar(c) {
    const phases = ["모집", "진행", "채점", "발표"];
    const cur = phases.indexOf(c.phase);
    return `<div class="phase-bar">${phases
        .map((p, i) => `<div class="phase-step ${i < cur ? "done" : i === cur ? "active" : ""}"><span class="ps-dot">${i < cur ? "✓" : i + 1}</span><span class="ps-label">${p}</span></div>`)
        .join('<div class="phase-line"></div>')}</div>`;
}
function teamRoster(c) {
    if (!c.myTeam)
        return "";
    return `<h4 class="mini-title">🧑‍🤝‍🧑 내 팀 — ${c.myTeam.name} <span class="muted sm">(${c.myTeam.members.length}/${c.teamMax}명)</span></h4>
    <div class="roster">${c.myTeam.members
        .map((m, i) => `<span class="roster-chip ${i === 0 ? "leader" : ""}">${i === 0 ? "👑 " : ""}${m}</span>`)
        .join("")}</div>`;
}
function openCompDetail(id) {
    const c = DATA.competitions.find((x) => x.id === id);
    if (!c)
        return;
    const sm = compStatusMeta(c.status);
    openModal(`
    <div class="modal-head"><h3>${c.type === "해커톤" ? "⚡" : "🏆"} ${c.title}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="comp-detail-meta">
      <span class="comp-type ${c.type === "해커톤" ? "hack" : "race"}">${c.type}</span>
      <span class="badge ${sm.cls}">${sm.label}</span>
      <span class="comp-teamtag">${teamLabel(c)}</span>
      <span class="muted sm">🏛️ ${c.host}</span>
    </div>
    ${phaseBar(c)}
    <p class="modal-desc">${c.desc}</p>
    <div class="comp-detail-stats">
      <span>📏 평가 <b>${c.metric}</b></span>
      <span>📅 ${c.startDate} ~ ${c.deadline}</span>
      <span>👥 <b>${c.participants}팀</b></span>
      <span>🧑‍🤝‍🧑 팀 <b>${c.teamMin}~${c.teamMax}명</b></span>
      <span>📊 ${c.publicSplit}</span>
      ${c.joined ? `<span>⬆ 오늘 제출 <b>${c.usedToday}/${c.dailyLimit}</b></span>` : ""}
    </div>
    <h4 class="mini-title">🏆 시상 내역</h4>
    <div class="prize-list">${c.prizes
        .map((p) => `<div class="prize-row"><span class="pz-place">${p.place}</span><span>${p.reward}</span></div>`)
        .join("")}</div>
    <h4 class="mini-title">📋 대회 규정</h4>
    <ul class="rule-list">${c.rules.map((r) => `<li>${r}</li>`).join("")}</ul>
    ${teamRoster(c)}
    <h4 class="mini-title">🏅 리더보드</h4>
    ${leaderboardTable(c)}
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">닫기</button>
      ${c.status === "종료"
        ? ""
        : c.joined
            ? `<button class="btn primary" onclick="openSubmitModal('${c.id}')">⬆ 제출하기 (${c.usedToday}/${c.dailyLimit})</button>`
            : `<button class="btn primary" onclick="openJoinModal('${c.id}')">+ 참가 신청</button>`}
    </div>`);
}
// ----- 팀 단위 참가 신청 모달 -----
function openJoinModal(id) {
    const c = DATA.competitions.find((x) => x.id === id);
    if (!c || c.joined)
        return;
    const soloAllowed = c.teamMin <= 1;
    const candidates = DATA.talents
        .map((t) => t.name)
        .filter((n) => n !== DATA.user.name);
    openModal(`
    <div class="modal-head"><h3>+ 참가 신청 — ${c.title}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc">${c.type === "해커톤" ? "⚡ 해커톤은 팀 단위 참가입니다. " : ""}팀 구성 규정: <b>${c.teamMin}~${c.teamMax}명</b></p>
    <div class="join-mode" id="joinMode">
      ${soloAllowed
        ? `<label class="jm-opt"><input type="radio" name="jmode" value="solo"/> 👤 개인 참가</label>`
        : ""}
      <label class="jm-opt"><input type="radio" name="jmode" value="team" checked/> 👥 팀 참가</label>
    </div>
    <div id="teamFields">
      <div class="fld"><label class="field-label">팀명 *</label><input class="input" id="joinTeamName" value="순천AI팀" placeholder="예) 순천AI팀"/></div>
      <label class="field-label">팀원 초대 <span class="muted sm">(팀장: 👑 ${DATA.user.name})</span></label>
      <div class="member-pick">
        ${candidates
        .map((n) => `<label class="mp-item"><input type="checkbox" class="mp-chk" value="${n}"/> ${n}</label>`)
        .join("")}
      </div>
      <p class="muted sm" id="teamCount">현재 <b>1</b>명 (팀장 포함) · 정원 ${c.teamMin}~${c.teamMax}명</p>
    </div>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="confirmJoin('${c.id}', this)">참가 신청</button>
    </div>`);
    // 라디오: 개인/팀 전환 시 팀 입력 토글
    const teamFields = modalBox.querySelector("#teamFields");
    const countEl = modalBox.querySelector("#teamCount b");
    const refreshCount = () => {
        const n = 1 + modalBox.querySelectorAll(".mp-chk:checked").length;
        if (countEl)
            countEl.textContent = String(n);
    };
    modalBox.querySelectorAll('input[name="jmode"]').forEach((r) => {
        r.addEventListener("change", () => {
            if (teamFields)
                teamFields.style.display = r.value === "solo" ? "none" : "";
        });
    });
    modalBox.querySelectorAll(".mp-chk").forEach((cb) => {
        cb.addEventListener("change", refreshCount);
    });
}
function confirmJoin(id, btn) {
    const c = DATA.competitions.find((x) => x.id === id);
    if (!c || c.joined)
        return;
    const modeEl = modalBox.querySelector('input[name="jmode"]:checked');
    const mode = modeEl ? modeEl.value : "team";
    let members = [DATA.user.name];
    let teamNm = DATA.user.name;
    if (mode === "team") {
        teamNm = fv("joinTeamName") || "순천AI팀";
        const picked = Array.from(modalBox.querySelectorAll(".mp-chk:checked")).map((el) => el.value);
        members = [DATA.user.name, ...picked];
        if (members.length < c.teamMin) {
            toast(`⚠️ 최소 ${c.teamMin}명이 필요합니다. (현재 ${members.length}명)`, "warn");
            return;
        }
        if (members.length > c.teamMax) {
            toast(`⚠️ 최대 ${c.teamMax}명까지 가능합니다.`, "warn");
            return;
        }
    }
    busy(btn, () => {
        c.joined = true;
        c.participants++;
        c.myTeam = { name: mode === "team" ? teamNm : DATA.user.name, members };
        addNotif("🏆", `대회 참가 신청: <b>${c.title}</b> — ${mode === "team" ? `${teamNm} (${members.length}명)` : "개인"}`);
        toast(`✅ <b>${c.title}</b> 에 ${mode === "team" ? `팀 <b>${teamNm}</b>(${members.length}명)으로` : "개인으로"} 참가 신청했습니다.`, "success");
        closeModal();
        if (currentPage === "compete")
            render("compete");
    });
}
function openSubmitModal(id) {
    const c = DATA.competitions.find((x) => x.id === id);
    if (!c)
        return;
    openModal(`
    <div class="modal-head"><h3>⬆ 제출 — ${c.title}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <p class="modal-desc">예측 결과 파일(.csv)을 업로드하면 <b>${c.metric}</b> 기준으로 자동 채점되어 리더보드에 반영됩니다. (데모)</p>
    <div class="fld"><label class="field-label">제출 파일명</label><input class="input" id="subFile" placeholder="예) submission_final.csv" value="submission_v3.csv"/></div>
    <div class="upload-zone" id="subZone">📁 파일을 끌어다 놓거나 클릭해 선택 (데모)</div>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">취소</button>
      <button class="btn primary" onclick="submitEntry('${c.id}', this)">⬆ 제출 & 채점</button>
    </div>`);
}
function submitEntry(id, btn) {
    const c = DATA.competitions.find((x) => x.id === id);
    if (!c)
        return;
    if (c.usedToday >= c.dailyLimit) {
        toast(`⚠️ 오늘 제출 한도(${c.dailyLimit}회)를 모두 사용했습니다. 내일 다시 시도하세요.`, "warn");
        return;
    }
    const file = fv("subFile") || "submission.csv";
    const teamNm = c.myTeam ? c.myTeam.name : DATA.user.name;
    const teamSize = c.myTeam ? c.myTeam.members.length : 1;
    busy(btn, () => {
        c.usedToday++;
        // 데모 채점: 기존 내 점수에서 소폭 개선
        const me = myRank(c);
        const lowerBetter = /RMSE|MAE|loss/i.test(c.metric);
        let score;
        if (me) {
            const delta = (Math.random() * 0.02 + 0.005) * (lowerBetter ? -1 : 1);
            score = +(me.score + delta).toFixed(3);
        }
        else {
            score = lowerBetter ? +(200 - Math.random() * 30).toFixed(1) : +(0.85 + Math.random() * 0.1).toFixed(3);
        }
        // 리더보드 반영: 내 행 갱신 또는 추가 후 재정렬
        let row = me;
        if (row) {
            row.score = score;
            row.entries++;
            row.team = teamNm;
            row.members = teamSize;
        }
        else {
            row = { rank: 0, team: teamNm, score, entries: 1, change: 0, isMe: true, members: teamSize };
            c.leaderboard.push(row);
        }
        c.leaderboard.sort((a, b) => (lowerBetter ? a.score - b.score : b.score - a.score));
        c.leaderboard.forEach((r, i) => {
            const newRank = i + 1;
            if (r.isMe)
                r.change = r.rank - newRank; // 내 순위 변동만 갱신(타 팀 기존 변동 보존)
            r.rank = newRank;
        });
        const myNew = myRank(c);
        DATA.submissions.unshift({
            id: uid("SUB"),
            comp: c.id,
            team: teamNm,
            file,
            score,
            rank: myNew ? myNew.rank : c.leaderboard.length,
            time: nowHM(),
            status: "scored",
        });
        addNotif("📤", `제출 완료: <b>${c.title}</b> — ${c.metric} ${score} (${myNew ? myNew.rank : "?"}위)`);
        toast(`✅ 채점 완료! <b>${c.metric} ${score}</b> · 현재 <b>${myNew ? myNew.rank : "?"}위</b>`, "success");
        // 입상(top-3) → 디지털 배지 자동 발급 (Kaggle → F-CR 배지·포트폴리오 연계)
        if (myNew &&
            myNew.rank <= 3 &&
            !DATA.badges.some((b) => b.name === c.title + " 입상")) {
            DATA.badges.unshift({
                icon: ["🥇", "🥈", "🥉"][myNew.rank - 1],
                name: c.title + " 입상",
                type: "대외",
                date: "2026-06-23",
                issuer: c.host,
                criteria: `${c.metric} 기준 ${myNew.rank}위 입상`,
                score,
            });
            addNotif("🏅", `🎉 배지 발급: <b>${c.title} 입상</b> (${myNew.rank}위)`);
            toast(`🏅 입상! <b>${c.title} 입상</b> 배지가 발급되어 포트폴리오에 반영됩니다.`, "success");
        }
        closeModal();
        if (currentPage === "compete")
            render("compete");
    }, 900);
}
// F-AI 연계: 대회 입상 실적 → 인재매칭 가점 (내 팀 top3 입상이 팀원 매칭에 반영)
function talentCompAwards(name) {
    const out = [];
    DATA.competitions.forEach((c) => {
        if (c.myTeam && c.myTeam.members.includes(name)) {
            const me = c.leaderboard.find((r) => r.isMe);
            if (me && me.rank <= 3)
                out.push({ title: c.title, rank: me.rank });
        }
    });
    return out;
}
function talentCompBonus(name) {
    return Math.min(12, talentCompAwards(name).reduce((s, a) => s + (4 - a.rank) * 2, 0));
}
function compAwardBadge(name) {
    const aw = talentCompAwards(name);
    if (!aw.length)
        return "";
    return `<span class="comp-award-badge" title="${aw
        .map((a) => a.title + " " + a.rank + "위")
        .join(", ")}">🏆 대회 입상 ${aw.length}회 · 매칭 가점 +${talentCompBonus(name)}</span>`;
}
// F-CR 연계: 참가/수상 실적 (포트폴리오에서 자동 집계)
function myCompStats() {
    const joined = DATA.competitions.filter((c) => c.joined);
    const awards = joined.filter((c) => {
        const m = myRank(c);
        return !!m && m.rank <= 3;
    }).length;
    return { joined: joined.length, awards };
}
function compAchievements() {
    const joined = DATA.competitions.filter((c) => c.joined);
    if (!joined.length)
        return emptyState("참가한 대회가 없습니다. 경진대회·해커톤에 참가해 실적을 쌓아보세요.", "🏆");
    return `<div class="comp-ach-list">${joined
        .map((c) => {
        const m = myRank(c);
        const award = !!m && m.rank <= 3;
        const medal = award ? ["🥇", "🥈", "🥉"][m.rank - 1] : "";
        return `<div class="comp-ach-row ${award ? "award" : ""}">
        <span class="comp-type ${c.type === "해커톤" ? "hack" : "race"}">${c.type}</span>
        <div class="ca-main"><b>${c.title}</b><span class="muted sm">${c.host} · 📏 ${c.metric}</span></div>
        <div class="ca-rank">${medal} <b>${m ? m.rank + "위" : "-"}</b>${m ? ` <span class="muted sm">/ ${c.participants}팀</span>` : ""}</div>
        ${award ? `<span class="ca-award">🏆 수상권</span>` : `<span class="badge ${c.status === "종료" ? "done" : "info"}">${c.status}</span>`}
      </div>`;
    })
        .join("")}</div>`;
}
function bindCompete() {
    document.querySelectorAll("#compFilterTabs .cat-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            compFilter = tab.dataset.cf;
            document
                .querySelectorAll("#compFilterTabs .cat-tab")
                .forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            const grid = document.getElementById("compGrid");
            if (grid)
                grid.innerHTML = compGrid();
            bindCompCards();
        });
    });
    bindCompCards();
}
function bindCompCards() {
    document.querySelectorAll("#compGrid .comp-detail-btn").forEach((b) => {
        b.addEventListener("click", () => openCompDetail(b.dataset.comp));
    });
    document.querySelectorAll("#compGrid .comp-join-btn").forEach((b) => {
        b.addEventListener("click", () => openJoinModal(b.dataset.comp));
    });
    document.querySelectorAll("#compGrid .comp-submit-btn").forEach((b) => {
        b.addEventListener("click", () => openSubmitModal(b.dataset.comp));
    });
}
