<div align="center">

# 🎓 STUDINNO 통합 플랫폼

**국립순천대학교 AI인재양성 부트캠프 사업단**
데이터 기반 교육·연구 허브 + **전주기(全週期) 산학 프로젝트 관리** 플랫폼

산업체 RFP 등록 → 수요 기반 매칭 → 팀 구성 → 프로젝트 수행 → 결과 공유
→ 실무 역량 인증(디지털 배지) → AI 인재 매칭/채용 연계 → 포트폴리오
**한 플랫폼에서 전 과정을 관리합니다.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-1.77-CC6699?logo=sass&logoColor=white)
![No Bundler](https://img.shields.io/badge/Bundler-none-lightgrey)
![Status](https://img.shields.io/badge/status-UI%2FUX%20prototype-success)

</div>

> ℹ️ **현재 범위**: 동작하는 화면(프런트엔드 UI/UX 목업)입니다.
> 데이터는 `localStorage` 기반 목업이며, 백엔드/실제 외부 연동은 향후 과제입니다.

---

## ✨ 주요 기능

| 화면 | 코드 | 핵심 기능 |
|---|---|---|
| 📊 **대시보드** | F-MA | 통합검색(자동완성)·알림함, AI 추천 산학과제, 데이터 대시보드(막대·도넛 차트, 호버 툴팁), 역량 레이더, 디지털 배지 지갑 |
| 🤝 **AI 매칭** | F-AI | 학생/기업 관점 토글, 6축 역량 `skillMatch`, RFP↔인재 양방향 랭킹, **JD 자유입력 매칭**, **대회 입상 가점** |
| 🏭 **산학프로젝트** | F-PM | RFP 등록·검색·상태 필터, 라이선스/공개범위, 파일 열람 권한, 워크스페이스 입장 |
| 🗂️ **워크스페이스** | F-PM | 칸반 보드(드래그 앤 드롭), 결과물 업로드, 프로젝트 완료 → 역량평가 연계 |
| 💻 **클라우드 IDE** | F-ID | 실습환경(Jupyter/Kaggle/GitLab), **GitLab 저장소**(브랜치·MR·이슈·CI/CD 파이프라인), 커밋 로그·Diff |
| 🏆 **경진대회·해커톤** | Kaggle | 대회 목록(경진대회/해커톤), **팀 단위 참가**, 리더보드(순위·인원·변동), 제출(일일 한도), 시상·규정·단계 |
| 👥 **팀구성 / 인재검색** | F-MB·F-AI | 팀 만들기·지원, 블라인드 평가, 관심 인재 찜, 입사 제안 |
| 🏅 **역량·포트폴리오** | F-CR | Open Badges 지갑, 역량 평가(정량·정성), 포트폴리오 PDF/공유, **대회 수상 실적 자동 집계** |
| 🧭 **진로 로드맵** | F-AI | 입학~졸업 타임라인, 현재 vs 목표 역량 레이더, 부족 역량 학습 가이드 |
| 📑 **지식재산권** | F-IP | 시맨틱 검색·카테고리, 상세 모달, 북마크, 유사 성과물 추천 |
| 🖥️ **인프라예약** | — | 장비/공간 카테고리, 달력 기반 예약 신청, 내 예약 관리 |
| ⚙️ **관리자** | F-AD | 운영 대시보드, 회원·프로젝트 관리, 배지 템플릿/회수, 컨테이너 CPU/RAM 모니터링, 승인 큐, 시스템 설정 |
| 🔐 **회원관리** | F-MB | 로그인(SSO·서버 선택), 회원가입(동적 폼·이메일 인증), 비밀번호 찾기 |

---

## 🔄 전주기 연계 흐름

각 단계의 활동이 다음 단계로 **자동 연결**되어 하나의 흐름을 이룹니다.

```
 RFP 등록 ─▶ AI 매칭 ─▶ 팀 구성 ─▶ 프로젝트 수행 ─▶ 경쟁 ─▶ 역량 인증 ─▶ 포트폴리오 ─▶ 채용 매칭
                                        │             │          │            │            │
                            MR 병합 → 커밋·칸반 완료   대회·팀     입상 → 배지   실적 집계   대회 우승팀
                                                      참가                                  매칭 가점
```

- **MR 병합** → 커밋 로그 반영 + 연결된 칸반 태스크 자동 완료
- **대회 입상(Top-3)** → 디지털 배지 자동 발급 → 포트폴리오 실적 + **인재 매칭 가점**

---

## 🛠️ 기술 스택

- **TypeScript** — `tsc`로 컴파일 (번들러 없는 **전역 스크립트** 방식, inline `onclick` 동작)
- **SCSS** — Dart Sass로 컴파일, 라이트/다크 테마 토큰
- **Canvas** — 레이더·도넛·라인 차트 직접 구현 (외부 차트 라이브러리 없음)
- **localStorage** — 상태 영속화(스키마 버전 관리)
- 의존성: `typescript`, `sass`, `http-server`, `npm-run-all` (런타임 의존성 0)

---

## 🚀 시작하기

### 요구사항
- Node.js 18+ / npm

### 설치 & 실행

```bash
# 1) 의존성 설치
npm install

# 2) 빌드 (TypeScript → dist, SCSS → css)
npm run build

# 3) 로컬 서버 실행 (http://localhost:8080)
npm run serve
```

> ⚡ 한 번에: `npm start` (빌드 후 서버 실행 및 브라우저 자동 오픈)

### 개발 모드 (파일 변경 감지 + 서버)

```bash
npm run dev   # tsc --watch + sass --watch + http-server 병렬 실행
```

### 기타 스크립트

| 명령 | 설명 |
|---|---|
| `npm run build:ts` / `build:css` | 개별 빌드 |
| `npm run smoke` | 헤드리스 스모크 테스트(전 페이지 렌더 검증) |
| `npm run clean` | `dist/` 정리 |

> 📦 `dist/`·`css/`(빌드 산출물)는 저장소에 포함되어 있어, **클론 후 빌드 없이도** 서버만 띄우면 바로 동작합니다. 소스 수정 시에만 재빌드가 필요합니다.

---

## 📁 프로젝트 구조

```
studinno-platform/
├── index.html            # SPA 진입점 (사이드바 네비 + 토픽바 + 모달 컨테이너)
├── pages/                # 별도 진입 페이지 (login / signup / forgot)
├── src/                  # TypeScript 소스 (전역 스크립트 모듈)
│   ├── data.ts           #  └ 중앙 목업 데이터 + 타입 정의
│   ├── main.ts           #  └ 라우팅·렌더·바인딩·부트스트랩
│   ├── pages.ts          #  └ PAGES 템플릿
│   ├── charts.ts         #  └ Canvas 차트
│   ├── repo.ts           #  └ GitLab 저장소(브랜치·MR·이슈·CI/CD)
│   ├── compete.ts        #  └ Kaggle 경진대회·해커톤
│   ├── ip.ts / admin.ts / infra.ts  # 도메인별 헬퍼
│   └── login.ts / signup.ts / forgot.ts
├── scss/                 # 스타일 소스 (style / login + 변수·믹스인)
├── dist/                 # 컴파일된 JS (생성물, 로드 대상)
├── css/                  # 컴파일된 CSS (생성물)
├── tools/                # 스모크 테스트 하네스
└── assets/               # 정적 리소스
```

### 아키텍처 메모

- 단일 페이지 앱(SPA). `render(page)`가 `app.innerHTML`을 채우고 `bindPageEvents(page)`로 이벤트를 연결, `goPage(page)`로 전환(스켈레톤 로딩 포함).
- 모든 `src/*.ts`는 **import/export 없는 전역 스크립트**로 컴파일되어 런타임 전역 스코프를 공유합니다.
- **스크립트 로드 순서**(`index.html`): `data → charts → infra → pages → ip → admin → repo → compete → main`
  (부트스트랩이 있는 `main.js`가 마지막).

---

## 📌 향후 과제

- 실제 REST API + DB 스키마, GitLab/Kaggle/Jupyter SSO 실연동
- 모달 접근성·반응형은 적용 완료, 번들러 도입은 전역 스크립트 구조상 보류

---

<div align="center">

**STUDINNO** · 국립순천대학교 AI인재양성 부트캠프 사업단
담당: 임종탁 (Platform 고도화)

</div>
