/* ============================================================
   STUDINNO — 차트 렌더 (main.ts에서 분리 · 전역 스크립트, import/export 없음)
   레이더/막대/도넛 캔버스 그리기. data.js 이후, main.js 이전 로드.
   ============================================================ */

// 매칭 레이더 오버레이 (요구역량 vs 보유역량) — drawRoadmapRadar 패턴 + 축 라벨
function drawMatchRadar(
  canvasId: string,
  req: Record<string, number>,
  skills: Record<string, number>
): void {
  const cv = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const cx = 120,
    cy = 120,
    R = 76;
  const labels = SKILL_AXES;
  const n = labels.length;
  ctx.clearRect(0, 0, 240, 240);
  const light = !document.body.classList.contains("dark");
  const gridColor = light ? "rgba(30,41,59,.12)" : "rgba(255,255,255,.08)";
  for (let lvl = 1; lvl <= 4; lvl++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
        r = (R / 4) * lvl;
      const x = cx + r * Math.cos(a),
        y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  const drawSeries = (values: number[], stroke: string, fill: string): void => {
    ctx.beginPath();
    values.forEach((v, i) => {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
        r = R * (v / 100);
      const x = cx + r * Math.cos(a),
        y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  drawSeries(labels.map((l) => req[l] || 0), "#f59e0b", "rgba(245,158,11,.14)");
  drawSeries(labels.map((l) => skills[l] || 0), "#6366f1", "rgba(99,102,241,.42)");
  // 축 라벨
  ctx.fillStyle = light ? "#6b7480" : "rgba(255,255,255,.7)";
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((l, i) => {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2;
    const x = cx + (R + 16) * Math.cos(a),
      y = cy + (R + 12) * Math.sin(a);
    ctx.fillText(l, x, y);
  });
}

function eduBars(period: Period): string {
  const data = DATA.dashboard[period].edu;
  const max = Math.max(...data.map((d) => d.value));
  return data
    .map(
      (d) => `
    <div class="bar-row" title="${d.label}: ${d.value}">
      <span class="bar-label">${d.label}</span>
      <div class="bar-track"><div class="bar-val" style="width:${Math.round(
        (d.value / max) * 100
      )}%"></div></div>
      <span class="bar-num">${d.value}</span>
    </div>`
    )
    .join("");
}

function donutLegend(period: Period): string {
  const data = DATA.dashboard[period].demand;
  const total = data.reduce((s, d) => s + d.value, 0);
  return data
    .map(
      (d) => `
    <div class="dl-item">
      <i style="background:${d.color}"></i>${d.label}
      <b>${Math.round((d.value / total) * 100)}%</b>
    </div>`
    )
    .join("");
}

function drawDemandDonut(period: Period): void {
  const cv = document.getElementById("demandDonut") as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const data = DATA.dashboard[period].demand;
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 85,
    cy = 85,
    rOuter = 72,
    rInner = 44;
  ctx.clearRect(0, 0, 170, 170);
  donutGeo = { cx, cy, rOuter, rInner };
  donutSegments = [];
  let start = -Math.PI / 2;
  data.forEach((d) => {
    const ang = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOuter, start, start + ang);
    ctx.closePath();
    ctx.fillStyle = d.color;
    ctx.fill();
    donutSegments.push({
      start,
      end: start + ang,
      label: d.label,
      pct: Math.round((d.value / total) * 100),
      color: d.color,
    });
    start += ang;
  });
  // 가운데 구멍 (테마 배경색)
  const hole = getComputedStyle(document.body).getPropertyValue("--surface") || "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = hole.trim() || "#fff";
  ctx.fill();
  // 중앙 총계
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text").trim() || "#1b2430";
  ctx.font = "bold 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("100%", cx, cy - 4);
  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text-dim").trim() || "#6b7480";
  ctx.fillText("산업수요", cx, cy + 14);
}

/* F-MA 도넛 호버 툴팁: 세그먼트(각도)별 라벨·비율 표시 */
interface DonutSeg {
  start: number;
  end: number;
  label: string;
  pct: number;
  color: string;
}
let donutSegments: DonutSeg[] = [];
let donutGeo = { cx: 85, cy: 85, rOuter: 72, rInner: 44 };
function bindDonutTooltip(): void {
  const cv = document.getElementById("demandDonut") as HTMLCanvasElement | null;
  if (!cv) return;
  let tip = document.getElementById("chartTip");
  if (!tip) {
    tip = document.createElement("div");
    tip.id = "chartTip";
    tip.className = "chart-tip";
    document.body.appendChild(tip);
  }
  const tipEl = tip;
  cv.onmousemove = (e: MouseEvent): void => {
    const rect = cv.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * cv.width;
    const my = ((e.clientY - rect.top) / rect.height) * cv.height;
    const dx = mx - donutGeo.cx;
    const dy = my - donutGeo.cy;
    const r = Math.hypot(dx, dy);
    if (r < donutGeo.rInner || r > donutGeo.rOuter) {
      tipEl.classList.remove("show");
      return;
    }
    let ang = Math.atan2(dy, dx);
    // 세그먼트는 -PI/2 기준 시계방향 → 같은 좌표계로 정규화
    while (ang < -Math.PI / 2) ang += Math.PI * 2;
    const seg = donutSegments.find((s) => ang >= s.start && ang < s.end);
    if (!seg) {
      tipEl.classList.remove("show");
      return;
    }
    tipEl.innerHTML = `<i style="background:${seg.color}"></i>${seg.label} <b>${seg.pct}%</b>`;
    tipEl.style.left = e.clientX + 14 + "px";
    tipEl.style.top = e.clientY + 12 + "px";
    tipEl.classList.add("show");
  };
  cv.onmouseleave = (): void => tipEl.classList.remove("show");
}

/* ============ 역량 레이더 차트 ============ */
function drawRadar(): void {
  const cv = document.getElementById("radar") as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const cx = 110,
    cy = 110,
    R = 80;
  const data = DATA.skills,
    n = data.length;
  ctx.clearRect(0, 0, 220, 220);
  const light = !document.body.classList.contains("dark");
  const gridColor = light ? "rgba(30,41,59,.12)" : "rgba(255,255,255,.08)";
  for (let lvl = 1; lvl <= 4; lvl++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
        r = (R / 4) * lvl;
      const x = cx + r * Math.cos(a),
        y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  ctx.beginPath();
  data.forEach((d, i) => {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
      r = R * (d.value / 100);
    const x = cx + r * Math.cos(a),
      y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 220, 220);
  g.addColorStop(0, "rgba(99,102,241,.55)");
  g.addColorStop(1, "rgba(34,211,238,.45)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 2;
  ctx.stroke();
  data.forEach((d, i) => {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
      r = R * (d.value / 100);
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
  });
}

/* ============ 진로 로드맵 레이더 (현재 vs 목표) ============ */
function drawRoadmapRadar(): void {
  const cv = document.getElementById("roadmapRadar") as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const job = DATA.jobTargets.find((j) => j.id === roadmapJob);
  if (!job) return;
  const cx = 120,
    cy = 120,
    R = 86;
  const labels = DATA.skills.map((s) => s.label);
  const n = labels.length;
  ctx.clearRect(0, 0, 240, 240);
  const light = !document.body.classList.contains("dark");
  const gridColor = light ? "rgba(30,41,59,.12)" : "rgba(255,255,255,.08)";
  // 그리드
  for (let lvl = 1; lvl <= 4; lvl++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
        r = (R / 4) * lvl;
      const x = cx + r * Math.cos(a),
        y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  for (let i = 0; i < n; i++) {
    const a = ((Math.PI * 2) / n) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = gridColor;
    ctx.stroke();
  }
  const drawSeries = (
    values: number[],
    stroke: string,
    fill: string,
    width: number
  ): void => {
    ctx.beginPath();
    values.forEach((v, i) => {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2,
        r = R * (v / 100);
      const x = cx + r * Math.cos(a),
        y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  // 목표(점선 느낌의 외곽) → 현재(채움) 순서로 겹쳐 그림
  const target = labels.map((l) => job.target[l] || 0);
  const current = DATA.skills.map((s) => s.value);
  drawSeries(target, "#f59e0b", "rgba(245,158,11,.12)", 2);
  drawSeries(current, "#6366f1", "rgba(99,102,241,.45)", 2);
}

/* F-AD 관리자: 컨테이너 CPU/RAM 추이 선형 차트 (80% 초과 적색 경고) */
function drawAdminMonitor(): void {
  const cv = document.getElementById("adminMonitor") as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const W = cv.width,
    H = cv.height;
  const padL = 32,
    padR = 14,
    padT = 14,
    padB = 20;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  ctx.clearRect(0, 0, W, H);
  const css = (v: string, d: string): string =>
    getComputedStyle(document.body).getPropertyValue(v).trim() || d;
  const grid = css("--border", "#e3e8ef");
  const dim = css("--text-dim", "#6b7480");
  const envs = DATA.ideEnvs;
  const baseCpu = envs.length
    ? envs.reduce((s, e) => s + e.cpu, 0) / envs.length
    : 30;
  const baseRam = envs.length
    ? envs.reduce((s, e) => s + e.ram, 0) / envs.length
    : 40;
  const N = 12;
  const clamp = (n: number): number => Math.max(4, Math.min(98, Math.round(n)));
  const cpu: number[] = [],
    ram: number[] = [];
  for (let i = 0; i < N; i++) {
    cpu.push(clamp(baseCpu + 16 * Math.sin(i * 0.9) + (i === 8 ? 38 : 0)));
    ram.push(clamp(baseRam + 11 * Math.cos(i * 0.7)));
  }
  const X = (i: number): number => padL + (plotW / (N - 1)) * i;
  const Y = (v: number): number => padT + plotH * (1 - v / 100);
  ctx.strokeStyle = grid;
  ctx.fillStyle = dim;
  ctx.lineWidth = 1;
  ctx.font = "10px Inter, sans-serif";
  ctx.textAlign = "right";
  [0, 50, 100].forEach((v) => {
    const y = Y(v);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillText(String(v), padL - 6, y + 3);
  });
  // 80% 임계선 (적색 점선)
  ctx.save();
  ctx.strokeStyle = "#e5484d";
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(padL, Y(80));
  ctx.lineTo(W - padR, Y(80));
  ctx.stroke();
  ctx.restore();
  const line = (data: number[], color: string): void => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((v, i) =>
      i === 0 ? ctx.moveTo(X(i), Y(v)) : ctx.lineTo(X(i), Y(v))
    );
    ctx.stroke();
    data.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(X(i), Y(v), v > 80 ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = v > 80 ? "#e5484d" : color;
      ctx.fill();
    });
  };
  line(ram, "#6366f1");
  line(cpu, "#22b8cf");
}
