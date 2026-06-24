"use strict";
/* ============ 회원가입 위저드 (F-MB) ============
   약관 동의 → 유형 선택 → 정보 입력(이메일 인증 3:00 + PW 유효성) → 완료
   ※ 모든 src/*.ts 는 단일 전역 스코프로 타입체크되므로, 식별자 충돌을
      막기 위해 IIFE 로 격리한다. signup.html 은 인라인 핸들러를 쓰지 않음.   */
(() => {
    const TYPE_LABEL = {
        student: "학생",
        prof: "교원",
        company: "기업",
    };
    let curStep = 1;
    let signupType = null;
    let emailVerified = false;
    let codeTimer = null;
    let codeRemain = 0;
    const $ = (id) => document.getElementById(id);
    /* ---------- 단계 이동 ---------- */
    function showStep(n) {
        curStep = n;
        document.querySelectorAll(".step-panel").forEach((p) => {
            p.hidden = p.dataset.panel !== String(n);
        });
        document.querySelectorAll(".step-bar .step").forEach((s) => {
            const sn = Number(s.dataset.step);
            s.classList.toggle("active", sn === n);
            s.classList.toggle("done", sn < n);
        });
    }
    /* ---------- STEP 1: 약관 동의 ---------- */
    const agreeAll = $("agreeAll");
    const agrees = Array.from(document.querySelectorAll(".agree"));
    const toStep2 = $("toStep2");
    function refreshAgree() {
        const required = agrees.filter((a) => a.dataset.req === "1");
        const allReqChecked = required.every((a) => a.checked);
        agreeAll.checked = agrees.every((a) => a.checked);
        toStep2.disabled = !allReqChecked;
    }
    agreeAll.addEventListener("change", () => {
        agrees.forEach((a) => (a.checked = agreeAll.checked));
        refreshAgree();
    });
    agrees.forEach((a) => a.addEventListener("change", refreshAgree));
    toStep2.addEventListener("click", () => showStep(2));
    /* 약관 보기 모달 */
    const docOverlay = $("docOverlay");
    const docBox = $("docBox");
    document.querySelectorAll(".agree-view").forEach((b) => {
        b.addEventListener("click", () => {
            const doc = b.dataset.doc || "약관";
            docBox.innerHTML = `
      <div class="modal-head"><h3>${doc}</h3><button class="modal-x" id="docClose">✕</button></div>
      <p class="modal-desc">본 ${doc}은(는) STUDINNO 플랫폼 이용에 적용됩니다. (데모용 요약)</p>
      <div class="doc-body">
        <p>제1조 (목적) 본 약관은 STUDINNO 통합 플랫폼이 제공하는 산학협력·지식재산권·인프라 예약 서비스의 이용 조건을 규정합니다.</p>
        <p>제2조 (회원의 의무) 회원은 학사·산학 활동 관련 정보를 정확히 제공하며, 타인의 권리를 침해하지 않습니다.</p>
        <p>제3조 (개인정보) 수집된 정보는 인재 매칭·역량 인증·산학 연계 목적에 한해 활용됩니다.</p>
      </div>
      <div class="modal-actions"><button class="btn primary" id="docOk">확인</button></div>`;
            docOverlay.classList.add("show");
            $("docClose").addEventListener("click", () => docOverlay.classList.remove("show"));
            $("docOk").addEventListener("click", () => docOverlay.classList.remove("show"));
        });
    });
    docOverlay.addEventListener("click", (e) => {
        if (e.target === docOverlay)
            docOverlay.classList.remove("show");
    });
    /* ---------- STEP 2: 유형 선택 ---------- */
    const toStep3 = $("toStep3");
    document.querySelectorAll(".type-card").forEach((card) => {
        card.addEventListener("click", () => {
            document.querySelectorAll(".type-card").forEach((c) => c.classList.remove("active"));
            card.classList.add("active");
            signupType = card.dataset.type;
            $("typeNote").hidden = signupType !== "company";
            toStep3.disabled = false;
        });
    });
    $("back1").addEventListener("click", () => showStep(1));
    toStep3.addEventListener("click", () => {
        buildDynamicFields();
        $("typeTag").textContent = signupType ? `· ${TYPE_LABEL[signupType]}` : "";
        showStep(3);
        validateStep3();
    });
    /* ---------- STEP 3: 동적 폼 + 검증 ---------- */
    function buildDynamicFields() {
        const host = $("dynamicFields");
        let html = "";
        if (signupType === "student") {
            html = `
      <div class="fld"><label class="field-label">학번</label>
        <input class="input dyn-req" id="suStudentId" placeholder="20231234" autocomplete="off" /></div>
      <div class="fld"><label class="field-label">학과</label>
        <input class="input dyn-req" id="suDept" placeholder="컴퓨터공학과" autocomplete="off" /></div>`;
        }
        else if (signupType === "prof") {
            html = `
      <div class="fld"><label class="field-label">소속</label>
        <input class="input dyn-req" id="suDept" placeholder="컴퓨터공학과 / AI사업단" autocomplete="off" /></div>`;
        }
        else if (signupType === "company") {
            html = `
      <div class="fld"><label class="field-label">회사명</label>
        <input class="input dyn-req" id="suCompany" placeholder="㈜대한정밀" autocomplete="off" /></div>
      <div class="fld"><label class="field-label">사업자등록번호</label>
        <input class="input dyn-req" id="suBiz" placeholder="123-45-67890" autocomplete="off" /></div>
      <div class="fld"><label class="field-label">담당부서</label>
        <input class="input dyn-req" id="suDept" placeholder="기술연구소" autocomplete="off" /></div>`;
        }
        host.innerHTML = html;
        host
            .querySelectorAll(".dyn-req")
            .forEach((i) => i.addEventListener("input", validateStep3));
    }
    /* 이메일 인증 타이머 3:00 */
    const sendCode = $("sendCode");
    const checkCode = $("checkCode");
    const verifyMsg = $("verifyMsg");
    function fmtTime(s) {
        const m = Math.floor(s / 60);
        return `${m}:${String(s % 60).padStart(2, "0")}`;
    }
    function stopTimer() {
        if (codeTimer !== null) {
            clearInterval(codeTimer);
            codeTimer = null;
        }
    }
    function startTimer() {
        stopTimer();
        codeRemain = 180;
        const el = $("codeTimer");
        el.textContent = fmtTime(codeRemain);
        el.classList.remove("expired");
        codeTimer = window.setInterval(() => {
            codeRemain--;
            el.textContent = fmtTime(codeRemain);
            if (codeRemain <= 0) {
                stopTimer();
                el.textContent = "만료";
                el.classList.add("expired");
                verifyMsg.textContent = "⏰ 인증 시간이 만료되었습니다. 다시 요청해주세요.";
                verifyMsg.className = "verify-msg err";
                checkCode.disabled = true;
            }
        }, 1000);
    }
    sendCode.addEventListener("click", () => {
        const email = $("suEmail").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            verifyMsg.textContent = "올바른 이메일 형식을 입력해주세요.";
            verifyMsg.className = "verify-msg err";
            $("verifyBox").hidden = false;
            return;
        }
        emailVerified = false;
        $("verifyBox").hidden = false;
        checkCode.disabled = false;
        $("suCode").value = "";
        verifyMsg.textContent = "발송된 인증번호를 입력해주세요. (데모: 아무 6자리)";
        verifyMsg.className = "verify-msg";
        sendCode.textContent = "재요청";
        startTimer();
        validateStep3();
    });
    checkCode.addEventListener("click", () => {
        const code = $("suCode").value.trim();
        if (!/^\d{6}$/.test(code)) {
            verifyMsg.textContent = "인증번호 6자리(숫자)를 입력해주세요.";
            verifyMsg.className = "verify-msg err";
            return;
        }
        emailVerified = true;
        stopTimer();
        $("codeTimer").textContent = "✓";
        verifyMsg.textContent = "✅ 이메일 인증이 완료되었습니다.";
        verifyMsg.className = "verify-msg ok";
        checkCode.disabled = true;
        validateStep3();
    });
    /* 비밀번호 실시간 유효성 */
    const pw = $("suPw");
    const pw2 = $("suPw2");
    function pwRules(v) {
        return {
            len: v.length >= 8,
            alnum: /[A-Za-z]/.test(v) && /\d/.test(v),
            special: /[^A-Za-z0-9]/.test(v),
        };
    }
    function pwValid(v) {
        return Object.values(pwRules(v)).every(Boolean);
    }
    function refreshPw() {
        const rules = pwRules(pw.value);
        document.querySelectorAll("#pwCheck li").forEach((li) => {
            li.classList.toggle("ok", rules[li.dataset.rule]);
        });
        const m = $("pwMatch");
        if (!pw2.value) {
            m.textContent = "";
            m.className = "pw-match";
        }
        else if (pw.value === pw2.value) {
            m.textContent = "✅ 비밀번호가 일치합니다.";
            m.className = "pw-match ok";
        }
        else {
            m.textContent = "❌ 비밀번호가 일치하지 않습니다.";
            m.className = "pw-match err";
        }
        validateStep3();
    }
    pw.addEventListener("input", refreshPw);
    pw2.addEventListener("input", refreshPw);
    /* 가입 버튼 활성 조건 */
    function validateStep3() {
        const nameOk = $("suName").value.trim() !== "";
        const dynOk = Array.from(document.querySelectorAll("#dynamicFields .dyn-req")).every((i) => i.value.trim() !== "");
        const pwOk = pwValid(pw.value) && pw.value === pw2.value && pw2.value !== "";
        $("signupGo").disabled = !(nameOk && dynOk && emailVerified && pwOk);
    }
    $("suName").addEventListener("input", validateStep3);
    $("back2").addEventListener("click", () => showStep(2));
    /* ---------- 가입 완료 ---------- */
    $("signupGo").addEventListener("click", () => {
        const name = $("suName").value.trim();
        const record = {
            name,
            type: signupType,
            email: $("suEmail").value.trim(),
            dept: ($("suDept") || {}).value || "",
        };
        localStorage.setItem("studinno-signup", JSON.stringify(record));
        stopTimer();
        const isCompany = signupType === "company";
        // 기업 가입 → 관리자 승인 대기열(localStorage)에 적재 → 앱의 관리자 화면에 표시
        if (isCompany) {
            const today = new Date().toISOString().slice(0, 10);
            const entry = {
                id: "CS-" + Date.now(),
                company: ($("suCompany") || {}).value.trim() || name,
                biz: ($("suBiz") || {}).value.trim() || "-",
                manager: name,
                dept: ($("suDept") || {}).value.trim() || "-",
                date: today,
                status: "pending",
            };
            try {
                const q = JSON.parse(localStorage.getItem("studinno-company-signups") || "[]");
                q.unshift(entry);
                localStorage.setItem("studinno-company-signups", JSON.stringify(q));
            }
            catch (e) {
                localStorage.setItem("studinno-company-signups", JSON.stringify([entry]));
            }
        }
        $("doneIc").textContent = isCompany ? "🕒" : "🎉";
        $("doneTitle").textContent = isCompany
            ? "가입 신청이 접수되었습니다"
            : `${name}님, 가입을 환영합니다!`;
        $("doneMsg").innerHTML = isCompany
            ? "기업 회원은 <b>관리자 승인</b> 후 이용할 수 있습니다.<br/>승인 완료 시 이메일로 안내드립니다."
            : "이제 SSO 계정을 연동하고 STUDINNO를 시작해보세요.";
        showStep(4);
    });
    $("doneGo").addEventListener("click", () => {
        window.location.href = "login.html";
    });
    /* 초기 진입 */
    showStep(1);
    refreshAgree();
})();
