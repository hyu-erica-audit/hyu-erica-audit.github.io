# ERICA 중앙감사위원회 홈페이지

한양대학교 ERICA 중앙감사위원회 공식 홈페이지입니다.

## 구조

- 정적 호스팅: GitHub Pages
- 데이터베이스: Firebase Firestore
- 파일 저장소: Firebase Storage
- 관리자 인증: Firebase Authentication

## 주요 관리 기능

- 공지사항
- FAQ
- 일정표
- 인사말
- 조직도
- 기여자
- 정기 감사 자료
- 감사보고서
- 회의록
- 중앙감사 세칙 및 별칙
- 서식 다운로드

## 운영

관리자는 `/admin/login.html`에서 로그인한 뒤 `/admin/index.html`에서 콘텐츠를 수정합니다.

Firestore Rules와 Storage Rules는 각각 `firestore.rules`, `storage.rules` 파일을 기준으로 Firebase 콘솔에 게시합니다.

## 연락처

- 제7대 중앙감사위원장 ehdgns709178@gmail.com
