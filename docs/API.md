# K-LabDoc 인증 API 명세

기본 경로: `/api` · 인증: `Authorization: Bearer <JWT>` · 요청/응답: `application/json`

## GET /api/health
서비스 상태 확인.
```json
{ "ok": true, "store": "postgres", "time": "2026-07-20T00:00:00.000Z" }
```

## GET /api/users
로그인 화면용 사용자 목록(PIN 미포함).
```json
{ "users": [ { "id": "u1", "name": "윤_진단", "role": "담당 전문의", "group": "전문의" } ] }
```

## POST /api/auth/login
ID + PIN 으로 로그인, JWT 발급. (Rate limit: 분당 20회)

요청:
```json
{ "id": "u1", "pin": "0000" }
```
응답 200:
```json
{ "token": "<JWT>", "user": { "id": "u1", "name": "윤_진단", "role": "담당 전문의", "group": "전문의" } }
```
오류: `400 missing_fields` · `401 invalid_credentials`

## GET /api/auth/me
토큰 소유자 정보. (인증 필요)
```json
{ "user": { "id": "u1", "name": "윤_진단", "role": "담당 전문의", "group": "전문의" } }
```

## POST /api/auth/change-pin
PIN 변경. (인증 필요, newPin 4자리 이상)
```json
{ "oldPin": "0000", "newPin": "2468" }
```
응답: `{ "ok": true }` · 오류: `400 weak_pin` · `401 invalid_credentials`

## POST /api/users
사용자 추가. (인증 필요 · **전문의** 권한)
```json
{ "id": "u7", "name": "박_담당", "role": "검사 담당자", "group": "임상병리사", "pin": "0000" }
```
응답: `{ "user": { "id":"u7", "name":"박_담당", "role":"검사 담당자", "group":"임상병리사" } }`
오류: `403 forbidden` · `409 duplicate_or_error`

## 토큰 페이로드
```json
{ "sub": "u1", "name": "윤_진단", "role": "담당 전문의", "group": "전문의", "iat": 0, "exp": 0 }
```

## curl 예시
```bash
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"id":"u1","pin":"0000"}'

TOKEN=... # 위 응답의 token
curl -s $BASE/api/auth/me -H "Authorization: Bearer $TOKEN"
```
