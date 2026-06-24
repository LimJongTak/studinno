/* ============================================================
   STUDINNO — F-ID GitLab 저장소 관리 (브랜치·MR·이슈·파이프라인)
   전역 스크립트(import/export 없음). data.js 이후, main.js 이전 로드.
   ============================================================ */

// 저장소 서브탭 상태
let ideTab = "commits"; // commits | branches | mr | issues | pipelines

function branchOptions(pjt: string): string {
  const list = DATA.branches.filter((b) => b.project === pjt);
  return list
    .map(
      (b) =>
        `<option value="${b.name}">${b.name}${b.isDefault ? " (default)" : ""}</option>`
    )
    .join("");
}

function repoTabs(): string {
  const openMr = DATA.mergeRequests.filter(
    (m) => m.project === currentWorkspace && (m.status === "open" || m.status === "draft")
  ).length;
  const openIssues = DATA.issues.filter(
    (i) => i.project === currentWorkspace && i.status === "open"
  ).length;
  const tabs: [string, string][] = [
    ["commits", "💾 커밋"],
    ["branches", "🌿 브랜치"],
    ["mr", `🔀 MR${openMr ? " " + openMr : ""}`],
    ["issues", `🐞 이슈${openIssues ? " " + openIssues : ""}`],
    ["pipelines", "🚦 파이프라인"],
  ];
  return tabs
    .map(
      ([k, label]) =>
        `<button class="cat-tab ${ideTab === k ? "active" : ""}" data-repotab="${k}">${label}</button>`
    )
    .join("");
}

function repoPanel(): string {
  const pjt = currentWorkspace;
  if (ideTab === "branches") return branchRows(pjt);
  if (ideTab === "mr") return mrRows(pjt);
  if (ideTab === "issues") return issueRows(pjt);
  if (ideTab === "pipelines") return pipelineRows(pjt);
  return `<div class="commit-list">${commitRows(pjt)}</div>`;
}

/* ----- 브랜치 ----- */
function branchRows(pjt: string): string {
  const list = DATA.branches.filter((b) => b.project === pjt);
  if (!list.length) return emptyState("브랜치가 없습니다.", "🌿");
  return `<div class="branch-list">${list
    .map(
      (b) => `
    <div class="branch-row">
      <div class="branch-main">
        <span class="branch-name">🌿 ${b.name}</span>
        ${b.isDefault ? `<span class="branch-tag default">default</span>` : ""}
      </div>
      <div class="branch-stat muted sm">
        ${b.ahead ? `<span class="ahead">↑${b.ahead}</span>` : ""}
        ${b.behind ? `<span class="behind">↓${b.behind}</span>` : ""}
        <span class="branch-last">${b.lastCommit}</span> · ${b.updated}
      </div>
      ${
        b.isDefault
          ? `<span class="muted sm">기본</span>`
          : `<button class="btn outline sm new-mr-btn" data-src="${b.name}">MR 생성</button>`
      }
    </div>`
    )
    .join("")}</div>
    <button class="btn outline full new-branch-btn" style="margin-top:10px">+ 새 브랜치</button>`;
}

