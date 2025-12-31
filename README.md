![HANYANG UNIVERSITY ERICA](https://img.shields.io/badge/HANYANG_UNIVERSITY_ERICA-CENTRAL_AUDIT_COMMITTEE-003E7E?style=for-the-badge&logo=hanyanguniversity&logoColor=white)

한양대학교 에리카 중앙감사위원회 공식 홈페이지 프로젝트입니다.

외부 서버나 데이터베이스 없이 **GitHub Pages**를 이용하여 정적으로 호스팅 되며, 누구나 쉽게 유지보수할 수 있도록 설계되었습니다.

- **공식 도메인:** [https://hyu-audit.kr](https://hyu-audit.kr)
- **도메인 소유자:** 제7대 중앙감사위원장
- **개발 및 운영:** 제7대 중앙감사위원회

---

## 🛠️ 기술 스택 (Tech Stack)

- **HTML5 / CSS3**
- **Bootstrap 5.3** (반응형 레이아웃 및 UI 컴포넌트)
- **Vanilla JavaScript** (공지사항 데이터 관리 및 동적 렌더링)
- **GitHub Pages** (웹 호스팅)

---

## 📂 폴더 구조 (Project Structure)

```text
ERICA-Audit-Committee/
├── index.html              # 메인 페이지
├── privacy.html            # 약관 페이지
├── CNAME                   # 도메인 설정 파일 (삭제 금지)
├── README.md               # 해당 파일
├── assets/                 # 정적 리소스 폴더
│   ├── components/         # 상단, 하단 바
│   ├── css/                # 스타일시트 (style.css)
│   ├── js/                 # 스크립트 (main.js, notice_data.js)
│   ├── docs/               # 세칙과 학칙 등 문서
│   └── images/             # 이미지 파일 모음
└── pages/                  # 서브 페이지 모음
```

---

## 📖 유지보수 매뉴얼 (Maintenance Guide)

### 1. 공지사항 추가/수정 방법

데이터 파일을 직접 수정하고 push 해야합니다.

assets/js/notice_data.js에 주석을 참고하세요

### 2. 이미지 교체

assets/images 에서 이름을 같게 하여 교체하세요

### 3. 세칙, 학칙 파일 교체

assets/docs에 문서 넣고

pages/resources/rule.html에서 아래쪽 script 확인

각주 참고해서 파일 이름 정확히 일치시키기

### 4. 인스타그램 링크 교체

assets/components/에 있는 footer, navbar 파일에서

인스타그램 링크 부분 수정

---

## 📞 문의 (Contact)

유지보수나 코드에 대한 문의가 있을 경우 아래로 연락 바랍니다.

제작자: 제7대 중앙감사위원장 여동훈

Email: ehdgns709178@gmail.com
