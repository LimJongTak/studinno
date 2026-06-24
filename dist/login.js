"use strict";
/* ============ 로그인 로직 ============ */
const selected = new Set(); // 선택된 서버
const ssoLinked = {
    gitlab: false,
    kaggle: false,
};
const hint = document.getElementById("serverHint");
const note = document.getElementById("ssoNote");
const loginGo = document.getElementById("loginGo");
/* --- SSO 버튼 (보완5: 자동 가입·연동) --- */
document.querySelectorAll(".sso-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const sso = btn.dataset.sso;
        ssoLinked[sso] = true;
        btn.innerHTML = `<span class="sso-ic">✅</span> ${sso === "gitlab" ? "GitLab" : "Kaggle"} 연동 완료`;
        btn.style.borderColor = sso === "gitlab" ? "#fc6d26" : "#20beff";
        note.innerHTML = `✅ ${sso === "gitlab" ? "GitLab" : "Kaggle"} 계정이 자동 가입·연동되었습니다.`;
    });
});
/* --- 서버 선택 (보완7) --- */
document
    .querySelectorAll(".server-opt input")
    .forEach((cb) => {
    cb.addEventListener("change", () => {
        cb.checked ? selected.add(cb.value) : selected.delete(cb.value);
        if (selected.size === 2)
            hint.textContent = "🎉 두 서버 모두 선택 — 양쪽 사업에 함께 참여합니다.";
        else if (selected.size === 1)
            hint.textContent = `선택됨: ${[...selected].join(", ")}`;
        else
            hint.textContent = "두 서버 모두 선택 시 양쪽 사업에 함께 참여합니다.";
    });
});
/* --- 로그인 실행 --- */
loginGo.addEventListener("click", () => {
    if (selected.size === 0) {
        hint.textContent = "⚠️ 참여할 서버를 1개 이상 선택해주세요.";
        hint.style.color = "var(--danger)";
        return;
    }
    // 선택 결과를 저장 → 대시보드 상단바 서버뱃지에 반영
    const servers = [...selected];
    localStorage.setItem("studinno-servers", JSON.stringify(servers));
    localStorage.setItem("studinno-sso", JSON.stringify(ssoLinked));
    localStorage.setItem("studinno-auth", "1"); // 인증 게이트 통과 플래그
    // 메인으로 이동 (index.html 은 상위 폴더)
    window.location.href = "../index.html";
});
