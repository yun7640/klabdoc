# Railway 배포 가이드

## 사전 준비
- GitHub 계정(이 저장소가 push 되어 있어야 함)
- Railway 계정 (https://railway.app)

## A. GitHub 연동 배포 (권장)
1. 이 저장소를 GitHub에 push 합니다.
2. Railway 대시보드 → **New Project** → **Deploy from GitHub repo** → 이 저장소 선택.
3. Railway가 `package.json`을 감지해 Nixpacks로 자동 빌드하고 `node server/index.js`로 실행합니다
   (`railway.json` / `Procfile` 포함).
4. **Variables** 탭에서 환경변수 설정:
   - `JWT_SECRET` = 임의의 긴 문자열(필수)
   - `DEFAULT_PIN` = 초기 PIN(기본 `0000`, 선택)
   - `TOKEN_TTL` = 예 `8h` (선택)
5. **(선택) 사용자 영구 저장** — Project에 **New → Database → PostgreSQL** 추가.
   Railway가 `DATABASE_URL`을 자동 주입하며, 서버가 첫 실행 시 `users` 테이블 생성 + 시드합니다.
   Postgres를 추가하지 않으면 메모리 저장소로 동작(재배포 시 초기화)합니다.
6. **Settings → Networking → Generate Domain** 으로 공개 URL 생성.
7. 발급된 URL 접속 → 로그인 화면 → 사용자 + PIN(`0000`) → 대시보드.

## B. Railway CLI 배포
```bash
npm i -g @railway/cli
railway login
railway init            # 새 프로젝트
railway up              # 현재 폴더 배포
railway variables set JWT_SECRET=... DEFAULT_PIN=0000
railway add             # (선택) PostgreSQL 추가
railway domain          # 공개 도메인 생성
```

## 배포 후 점검
```bash
curl -s https://<your-app>.up.railway.app/api/health
# {"ok":true,"store":"postgres"|"memory", ...}
```

## 운영 체크리스트
- [ ] `JWT_SECRET` 설정 완료(기본값 경고 로그가 사라졌는지 확인)
- [ ] 시드 계정 PIN(`0000`) 변경 (마이페이지 또는 API `change-pin`)
- [ ] 필요 시 PostgreSQL 추가로 사용자 영구 저장
- [ ] 저장소 공개 전, 프론트 시드 지침서에 내부 대외비/환자정보가 없는지 확인
