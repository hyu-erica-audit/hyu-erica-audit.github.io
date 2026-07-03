# ERICA 중앙감사위원회 홈페이지

한양대학교 ERICA 중앙감사위원회 공식 홈페이지입니다. GitHub Pages 기반의 정적 웹사이트이며, 공지사항과 자료실 등 운영 콘텐츠는 Firebase에서 관리합니다.

## Maintainer Contact

홈페이지 유지보수나 인수인계가 필요한 경우 아래로 연락해주세요.

- E-Mail: dnacha4647@gmail.com

## 기술 구성

- 호스팅: GitHub Pages
- 데이터베이스: Firebase Firestore
- 파일 저장소: Firebase Storage
- 관리자 로그인: Firebase Authentication
- App 보호: Firebase App Check, reCAPTCHA Enterprise

## 폴더 구조

```text
.
├── admin/
│   ├── index.html          # 관리자 콘텐츠 관리 화면
│   └── login.html          # 관리자 로그인 화면
├── assets/
│   ├── components/         # 공통 navbar, footer HTML
│   ├── css/                # 페이지별/관리자 CSS
│   ├── images/             # 로고, 배경 이미지
│   └── js/
│       ├── firebase.js     # Firebase 초기화
│       ├── *-service.js    # Firestore/Storage 데이터 처리
│       ├── pages/          # 각 화면별 실행 스크립트
│       └── *-utils.js      # 공통 유틸리티
├── pages/
│   ├── ask/                # FAQ, 요청 관련 페이지
│   ├── audit/              # 감사 안내, 제출 가이드
│   ├── intro/              # 인사말, 조직도, 일정, 기여자
│   ├── notice/             # 공지사항 목록/상세
│   ├── resources/          # 규정, 서식 다운로드
│   └── results/            # 감사보고서, 회의록
├── firestore.rules         # Firestore 보안 규칙
├── storage.rules           # Storage 보안 규칙
├── firebase.json           # Firebase rules 배포 설정
├── .firebaserc             # Firebase 프로젝트 설정
├── index.html              # 메인 페이지
└── privacy.html            # 개인정보처리방침
```

## 주요 화면

- 메인: `index.html`
- 공지사항: `pages/notice/general.html`
- 공지 상세: `pages/notice/view.html`
- FAQ: `pages/ask/faq.html`
- 인사말: `pages/intro/greeting.html`
- 조직도: `pages/intro/org.html`
- 일정: `pages/intro/schedule.html`
- 감사 안내: `pages/audit/info.html`
- 제출 가이드: `pages/audit/submit-guide.html`
- 감사보고서: `pages/results/2025.html`, `pages/results/2026.html`
- 회의록: `pages/results/minutes.html`
- 규정: `pages/resources/rule.html`
- 서식 다운로드: `pages/resources/download.html`
- 관리자 로그인: `admin/login.html`
- 관리자 화면: `admin/index.html`

## 데이터 관리 구조

관리자 화면에서 입력한 콘텐츠는 Firebase 컬렉션에 저장됩니다.

- `notices`: 공지사항
- `faqs`: FAQ
- `schedules`: 일정
- `organizationMembers`: 조직도
- `contributorSections`: 기여자 섹션
- `contributors`: 기여자
- `siteContents/greeting`: 인사말
- `documents`: 감사 자료, 회의록, 규정, 서식

파일 업로드가 필요한 자료는 Firebase Storage의 `public/` 경로 아래에 저장됩니다.

## 운영 방법

1. `admin/login.html`에서 관리자 계정으로 로그인합니다.
2. `admin/index.html`에서 공지, FAQ, 일정, 조직도, 자료 등을 관리합니다.
3. 공개 여부는 각 콘텐츠의 상태값으로 관리합니다.
4. GitHub Pages 배포는 저장소에 push된 정적 파일을 기준으로 반영됩니다.
5. Firebase Rules 변경은 별도 배포가 필요합니다.
