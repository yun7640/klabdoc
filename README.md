# K-LabDoc

**진단검사실 지침서(SOP) 생애주기 · 교육 · 인증 대응 통합관리 웹 대시보드**
2026년 진단검사 업무자동화 공모전(대한임상화학회) 출품작

K-LabDoc은 진단검사실의 업무지침서(SOP)를 **작성·개정·검토·승인**부터 **교육 이수**,
**최신 가이드라인 반영**, **진단검사의학재단 인증 대응**까지 하나의 화면에서 관리하는
로컬 우선(local-first) 대시보드입니다. 프론트엔드는 외부 CDN·빌드 과정이 없는 **단일 HTML 파일**이며,
로그인/사용자 계정은 **Railway에 배포되는 인증 서버(Node/Express + JWT)** 로 관리합니다.

---

## 주요 기능

- **지침서 생애주기 관리** — 문서번호·버전·발효일·검토만기, 초안→검토→승인 워크플로우, 검토·승인 전자서명(서명자·일시) 자동 기록, 작성·개정 이력 조회 및 개정 내용(diff) 확인
- **HWP/Word 가져오기** — 브라우저 내에서 HWP 5.0(OLE2·CFB + raw DEFLATE), Word(.docx), HWPX 파싱(서버 전송 없음), 원문 정규화
- **열람·검색** — 목차(TOC)·전문 검색·북마크, 섹션/문서 단위 인쇄(PDF)
- **시각 가이드** — 핵심 프로세스 순서도·요약표, 지침서 섹션과 상호 링크, 사용자 편집
- **맞춤 교육 과정** — 역할별(신입/인수인계/응급당직) 단계별 학습 + 퀴즈(만점 시 이수), 지침서 기반 퀴즈 자동 생성, 이수증 PDF
- **교육 이수 관리** — 개정 시 재숙지 자동 배정, 술기평가, 팀 이수 현황 리포트
- **최신 가이드라인 관리** — 법규·CLSI·학회 지침 개정 등록 → 영향 문서 반영 과제(반자동)
- **인증 대응** — 진단검사의학재단 점검표(운영·공통 + 개별 검사분야 10), 문항별 예/부분/아니오/해당없음 자체평가·준비도 점수, 현장실사 대응 패키지, CAPA·핵심지표·감사로그
- **로그인/계정(Railway 서버)** — 전문의/임상병리사 그룹, ID + PIN, JWT 토큰, PIN 변경, 관리자(전문의) 사용자 추가

## 아키텍처

```
브라우저 (public/index.html, 단일 파일 K-LabDoc)
        │  fetch /api/auth/login  (ID + PIN)
        ▼
Railway 인증 서버 (server/, Node/Express)
        │  JWT 발급 · 사용자 검증
        ▼
사용자 저장소  (DATABASE_URL 있으면 PostgreSQL, 없으면 메모리 폴백)
```

- 검사실 업무 데이터(지침서·교육·인증 등)는 **브라우저 localStorage**에 로컬 저장됩니다(개인정보 외부전송 최소화).
- **로그인/계정만** Railway 서버에서 중앙 관리합니다.
- 서버가 프론트엔드 정적 파일도 함께 호스팅하므로 Railway 서비스 1개로 배포됩니다.

## 빠른 시작 (로컬)

```bash
npm install
# (선택) 환경변수
cp .env.example .env       # JWT_SECRET 등 수정
npm start                  # http://localhost:3000
```

- 브라우저에서 `http://localhost:3000` → 로그인 화면 → 사용자 선택 + PIN(`0000`) → 대시보드.
- `public/index.html` 파일을 **그냥 더블클릭**해서 열면 서버 없이도 동작하며, 이때는 로컬 PIN(`0000`)으로 로그인합니다(오프라인 데모 모드).

## Railway 배포

자세한 단계는 [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md) 참고. 요약:

1. 이 저장소를 GitHub에 push
2. Railway → New Project → Deploy from GitHub repo
3. Variables 에 `JWT_SECRET`(긴 임의 문자열) 설정 · (선택) Postgres 플러그인 추가 시 `DATABASE_URL` 자동 주입
4. 배포 후 발급된 URL 접속 → 로그인

## 문서

- [`docs/TUTORIAL.md`](docs/TUTORIAL.md) — 실행·사용 튜토리얼
- [`docs/API.md`](docs/API.md) — 인증 API 명세
- [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md) — Railway 배포 가이드

## 보안·개인정보 주의

- 배포 시 `JWT_SECRET`을 반드시 임의의 긴 문자열로 설정하고, 시드 계정 PIN(`0000`)을 변경하세요.
- 저장소를 **공개(public)** 로 두는 경우, `public/index.html`에 포함된 예시 지침서(시드 데이터)에 기관 내부 대외비·환자 식별정보가 없는지 반드시 확인하고, 필요하면 비식별 데모 데이터로 교체하세요.

## 라이선스

MIT — [`LICENSE`](LICENSE)
