# Vercel 배포 순서 (정적 프론트 + API는 별도)

이 앱의 `npm run build`는 **브라우저에 번들되는 프론트만** 만듭니다. Postgres·Express API는 **다른 호스트**에서 돌아가야 합니다.

## 1. API 서버 준비 (먼저)

- [ ] `server/` Express를 Railway·Render·EC2 등에 배포하거나, 이미 있는 API URL을 확정한다.
- [ ] RDS 등 DB에 `DATABASE_URL` 연결, 마이그레이션 적용.
- [ ] API의 `CORS_ORIGIN`에 **Vercel 프론트 도메인**을 넣는다.  
  예: `https://baseball-scoreboard-one.vercel.app`, 로컬 개발용은 기존처럼 `http://localhost:5174`.

## 2. Vercel 프로젝트 설정

- [ ] Git 저장소 연결 후 **Production 브랜치** 확인 (보통 `main`).
- [ ] **Settings → General → Node.js Version**을 `20.x` (또는 `package.json`의 `engines`와 동일)로 맞춘다.
- [ ] **Settings → Environment Variables** → **Production**에 아래를 넣는다.

| Name | Value 예시 | 설명 |
|------|------------|------|
| `VITE_SCOREBOARD_API_BASE` | `https://api.example.com/api/scoreboard/game` | **끝에 슬래시 없이** API 베이스 전체 URL. |
| `VITE_DISABLE_SCOREBOARD_MOCK` | `true` | (선택) 로컬 문서용과 동일하게 맞추고 싶으면 설정. Production 빌드는 mock 미사용. |

Preview 배포에도 같은 API를 쓰면 **Preview** 환경에도 동일 변수를 넣거나, Preview 전용 API URL을 쓰면 그에 맞게 분리한다.

## 3. 배포·검증

- [ ] **Deployments**에서 최신 빌드가 성공하는지 확인.
- [ ] 브라우저에서 배포 URL → **개발자 도구 → Network**로 `.../api/scoreboard/game` 요청이 **1번에 설정한 API 호스트**로 가는지 확인.
- [ ] CORS 오류가 나면 API 쪽 `CORS_ORIGIN`에 정확한 Vercel URL(스킴 포함)을 추가한다.

## 참고

- `DATABASE_URL` / `PORT` / `CORS_ORIGIN` 은 **API 서버 쪽** 환경에만 필요하고, Vercel 프론트 빌드에는 보통 넣지 않는다.
- `vercel.json`의 `buildCommand`·`outputDirectory`·`/scoreboard` 라우팅은 저장소에 이미 있다.
