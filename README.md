# 자원봉사자 출석체크 (고양국제박람회재단)

브라우저에서 바로 돌아가는 단일 페이지 웹앱. 기록은 구글 시트에 실시간 저장되고, 같은 주소를 연 모든 담당자에게 공유됨.

## 파일 구성

| 파일 | 역할 | 올리는 곳 |
|---|---|---|
| index.html | 프로그램 본체 (화면·기능 전부) | 깃허브 |
| sw.js | 오프라인 캐시 (한 번 열면 인터넷 없어도 열림) | 깃허브 |
| manifest.webmanifest | 폰 홈 화면 설치용 앱 정보(이름·색·아이콘) | 깃허브 |
| icon-192.png, icon-512.png | 앱 아이콘 | 깃허브 |
| icon-192-maskable.png, icon-512-maskable.png | 안드로이드 원형 아이콘용 | 깃허브 |
| apple-touch-icon.png | 아이폰 아이콘 | 깃허브 |
| Code.gs | 구글 시트 저장 스크립트 | 구글 Apps Script |
| README.md | 이 설명 | 깃허브 (선택) |

## 새로 설치하는 순서

### 1. 구글 시트 + 스크립트
1. sheets.google.com → 빈 스프레드시트 만들기
2. 메뉴 확장 프로그램 → Apps Script
3. 기존 코드 전부 지우고 Code.gs 내용 붙여넣기 → Ctrl+S
4. 배포 → 새 배포 → 유형 "웹 앱" → 실행: 나 / 액세스: **모든 사용자** → 배포 → 승인
5. 나온 웹 앱 URL(`https://script.google.com/macros/s/.../exec`) 복사

### 2. index.html에 시트 주소 넣기
index.html을 메모장으로 열어 `FIXED_API='https://script.google.com/...'` 부분의 주소를 1-5 주소로 바꾸고 저장.
(현재 파일에는 2026-09-12 배포 주소가 들어 있음. 같은 시트를 계속 쓰면 안 바꿔도 됨.)

### 3. 깃허브 페이지에 올리기
1. github.com → New repository → Public → Create
2. "uploading an existing file" → Code.gs 제외한 파일 전부 끌어다 놓기 → Commit
3. Settings → Pages → Branch `main` → Save
4. 1~2분 뒤 `https://아이디.github.io/저장소이름/` 접속

### 4. 폰 설치
크롬으로 주소 열기 → ⋮ → 앱 설치(홈 화면에 추가)

## 수정할 때 주의
- 스크립트(Code.gs)를 고친 뒤에는 **배포 → 배포 관리 → 연필 → 새 버전 → 배포**. "새 배포"로 하면 주소가 바뀌어서 index.html도 같이 바꿔야 함.
- index.html/sw.js를 고쳐서 올린 뒤 화면이 안 바뀌면 주소 뒤에 `?v=숫자`를 붙여 열기(캐시).
- 시트의 명단/출석/근무표/설정 탭은 프로그램이 관리하므로 직접 편집하지 말 것.

## 데이터
- 명단, 출석 기록, 근무표, 행사명 → 구글 시트
- 시트 주소는 index.html 안에 고정
- 백업: 명단 관리 → 백업 파일 저장(JSON). 복원은 시트 전체를 덮어씀.
