# DB(AWS RDS 등) — main 기준으로 맞추기

`dev` 브랜치를 **`main`에 머지하지 않는다**는 팀 규칙이 있을 때, Sean이 `dev`에서 한 **DB 작업**과 **main**의 관계는 아래와 같다.

## 1. Git 상으로 무엇이 맞는가

- Sean 커밋(`b0a1e37`, `6bd3b58` 등)에서 추가한 **Prisma 마이그레이션 폴더**(`20260320191839_*`, `20260320192008_*`, `20260320194128_*` …)는 **`main`에도 동일한 SQL이 이미 들어 있다** (공통 이름의 `migration.sql`은 `main`과 `origin/dev`가 같다).
- **`main`만** `PitchRecord.team`용 마이그레이션(`20260321140000_pitchrecord_team`)이 더 있다. 앱의 투수 기록 기능과 맞추려면 **RDS에도 `main` 기준으로 마이그레이션을 적용**해야 한다.
- 따라서 **`dev`를 `main`에 머지할 필요가 없고**, DB는 **`main`의 `prisma/migrations` + `prisma/schema.prisma`를 단일 소스**로 보면 된다.

## 2. AWS RDS에 스키마 반영하기

1. RDS(Postgres) 생성 후, **보안 그룹**에서 API 서버(또는 배포 환경)에서 `5432`로 접근 가능하게 연다.
2. **연결 문자열**을 환경 변수에 넣는다.  
   - 예: `postgresql://USER:PASSWORD@RDS_HOST:5432/DBNAME?schema=public&sslmode=require`
3. API가 읽는 `.env` 또는 호스트 환경에 **`DATABASE_URL`** 로 위 값을 설정한다.
4. **마이그레이션 적용** (배포 서버나 CI에서, `DATABASE_URL`이 RDS를 가리킬 때):

   ```bash
   npx prisma migrate deploy
   ```

   또는 저장소 스크립트:

   ```bash
   yarn db:migrate:deploy
   ```

5. Express API(`server/index.ts`)는 `localhost`가 아닌 URL에 대해 **SSL**을 쓰도록 이미 되어 있다. RDS는 보통 TLS를 요구하므로 `sslmode=require` 등이 URL에 포함되는 것이 좋다.

## 3. 자주 나는 오류

| 증상 | 원인 |
|------|------|
| `column "team" does not exist` | RDS에 `PitchRecord.team` 마이그레이션이 아직 적용되지 않음 → `migrate deploy` 실행 |
| `500` + DB 에러 | `DATABASE_URL` 오타, 보안 그룹, RDS가 아닌 다른 DB를 가리킴 |
| Prisma `P1012` `DATABASE_DIRECT_URL` | Prisma 설정에 `directUrl`만 넣고 환경 변수는 비운 경우. **Neon 풀러 전용**일 때만 필요하며, 일반 RDS는 `DATABASE_URL`만으로도 충분한 경우가 많다. |

## 4. 정리

- **DB 스키마·마이그레이션**: `main`만 따른다.
- **`dev` 전체 머지**: 하지 않는다.
- **RDS**: `DATABASE_URL` + `yarn db:migrate:deploy` (또는 `npx prisma migrate deploy`).

프론트(Vercel)와 API 분리 배포는 [vercel-deploy-steps.md](./vercel-deploy-steps.md)를 참고한다.
