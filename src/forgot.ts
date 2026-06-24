/* ============ 비밀번호 찾기 (F-MB) ============
   유형·이메일 입력 → 이메일 인증 타이머 3:00 → 임시 비밀번호 발급 안내
   ※ 전역 스코프 충돌 방지를 위해 IIFE 로 격리 (인라인 핸들러 미사용).        */
(() => {
const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

let timer: number | null = null;
let remain = 0;
let verified = false;

const fSend = $<HTMLButtonElement>("fSend");
const fCheck = $<HTMLButtonElement>("fCheck");
const fNext = $<HTMLButtonElement>("fNext");
const fMsg = $("fMsg");
const fTimerEl = $("fTimer");

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function stopTimer(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
function startTimer(): void {
  stopTimer();
  remain = 180;
  fTimerEl.textContent = fmt(remain);
  fTimerEl.classList.remove("expired");
  timer = window.setInterval(() => {
    remain--;
    fTimerEl.textContent = fmt(remain);
    if (remain <= 0) {
      stopTimer();
      fTimerEl.textContent = "만료";
      fTimerEl.classList.add("expired");
      fMsg.textContent = "⏰ 인증 시간이 만료되었습니다. 다시 요청해주세요.";
      fMsg.className = "verify-msg err";
      fCheck.disabled = true;
    }
  }, 1000);
}

fSend.addEventListener("click", () => {
  const email = $<HTMLInputElement>("fEmail").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("fVerifyBox").hidden = false;
    fMsg.textContent = "올바른 이메일 형식을 입력해주세요.";
    fMsg.className = "verify-msg err";
    return;
  }
  verified = false;
  fNext.disabled = true;
  $("fVerifyBox").hidden = false;
  fCheck.disabled = false;
  $<HTMLInputElement>("fCode").value = "";
  fMsg.textContent = "발송된 인증번호를 입력해주세요. (데모: 아무 6자리)";
  fMsg.className = "verify-msg";
  fSend.textContent = "재요청";
  startTimer();
});

fCheck.addEventListener("click", () => {
  const code = $<HTMLInputElement>("fCode").value.trim();
  if (!/^\d{6}$/.test(code)) {
    fMsg.textContent = "인증번호 6자리(숫자)를 입력해주세요.";
    fMsg.className = "verify-msg err";
    return;
  }
  verified = true;
  stopTimer();
  fTimerEl.textContent = "✓";
  fMsg.textContent = "✅ 본인 인증이 완료되었습니다.";
  fMsg.className = "verify-msg ok";
  fCheck.disabled = true;
  fNext.disabled = false;
});

// 임시 비밀번호 생성 (영문 대/소문자 + 숫자 + 특수문자 보장)
function genTempPw(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digit + special;
  const pick = (set: string): string => set[Math.floor(Math.random() * set.length)];
  let pw = pick(upper) + pick(lower) + pick(digit) + pick(special);
  for (let i = 0; i < 4; i++) pw += pick(all);
  return pw;
}

fNext.addEventListener("click", () => {
  if (!verified) return;
  stopTimer();
  $("fTempPw").textContent = genTempPw();
  $("fStep1").hidden = true;
  $("fStep2").hidden = false;
});

$("fGo").addEventListener("click", () => {
  window.location.href = "login.html";
});
})();
