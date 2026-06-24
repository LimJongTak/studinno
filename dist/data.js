"use strict";
/* ============================================================
   STUDINNO 통합 플랫폼 - 중앙 데이터 (Mock)
   요구사항정의서 + 기능보완 9가지 전부 반영
   ============================================================ */
/* ===== 중앙 데이터 ===== */
const DATA = {
    // 현재 로그인 사용자 (SSO 서버 선택 결과 포함)
    user: {
        name: "김학생",
        role: "student",
        id: "20231234",
        avatar: "KH",
        servers: ["STUDINNO", "S.E.M.S"],
        linked: { gitlab: true, kaggle: true, sems: true },
    },
    // ===== 보완8: 역량 차트 (정방향 레이더) =====
    skills: [
        { label: "실무능력", value: 82 },
        { label: "코딩능력", value: 90 },
        { label: "프로젝트수", value: 70 },
        { label: "협업", value: 78 },
        { label: "문제해결", value: 85 },
        { label: "AI/데이터", value: 88 },
    ],
    // ===== 디지털 배지 지갑 (인증/포트폴리오) =====
    badges: [
        {
            name: "Python 마스터",
            icon: "🐍",
            date: "2026-03",
            type: "교과",
            issuer: "순천대 AI사업단",
            criteria: "Python 심화 교과 이수 + 실습 90점↑",
            score: 92,
            desc: "데이터 처리·모델링 실무 역량 인증 (Open Badges)",
        },
        {
            name: "산학PJT 우수상",
            icon: "🏆",
            date: "2026-05",
            type: "비교과",
            issuer: "㈜대한정밀",
            criteria: "산학프로젝트 정량·정성 평가 상위 10%",
            score: 95,
            desc: "스마트팩토리 불량검출 AI 프로젝트 기여 우수",
        },
        {
            name: "Kaggle 입상",
            icon: "📊",
            date: "2026-04",
            type: "대외",
            issuer: "Kaggle",
            criteria: "경진대회 상위 입상 (Top 5%)",
            score: 88,
            desc: "데이터 분석·모델 성능 대외 검증",
        },
        {
            name: "오픈소스 기여",
            icon: "🌿",
            date: "2026-02",
            type: "비교과",
            issuer: "순천대 AI사업단",
            criteria: "GitLab 커밋·머지 10건↑, 라이선스 준수",
            score: 80,
            desc: "형상관리 기반 협업·기여 역량 인증",
        },
    ],
    // ===== 보완3: 파일 열람권한 요청 목록 =====
    permRequests: [
        {
            id: "REQ-1",
            project: "PJT-001",
            file: "train.py",
            requester: "㈜대한정밀 (채용담당)",
            reason: "채용 평가를 위한 코드 검토",
            time: "10분 전",
            status: "pending",
        },
        {
            id: "REQ-2",
            project: "PJT-001",
            file: "결과보고서.pdf",
            requester: "최교수",
            reason: "성과 평가 목적",
            time: "1시간 전",
            status: "pending",
        },
    ],
    // ===== 산학프로젝트(RFP) + 보완3: 파일 열람 권한 =====
    projects: [
        {
            id: "PJT-001",
            title: "스마트팩토리 불량 검출 AI",
            company: "㈜대한정밀",
            status: "진행중",
            category: ["AI", "비전", "실무"],
            members: ["김학생", "이영희", "박민수"],
            progress: 65,
            files: [
                { name: "README.md", perm: "public" },
                { name: "train.py", perm: "private" },
                { name: "dataset.zip", perm: "private" },
                { name: "결과보고서.pdf", perm: "request" },
            ],
            ide: "gitlab", // 워크스페이스 IDE 연동
            license: "MIT",
            visibility: "private",
            req: { 실무능력: 85, 코딩능력: 88, 프로젝트수: 60, 협업: 75, 문제해결: 85, "AI/데이터": 92 },
            reqTags: ["#비전", "#AI", "#Python", "#제조"],
        },
        {
            id: "PJT-002",
            title: "지역 관광 추천 챗봇",
            company: "순천시청",
            status: "모집중",
            category: ["NLP", "챗봇"],
            members: ["정유진"],
            progress: 10,
            files: [{ name: "README.md", perm: "public" }],
            ide: "kaggle",
            license: "Apache-2.0",
            visibility: "private",
            req: { 실무능력: 78, 코딩능력: 82, 프로젝트수: 50, 협업: 80, 문제해결: 78, "AI/데이터": 85 },
            reqTags: ["#NLP", "#챗봇", "#Python"],
        },
        {
            id: "PJT-003",
            title: "탄소배출 예측 대시보드",
            company: "㈜그린테크",
            status: "완료",
            category: ["데이터", "시각화"],
            members: ["김학생", "최동훈"],
            progress: 100,
            files: [
                { name: "README.md", perm: "public" },
                { name: "dashboard.html", perm: "public" },
            ],
            ide: "gitlab",
            license: "MIT",
            visibility: "public",
            req: { 실무능력: 80, 코딩능력: 80, 프로젝트수: 55, 협업: 78, 문제해결: 80, "AI/데이터": 88 },
            reqTags: ["#데이터분석", "#시각화", "#Python"],
        },
    ],
    // ===== 지식재산권(IP) + 보완2: 공동출원 =====
    ip: [
        {
            id: "IP-001",
            title: "불량 검출 영상처리 알고리즘",
            type: "특허",
            status: "출원완료",
            owners: [
                { name: "김학생", type: "학생", share: 50 },
                { name: "㈜대한정밀", type: "기업", share: 50 },
            ],
            coApply: true, // 사업비 활용 → 공동출원
            tags: ["비전", "AI", "제조"],
        },
        {
            id: "IP-002",
            title: "관광 추천 NLP 모델 저작권",
            type: "저작권",
            status: "등록",
            owners: [{ name: "정유진", type: "학생", share: 100 }],
            coApply: false,
            tags: ["NLP", "추천"],
        },
    ],
    // ===== 보완1: 기업의 인재 검색 (해시태그/등급) =====
    talents: [
        {
            name: "김학생",
            major: "컴퓨터공학",
            coding: 90,
            practice: 82,
            tags: ["#Python", "#AI", "#비전"],
            projects: 5,
            skills: { 실무능력: 82, 코딩능력: 90, 프로젝트수: 70, 협업: 78, 문제해결: 85, "AI/데이터": 88 },
        },
        {
            name: "이영희",
            major: "데이터사이언스",
            coding: 85,
            practice: 88,
            tags: ["#데이터분석", "#시각화"],
            projects: 4,
            skills: { 실무능력: 88, 코딩능력: 85, 프로젝트수: 65, 협업: 84, 문제해결: 80, "AI/데이터": 86 },
        },
        {
            name: "박민수",
            major: "전자공학",
            coding: 78,
            practice: 75,
            tags: ["#임베디드", "#IoT"],
            projects: 3,
            skills: { 실무능력: 75, 코딩능력: 78, 프로젝트수: 55, 협업: 72, 문제해결: 74, "AI/데이터": 66 },
        },
        {
            name: "정유진",
            major: "AI융합",
            coding: 92,
            practice: 80,
            tags: ["#NLP", "#챗봇", "#Python"],
            projects: 6,
            skills: { 실무능력: 80, 코딩능력: 92, 프로젝트수: 80, 협업: 76, 문제해결: 88, "AI/데이터": 90 },
        },
    ],
    // ===== 보완9: 인프라 예약 (공유 개방 인프라) =====
    infra: [
        {
            id: "GPU-01",
            name: "GPU 워크스테이션 A100",
            type: "장비",
            location: "AI관 301",
            image: "https://picsum.photos/seed/studinno-gpu01/480/240",
        },
        {
            id: "GPU-02",
            name: "GPU 서버 RTX4090 x4",
            type: "장비",
            location: "AI관 302",
            image: "https://picsum.photos/seed/studinno-gpu02/480/240",
        },
        {
            id: "LAB-01",
            name: "3D 프린팅 랩",
            type: "공간",
            location: "창업관 1F",
            image: "https://picsum.photos/seed/studinno-lab01/480/240",
        },
        {
            id: "LAB-02",
            name: "스튜디오 (영상)",
            type: "공간",
            location: "미디어관 2F",
            image: "https://picsum.photos/seed/studinno-lab02/480/240",
        },
    ],
    // 예약 가능 시간 슬롯 (09~18시, 1시간 단위 시작 시각 / 마지막 블록 17:00~18:00)
    infraSlots: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    // 인프라 예약 신청 내역 (날짜·시간·목적 + 승인 상태)
    infraReservations: [
        {
            id: "RV-001",
            infraId: "GPU-01",
            infraName: "GPU 워크스테이션 A100",
            type: "장비",
            date: "2026-06-18",
            start: "10:00",
            end: "12:00",
            purpose: "불량검출 모델 학습 (A100 1장)",
            headcount: 1,
            requester: "김학생",
            status: "approved",
        },
        {
            id: "RV-002",
            infraId: "LAB-01",
            infraName: "3D 프린팅 랩",
            type: "공간",
            date: "2026-06-20",
            start: "13:00",
            end: "14:00",
            purpose: "시제품 출력 테스트",
            headcount: 3,
            requester: "이영희",
            status: "pending",
        },
    ],
    // ===== 팀구성 (보완4) =====
    teams: [
        {
            id: "T-001",
            name: "비전마스터즈",
            project: "스마트팩토리 불량 검출 AI",
            members: ["김학생", "이영희", "박민수"],
            recruiting: false,
            need: [],
        },
        {
            id: "T-002",
            name: "챗봇메이커",
            project: "지역 관광 추천 챗봇",
            members: ["정유진"],
            recruiting: true,
            need: ["프론트엔드", "기획"],
        },
    ],
    // ===== 관리자 (보완6: 성적 수동 수정) =====
    members: [
        { id: "20231234", name: "김학생", role: "학생", grade: "A", status: "활성" },
        { id: "20231235", name: "이영희", role: "학생", grade: "B+", status: "활성" },
        { id: "P001", name: "최교수", role: "교원", grade: "-", status: "활성" },
        { id: "C001", name: "㈜대한정밀", role: "기업", grade: "-", status: "승인대기" },
    ],
    adminLogs: [
        { time: "16:21", type: "가입", msg: "㈜대한정밀 기업 가입 신청" },
        { time: "15:40", type: "오류", msg: "AI 매칭엔진 응답 지연 (3.2s)" },
        { time: "14:10", type: "IP", msg: "IP-001 공개범위 변경 요청" },
    ],
    // ===== F-ID: 클라우드 IDE 환경 (Docker/K8s 컨테이너) =====
    ideEnvs: [
        {
            id: "ENV-01",
            name: "불량검출-AI 워크스페이스",
            stack: "Python",
            version: "3.11",
            provider: "jupyter",
            status: "running",
            cpu: 42,
            ram: 61,
        },
        {
            id: "ENV-02",
            name: "관광챗봇 NLP 노트북",
            stack: "Python",
            version: "3.10",
            provider: "kaggle",
            status: "running",
            cpu: 18,
            ram: 35,
        },
        {
            id: "ENV-03",
            name: "대시보드 프론트엔드",
            stack: "Node.js",
            version: "20 LTS",
            provider: "gitlab",
            status: "stopped",
            cpu: 0,
            ram: 0,
        },
    ],
    // ===== F-ID: 형상관리 커밋 로그 (GitLab 연동) =====
    commits: [
        {
            id: "a1b2c3d",
            project: "PJT-001",
            msg: "feat: 데이터 증강 파이프라인 추가",
            author: "김학생",
            time: "06-16 14:20",
            added: 48,
            removed: 6,
            diff: [
                {
                    file: "train.py",
                    lines: [
                        { type: "ctx", text: "  import torch" },
                        { type: "del", text: "  transform = base_transform" },
                        { type: "add", text: "  transform = augment_transform" },
                        { type: "add", text: "  transform.add(RandomFlip(0.5))" },
                    ],
                },
            ],
        },
        {
            id: "e4f5g6h",
            project: "PJT-001",
            msg: "fix: 추론 배치 사이즈 OOM 수정",
            author: "이영희",
            time: "06-15 18:02",
            added: 4,
            removed: 4,
            diff: [
                {
                    file: "infer.py",
                    lines: [
                        { type: "del", text: "  batch_size = 64" },
                        { type: "add", text: "  batch_size = 16" },
                    ],
                },
            ],
        },
        {
            id: "i7j8k9l",
            project: "PJT-001",
            msg: "docs: README 사용법·라이선스 명시",
            author: "박민수",
            time: "06-14 09:31",
            added: 22,
            removed: 0,
            diff: [
                {
                    file: "README.md",
                    lines: [
                        { type: "add", text: "## License" },
                        { type: "add", text: "This project is licensed under MIT." },
                    ],
                },
            ],
        },
    ],
    // ===== F-ID: GitLab 브랜치 =====
    branches: [
        { name: "main", project: "PJT-001", isDefault: true, ahead: 0, behind: 0, lastCommit: "feat: 데이터 증강 파이프라인 추가", updated: "06-16 14:20" },
        { name: "feature/augment", project: "PJT-001", isDefault: false, ahead: 3, behind: 1, lastCommit: "feat: RandomFlip 추가", updated: "06-16 15:02" },
        { name: "fix/oom", project: "PJT-001", isDefault: false, ahead: 1, behind: 0, lastCommit: "fix: 배치 사이즈 축소", updated: "06-15 18:02" },
        { name: "main", project: "PJT-002", isDefault: true, ahead: 0, behind: 0, lastCommit: "init: 관광챗봇 스캐폴딩", updated: "06-14 10:11" },
    ],
    // ===== F-ID: 머지 리퀘스트 =====
    mergeRequests: [
        {
            id: "MR-12", project: "PJT-001", title: "데이터 증강 파이프라인 도입", source: "feature/augment", target: "main",
            author: "김학생", status: "open", approvals: 1, approvalsNeeded: 2, comments: 3, changes: 4, added: 48, removed: 6, pipeline: "passed", time: "06-16 15:05", task: "K-3",
        },
        {
            id: "MR-11", project: "PJT-001", title: "추론 OOM 핫픽스", source: "fix/oom", target: "main",
            author: "이영희", status: "merged", approvals: 2, approvalsNeeded: 2, comments: 1, changes: 1, added: 4, removed: 4, pipeline: "passed", time: "06-15 18:30",
        },
        {
            id: "MR-13", project: "PJT-001", title: "[WIP] 모델 경량화 실험", source: "feature/quantize", target: "main",
            author: "박민수", status: "draft", approvals: 0, approvalsNeeded: 2, comments: 0, changes: 2, added: 22, removed: 3, pipeline: "running", time: "06-16 16:40",
        },
    ],
    // ===== F-ID: 이슈 =====
    issues: [
        { id: "#42", project: "PJT-001", title: "검증셋에서 false positive 다수 발생", label: "bug", assignee: "이영희", status: "open", comments: 5, time: "06-16 09:12" },
        { id: "#41", project: "PJT-001", title: "데이터 증강 옵션 설정 추가", label: "feature", assignee: "김학생", status: "open", comments: 2, time: "06-15 14:33" },
        { id: "#40", project: "PJT-001", title: "README 학습/추론 가이드 보강", label: "docs", assignee: "박민수", status: "closed", comments: 1, time: "06-14 11:20" },
        { id: "#39", project: "PJT-001", title: "GPU 메모리 누수 점검", label: "bug", assignee: "김학생", status: "closed", comments: 4, time: "06-13 17:05" },
    ],
    // ===== F-ID: CI/CD 파이프라인 =====
    pipelines: [
        {
            id: "#318", project: "PJT-001", branch: "feature/augment", commit: "a1b2c3d", status: "passed", duration: "3분 12초", time: "06-16 15:03",
            stages: [
                { name: "build", status: "passed" },
                { name: "test", status: "passed" },
                { name: "train", status: "passed" },
                { name: "deploy", status: "skipped" },
            ],
        },
        {
            id: "#317", project: "PJT-001", branch: "feature/quantize", commit: "b2c3d4e", status: "running", duration: "1분 40초", time: "06-16 16:41",
            stages: [
                { name: "build", status: "passed" },
                { name: "test", status: "running" },
                { name: "train", status: "skipped" },
                { name: "deploy", status: "skipped" },
            ],
        },
        {
            id: "#315", project: "PJT-001", branch: "main", commit: "e4f5g6h", status: "failed", duration: "2분 05초", time: "06-15 18:04",
            stages: [
                { name: "build", status: "passed" },
                { name: "test", status: "failed" },
                { name: "train", status: "skipped" },
                { name: "deploy", status: "skipped" },
            ],
        },
    ],
    // ===== F-ID(Kaggle): 경진대회·해커톤 =====
    competitions: [
        {
            id: "CMP-01", title: "제조 불량 이미지 분류 챌린지", host: "㈜대한정밀 · Kaggle", type: "경진대회", status: "진행중",
            metric: "Macro F1", startDate: "2026-06-01", deadline: "2026-07-15", prize: "₩500만 + 채용 우대",
            prizes: [
                { place: "🥇 1위", reward: "₩300만 + 정규직 채용 우대" },
                { place: "🥈 2위", reward: "₩150만 + 인턴 우대" },
                { place: "🥉 3위", reward: "₩50만" },
            ],
            participants: 128, joined: true,
            myTeam: { name: "순천AI팀", members: ["김학생", "이영희", "박민수"] },
            teamMin: 1, teamMax: 4, dailyLimit: 5, usedToday: 2, publicSplit: "Public 30% / Private 70%", phase: "진행",
            rules: [
                "외부 데이터 사용 금지 (제공 데이터셋만 허용)",
                "사전학습 가중치는 ImageNet에 한해 허용",
                "최종 제출은 팀당 2개 모델까지 선택 가능",
            ],
            tags: ["비전", "분류", "제조"], desc: "제조 라인에서 수집된 불량/정상 이미지를 분류하는 모델을 개발합니다. Macro F1으로 평가하며, 상위 입상팀에는 채용 우대를 제공합니다.",
            leaderboard: [
                { rank: 1, team: "VisionMasters", score: 0.942, entries: 27, change: 0, isMe: false, members: 4 },
                { rank: 2, team: "순천AI팀", score: 0.931, entries: 19, change: 2, isMe: true, members: 3 },
                { rank: 3, team: "딥러너스", score: 0.928, entries: 22, change: -1, isMe: false, members: 4 },
                { rank: 4, team: "데이터광부", score: 0.915, entries: 14, change: 1, isMe: false, members: 2 },
                { rank: 5, team: "모델공방", score: 0.902, entries: 9, change: -2, isMe: false, members: 1 },
            ],
        },
        {
            id: "CMP-02", title: "순천만 관광 수요 예측 해커톤", host: "순천시 · STUDINNO", type: "해커톤", status: "진행중",
            metric: "RMSE", startDate: "2026-06-28", deadline: "2026-06-30", prize: "₩300만 + 시장상",
            prizes: [
                { place: "🥇 대상", reward: "₩200만 + 순천시장상" },
                { place: "🥈 최우수", reward: "₩70만" },
                { place: "🥉 우수", reward: "₩30만" },
            ],
            participants: 64, joined: false,
            teamMin: 2, teamMax: 5, dailyLimit: 10, usedToday: 0, publicSplit: "실시간 Public 100% (해커톤)", phase: "모집",
            rules: [
                "팀 단위 참가 필수 (2~5명)",
                "48시간 내 모델 개발·제출 완료",
                "발표 심사 30% + 리더보드 70% 합산",
            ],
            tags: ["시계열", "회귀", "관광"], desc: "기상·이벤트·SNS 데이터를 활용해 순천만 일자별 방문객 수를 예측합니다. 48시간 해커톤 형식으로 진행되며 팀 단위 참가가 필수입니다.",
            leaderboard: [
                { rank: 1, team: "타임시리즈러버스", score: 184.2, entries: 11, change: 0, isMe: false, members: 4 },
                { rank: 2, team: "예측의신", score: 191.8, entries: 8, change: 1, isMe: false, members: 5 },
                { rank: 3, team: "관광로지스틱", score: 203.5, entries: 6, change: -1, isMe: false, members: 3 },
            ],
        },
        {
            id: "CMP-03", title: "한국어 리뷰 감성분석 경진대회", host: "Kaggle Community", type: "경진대회", status: "예정",
            metric: "Accuracy", startDate: "2026-08-01", deadline: "2026-08-20", prize: "메달 · 인증서",
            prizes: [
                { place: "🥇 Gold", reward: "Kaggle 금메달 + 인증서" },
                { place: "🥈 Silver", reward: "Kaggle 은메달" },
            ],
            participants: 0, joined: false,
            teamMin: 1, teamMax: 3, dailyLimit: 3, usedToday: 0, publicSplit: "Public 50% / Private 50%", phase: "모집",
            rules: ["8월 1일 데이터 공개", "팀 최대 3명", "사전 등록 시 데이터 우선 접근"],
            tags: ["NLP", "감성분석"], desc: "한국어 상품 리뷰의 긍/부정을 분류합니다. 8월 개최 예정이며 현재 사전 등록을 받고 있습니다.",
            leaderboard: [],
        },
        {
            id: "CMP-04", title: "탄소배출 예측 챌린지", host: "㈜그린테크 · Kaggle", type: "경진대회", status: "종료",
            metric: "MAE", startDate: "2026-05-01", deadline: "2026-05-30", prize: "₩200만",
            prizes: [{ place: "🥇 1위", reward: "₩200만" }],
            participants: 95, joined: true,
            myTeam: { name: "순천AI팀", members: ["김학생", "이영희"] },
            teamMin: 1, teamMax: 4, dailyLimit: 5, usedToday: 0, publicSplit: "Public 30% / Private 70%", phase: "발표",
            rules: ["종료된 대회입니다."],
            tags: ["회귀", "환경"], desc: "공정 데이터 기반 탄소배출량 예측. 종료된 대회입니다.",
            leaderboard: [
                { rank: 1, team: "그린마인즈", score: 12.4, entries: 30, change: 0, isMe: false, members: 3 },
                { rank: 8, team: "순천AI팀", score: 15.1, entries: 12, change: 0, isMe: true, members: 2 },
            ],
        },
    ],
    // ===== F-ID(Kaggle): 내 제출 이력 =====
    submissions: [
        { id: "SUB-3", comp: "CMP-01", team: "순천AI팀", file: "submission_effb3_tta.csv", score: 0.931, rank: 2, time: "06-16 13:40", status: "scored" },
        { id: "SUB-2", comp: "CMP-01", team: "순천AI팀", file: "submission_resnet50.csv", score: 0.918, rank: 4, time: "06-15 22:11", status: "scored" },
        { id: "SUB-1", comp: "CMP-04", team: "순천AI팀", file: "final_lgbm.csv", score: 15.1, rank: 8, time: "05-29 16:02", status: "scored" },
    ],
    // ===== F-PM: 워크스페이스 칸반 보드 =====
    kanban: [
        { id: "K-1", project: "PJT-001", title: "데이터셋 라벨링", assignee: "이영희", due: "06-20", col: "done" },
        { id: "K-2", project: "PJT-001", title: "베이스라인 모델 학습", assignee: "김학생", due: "06-22", col: "done" },
        { id: "K-3", project: "PJT-001", title: "데이터 증강 실험", assignee: "김학생", due: "06-25", col: "doing" },
        { id: "K-4", project: "PJT-001", title: "추론 속도 최적화", assignee: "박민수", due: "06-27", col: "doing" },
        { id: "K-5", project: "PJT-001", title: "최종 보고서 작성", assignee: "이영희", due: "07-02", col: "todo" },
        { id: "K-6", project: "PJT-001", title: "발표자료 제작", assignee: "박민수", due: "07-03", col: "todo" },
    ],
    // ===== F-PM: 결과물 공유 (스토리지 연동) =====
    deliverables: [
        { id: "D-1", project: "PJT-001", name: "중간보고서_v1.pdf", size: "2.4MB", by: "김학생", time: "06-10" },
        { id: "D-2", project: "PJT-001", name: "model_best.pt", size: "88MB", by: "김학생", time: "06-16" },
    ],
    // ===== F-CR: 역량 평가 (평가자용) =====
    evaluations: [
        {
            id: "EV-1",
            project: "PJT-003",
            student: "김학생",
            evaluator: "최교수",
            quant: 92,
            qual: "데이터 파이프라인 설계가 탄탄하고 협업 기여도가 높음.",
            badge: "산학PJT 우수상",
            done: true,
        },
        {
            id: "EV-2",
            project: "PJT-001",
            student: "김학생",
            evaluator: "㈜대한정밀 멘토",
            quant: 0,
            qual: "",
            badge: "",
            done: false,
        },
    ],
    // ===== F-AI: 진로 로드맵 타임라인 =====
    milestones: [
        { period: "2023.03", label: "입학 · 컴퓨터공학", type: "교과", done: true },
        { period: "2023.12", label: "Python 기초 이수", type: "교과", done: true },
        { period: "2024.06", label: "오픈소스 기여 배지", type: "인증", done: true },
        { period: "2024.12", label: "Kaggle 입상", type: "인증", done: true },
        { period: "2025.06", label: "스마트팩토리 산학PJT", type: "프로젝트", done: true },
        { period: "2026.02", label: "AI 엔지니어 인턴십", type: "프로젝트", done: false },
        { period: "2027.02", label: "졸업 · 취업 연계", type: "교과", done: false },
    ],
    // ===== F-AI: 목표 직무별 요구 역량 =====
    jobTargets: [
        {
            id: "ai-eng",
            name: "AI 엔지니어",
            target: { 실무능력: 90, 코딩능력: 95, 프로젝트수: 85, 협업: 80, 문제해결: 90, "AI/데이터": 95 },
        },
        {
            id: "backend",
            name: "백엔드 개발자",
            target: { 실무능력: 88, 코딩능력: 92, 프로젝트수: 80, 협업: 85, 문제해결: 88, "AI/데이터": 70 },
        },
        {
            id: "data-analyst",
            name: "데이터 분석가",
            target: { 실무능력: 85, 코딩능력: 80, 프로젝트수: 80, 협업: 80, 문제해결: 85, "AI/데이터": 92 },
        },
    ],
    // ===== F-AI: 학습 가이드 추천 (부족 역량 보완) =====
    learnRecs: [
        { title: "MLOps 실전 캡스톤", kind: "비교과", skill: "실무능력", gain: 8 },
        { title: "분산 시스템 설계", kind: "교과", skill: "문제해결", gain: 6 },
        { title: "협업형 오픈소스 스프린트", kind: "비교과", skill: "협업", gain: 10 },
        { title: "추천 시스템 프로젝트", kind: "비교과", skill: "프로젝트수", gain: 12 },
    ],
    // ===== F-MA: 알림함 (미확인 N 뱃지) =====
    notifs: [
        {
            id: "N-1",
            icon: "🤝",
            title: "AI 매칭: ㈜대한정밀 RFP가 회원님 역량과 92% 일치합니다.",
            time: "10분 전",
            read: false,
        },
        {
            id: "N-2",
            icon: "🏅",
            title: "디지털 배지 'Python 마스터'가 발급되었습니다.",
            time: "1시간 전",
            read: false,
        },
        {
            id: "N-3",
            icon: "📨",
            title: "㈜대한정밀(채용담당)이 train.py 열람을 요청했습니다.",
            time: "3시간 전",
            read: false,
        },
        {
            id: "N-4",
            icon: "✅",
            title: "GPU 워크스테이션 A100 예약이 승인되었습니다.",
            time: "어제",
            read: true,
        },
    ],
    // ===== F-MA: 데이터 대시보드 (기간별 교육성과·산업수요) =====
    dashboard: {
        "1m": {
            edu: [
                { label: "수료율", value: 88 },
                { label: "취업연계", value: 64 },
                { label: "프로젝트", value: 12 },
                { label: "배지발급", value: 47 },
            ],
            demand: [
                { label: "AI/데이터", value: 42, color: "#6366f1" },
                { label: "제조/비전", value: 26, color: "#22d3ee" },
                { label: "SW/플랫폼", value: 20, color: "#34d399" },
                { label: "기타", value: 12, color: "#f59e0b" },
            ],
        },
        "3m": {
            edu: [
                { label: "수료율", value: 84 },
                { label: "취업연계", value: 58 },
                { label: "프로젝트", value: 31 },
                { label: "배지발급", value: 126 },
            ],
            demand: [
                { label: "AI/데이터", value: 38, color: "#6366f1" },
                { label: "제조/비전", value: 30, color: "#22d3ee" },
                { label: "SW/플랫폼", value: 22, color: "#34d399" },
                { label: "기타", value: 10, color: "#f59e0b" },
            ],
        },
        "1y": {
            edu: [
                { label: "수료율", value: 81 },
                { label: "취업연계", value: 72 },
                { label: "프로젝트", value: 96 },
                { label: "배지발급", value: 412 },
            ],
            demand: [
                { label: "AI/데이터", value: 45, color: "#6366f1" },
                { label: "제조/비전", value: 24, color: "#22d3ee" },
                { label: "SW/플랫폼", value: 21, color: "#34d399" },
                { label: "기타", value: 10, color: "#f59e0b" },
            ],
        },
    },
    // ===== F-AD: 기업 회원 가입 승인 대기열 =====
    companySignups: [
        {
            id: "CS-1",
            company: "㈜대한정밀",
            biz: "123-45-67890",
            manager: "김부장",
            dept: "기술연구소",
            date: "2026-06-16",
            status: "pending",
        },
        {
            id: "CS-2",
            company: "그린테크㈜",
            biz: "210-88-44123",
            manager: "이과장",
            dept: "신사업팀",
            date: "2026-06-15",
            status: "pending",
        },
    ],
};