/* ----- 머지 리퀘스트 ----- */
function mrStatusMeta(s: MrStatus): { cls: string; label: string } {
  if (s === "merged") return { cls: "done", label: "✔ Merged" };
  if (s === "draft") return { cls: "info", label: "✎ Draft" };
  if (s === "closed") return { cls: "open", label: "✕ Closed" };
  return { cls: "open", label: "● Open" };
}
function pipeBadge(p: string): string {
  if (p === "passed") return `<span class="pipe-badge passed">● 통과</span>`;
  if (p === "failed") return `<span class="pipe-badge failed">● 실패</span>`;
  if (p === "running") return `<span class="pipe-badge running">● 실행중</span>`;
  return "";
}
function linkedTaskTag(taskId: string): string {
  const t = DATA.kanban.find((k) => k.id === taskId);
  if (!t) return "";
  return ` <span class="mr-task">🗂️ ${t.title}${t.col === "done" ? " ✓" : ""}</span>`;
}
function mrRows(pjt: string): string {
  const list = DATA.mergeRequests.filter((m) => m.project === pjt);
  if (!list.length) return emptyState("머지 리퀘스트가 없습니다.", "🔀");
  return `<div class="mr-list">${list
    .map((m) => {
      const sm = mrStatusMeta(m.status);
      return `
    <div class="mr-row" data-mr="${m.id}">
      <div class="mr-main">
        <div class="mr-title"><span class="badge ${sm.cls}">${sm.label}</span> ${m.title}</div>
        <div class="mr-meta muted sm">
          <code>${m.source}</code> → <code>${m.target}</code> · ${m.author} · ${m.time}
          · 👍 ${m.approvals}/${m.approvalsNeeded} · 💬 ${m.comments}
          · <b class="add">+${m.added}</b> <b class="del">−${m.removed}</b> ${pipeBadge(m.pipeline)}${
        m.task ? linkedTaskTag(m.task) : ""
      }
        </div>
      </div>
      <button class="btn outline sm mr-detail-btn" data-mr="${m.id}">상세 ›</button>
    </div>`;
    })
    .join("")}</div>`;
}
function openMrDetail(id: string): void {
  const m = DATA.mergeRequests.find((x) => x.id === id);
  if (!m) return;
  const sm = mrStatusMeta(m.status);
  const canMerge =
    m.status === "open" && m.approvals >= m.approvalsNeeded && m.pipeline === "passed";
  openModal(`
    <div class="modal-head"><h3>🔀 ${m.id} · ${m.title}</h3><button class="modal-x" onclick="closeModal()" aria-label="닫기">✕</button></div>
    <div class="mr-detail-meta">
      <span class="badge ${sm.cls}">${sm.label}</span>
      <code>${m.source}</code> → <code>${m.target}</code>
      <span class="muted sm">· ${m.author} · ${m.time}</span>
    </div>
    <div class="mr-detail-stats">
      <span>📝 변경 파일 ${m.changes}</span>
      <span><b class="add">+${m.added}</b> <b class="del">−${m.removed}</b></span>
      <span>👍 승인 ${m.approvals}/${m.approvalsNeeded}</span>
      <span>${pipeBadge(m.pipeline) || "파이프라인 없음"}</span>
      ${m.task ? `<span>🗂️ 연결 태스크:${linkedTaskTag(m.task)}</span>` : ""}
    </div>
    <div class="diff-block">
      <div class="diff-file">📄 ${m.source}.py</div>
      <pre class="diff-pre"><span class="dl ctx">  def forward(self, x):</span>
<span class="dl del">-     return self.base(x)</span>
<span class="dl add">+     x = self.augment(x)</span>
<span class="dl add">+     return self.base(x)</span></pre>
    </div>
    <p class="muted sm">${
      m.status === "merged"
        ? "이미 병합된 MR입니다."
        : canMerge
          ? "✅ 승인 조건과 파이프라인을 충족해 병합할 수 있습니다."
          : "⚠️ 승인 수 또는 파이프라인 통과가 필요합니다."
    }</p>
    <div class="modal-actions">
      <button class="btn outline" onclick="closeModal()">닫기</button>
      ${
        m.status === "open"
          ? `<button class="btn outline" onclick="approveMr('${m.id}')">👍 승인</button>
             <button class="btn primary" ${canMerge ? "" : "disabled"} onclick="mergeMr('${m.id}')">🔀 병합</button>`
          : ""
      }
    </div>`);
}
function approveMr(id: string): void {
  const m = DATA.mergeRequests.find((x) => x.id === id);
  if (!m || m.status !== "open") return;
  if (m.approvals < m.approvalsNeeded) m.approvals++;
  addNotif("👍", `MR <b>${m.id}</b> 승인 (${m.approvals}/${m.approvalsNeeded})`);
  toast(`👍 <b>${m.id}</b> 승인 (${m.approvals}/${m.approvalsNeeded})`, "success");
  openMrDetail(id); // 모달 갱신
}
function mergeMr(id: string): void {
  const m = DATA.mergeRequests.find((x) => x.id === id);
  if (!m) return;
  if (!(m.approvals >= m.approvalsNeeded && m.pipeline === "passed")) {
    toast("⚠️ 승인·파이프라인 조건을 충족해야 병합할 수 있습니다.", "warn");
    return;
  }
  m.status = "merged";
  // 소스 브랜치 ahead 반영(데모): main 최신 커밋 갱신
  const main = DATA.branches.find((b) => b.project === m.project && b.isDefault);
  if (main) {
    main.lastCommit = m.title;
    main.updated = nowHM();
  }
  // 병합 커밋을 커밋 로그에 반영 (GitLab 협업 일관성)
  const hash = Math.random().toString(16).slice(2, 9);
  DATA.commits.unshift({
    id: hash,
    project: m.project,
    msg: `Merge '${m.source}' into '${m.target}' (${m.title})`,
    author: DATA.user.name,
    time: nowHM(),
    added: m.added,
    removed: m.removed,
    diff: [
      {
        file: `${m.source}`,
        lines: [
          { type: "ctx", text: `  # ${m.id}: ${m.title}` },
          { type: "add", text: `  merged ${m.changes} files (+${m.added} −${m.removed})` },
        ],
      },
    ],
  });
  DATA.adminLogs.unshift({ time: nowHM(), type: "병합", msg: `${m.id} ${m.source}→${m.target} 병합` });
  addNotif("🔀", `MR <b>${m.id}</b> 병합 완료 (${m.source}→${m.target})`);
  toast(`🔀 <b>${m.id}</b> 을(를) ${m.target} 에 병합했습니다.`, "success");
  // 연결된 칸반 태스크 자동 완료 (GitLab ↔ F-PM 워크스페이스 연동)
  if (m.task) {
    const t = DATA.kanban.find((k) => k.id === m.task);
    if (t && t.col !== "done") {
      t.col = "done";
      addNotif("🗂️", `칸반 태스크 완료: <b>${t.title}</b> (MR ${m.id} 병합)`);
      toast(`🗂️ 연결된 칸반 태스크 <b>${t.title}</b> 가 '완료'로 이동했습니다.`, "success");
    }
  }
  closeModal();
  if (currentPage === "ide") refreshRepoPanel();
}

/* ----- 이슈 ----- */
function issueLabelMeta(label: string): { cls: string; txt: string } {
  if (label === "bug") return { cls: "lb-bug", txt: "🐞 bug" };
  if (label === "feature") return { cls: "lb-feat", txt: "✨ feature" };
  return { cls: "lb-docs", txt: "📄 docs" };
}
function issueRows(pjt: string): string {
  const list = DATA.issues.filter((i) => i.project === pjt);
  if (!list.length) return emptyState("이슈가 없습니다.", "🐞");
  return `<div class="issue-list">${list
    .map((i) => {
      const lm = issueLabelMeta(i.label);
      const closed = i.status === "closed";
      return `
    <div class="issue-row ${closed ? "closed" : ""}">
      <span class="issue-state ${closed ? "closed" : "open"}">${closed ? "✓" : "○"}</span>
      <div class="issue-main">
        <div class="issue-title">${i.id} ${i.title}</div>
        <div class="issue-meta muted sm"><span class="issue-label ${lm.cls}">${lm.txt}</span> · 👤 ${i.assignee} · 💬 ${i.comments} · ${i.time}</div>
      </div>
      <button class="btn outline sm issue-toggle-btn" data-issue="${i.id}">${closed ? "다시 열기" : "닫기"}</button>
    </div>`;
    })
    .join("")}</div>
    <button class="btn outline full new-issue-btn" style="margin-top:10px">+ 새 이슈</button>`;
}
function toggleIssue(id: string): void {
  const i = DATA.issues.find((x) => x.id === id);
  if (!i) return;
  i.status = i.status === "open" ? "closed" : "open";
  toast(
    i.status === "closed" ? `✓ 이슈 <b>${i.id}</b> 닫음` : `○ 이슈 <b>${i.id}</b> 다시 열기`,
    "info"
  );
  if (currentPage === "ide") refreshRepoPanel();
}

/* ----- CI/CD 파이프라인 ----- */
function stageIcon(s: StageStatus): string {
  if (s === "passed") return `<span class="stg passed" title="통과">✔</span>`;
  if (s === "failed") return `<span class="stg failed" title="실패">✕</span>`;
  if (s === "running") return `<span class="stg running" title="실행중">◐</span>`;
  return `<span class="stg skipped" title="건너뜀">○</span>`;
}
function pipelineRows(pjt: string): string {
  const list = DATA.pipelines.filter((p) => p.project === pjt);
  if (!list.length) return emptyState("파이프라인 실행 기록이 없습니다.", "🚦");
  return `<div class="pipe-list">${list
    .map(
      (p) => `
    <div class="pipe-row">
      <div class="pipe-id">
        <span class="pipe-badge ${p.status}">● ${
          p.status === "passed" ? "통과" : p.status === "failed" ? "실패" : "실행중"
        }</span>
        <b>${p.id}</b>
      </div>
      <div class="pipe-main">
        <div class="pipe-stages">${p.stages
          .map(
            (s) =>
              `${stageIcon(s.status)}<span class="stg-name">${s.name}</span>`
          )
          .join(`<span class="stg-arrow">→</span>`)}</div>
        <div class="pipe-meta muted sm"><code>${p.branch}</code> · <code>${p.commit}</code> · ⏱ ${p.duration} · ${p.time}</div>
      </div>
      <button class="btn outline sm pipe-rerun-btn" data-pipe="${p.id}">↻ 재실행</button>
    </div>`
    )
    .join("")}</div>`;
}
function rerunPipeline(id: string): void {
  const p = DATA.pipelines.find((x) => x.id === id);
  if (!p) return;
  p.status = "running";
  p.stages = p.stages.map((s, idx) => ({
    name: s.name,
    status: idx === 0 ? "passed" : idx === 1 ? "running" : "skipped",
  }));
  addNotif("🚦", `파이프라인 <b>${p.id}</b> 재실행 시작`);
  toast(`🚦 파이프라인 <b>${p.id}</b> 을(를) 재실행합니다.`, "info");
  if (currentPage === "ide") refreshRepoPanel();
}

/* ----- 패널 갱신 + 바인딩 ----- */
function refreshRepoPanel(): void {
  const panel = document.getElementById("repoPanel");
  if (panel) panel.innerHTML = repoPanel();
  const tabs = document.getElementById("repoTabs");
  if (tabs) tabs.innerHTML = repoTabs();
  bindRepoTabs();
  bindRepoPanel();
}
function bindRepoTabs(): void {
  document.querySelectorAll<HTMLElement>("#repoTabs .cat-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      ideTab = tab.dataset.repotab as string;
      refreshRepoPanel();
    });
  });
}
function bindRepoPanel(): void {
  // 커밋 Diff
  document.querySelectorAll<HTMLElement>("#repoPanel .diff-btn").forEach((b) => {
    b.addEventListener("click", () => openDiffModal(b.dataset.id as string));
  });
  // MR
  document.querySelectorAll<HTMLElement>("#repoPanel .mr-detail-btn").forEach((b) => {
    b.addEventListener("click", () => openMrDetail(b.dataset.mr as string));
  });
  document.querySelectorAll<HTMLElement>("#repoPanel .new-mr-btn").forEach((b) => {
    b.addEventListener("click", () => toast(`🔀 <b>${b.dataset.src}</b> → main MR 생성 화면으로 이동합니다. (데모)`, "info"));
  });
  // 이슈
  document.querySelectorAll<HTMLElement>("#repoPanel .issue-toggle-btn").forEach((b) => {
    b.addEventListener("click", () => toggleIssue(b.dataset.issue as string));
  });
  document.querySelectorAll<HTMLElement>("#repoPanel .new-issue-btn").forEach((b) => {
    b.addEventListener("click", () => toast("🐞 새 이슈 작성 화면으로 이동합니다. (데모)", "info"));
  });
  // 파이프라인
  document.querySelectorAll<HTMLElement>("#repoPanel .pipe-rerun-btn").forEach((b) => {
    b.addEventListener("click", () => rerunPipeline(b.dataset.pipe as string));
  });
  // 브랜치
  document.querySelectorAll<HTMLElement>("#repoPanel .new-branch-btn").forEach((b) => {
    b.addEventListener("click", () => toast("🌿 새 브랜치 생성. (데모)", "info"));
  });
}
