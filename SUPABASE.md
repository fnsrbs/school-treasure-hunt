# Supabase 게임 저장 기능

## 기존 구조와 변경 범위

Next.js App Router + React + TypeScript이며 `output: 'export'`로 정적 HTML을 생성한다.
`components/GameApp.tsx`가 화면과 게임 이벤트를 연결하고, `lib/game/engine.ts`가 게임 진행을 처리한다.
`services/gameStorage.ts`의 기존 localStorage 키와 버전 1 저장 형식을 유지했다.
AR 카메라/마커 인식, A* 경로, 지도, 힌트, 보물 배정, 6자리 쿠폰 생성 함수는 수정하지 않았다.

## 적용한 데이터베이스 변경

프로젝트의 public 스키마에는 기존 게임 테이블이 없었다. Supabase MCP로
`create_players_and_game_rpcs` 마이그레이션을 적용했다.
SQL 원본은 `supabase/migrations/202609080001_players.sql`이다.

`public.players`에는 요청한 8개 컬럼과 소유권 검증용 `player_token_hash`가 있다.
UUID/등록 시간/완료 전 기본값, 닉네임 필수 및 기존 10자 제한,
정규화 닉네임 UNIQUE, 쿠폰 UNIQUE 및 기존 6자리 형식,
완료 여부와 쿠폰·완료 시간의 일관성을 DB 제약으로 강제한다.
영문 대소문자와 JS trim에 해당하는 앞뒤 공백 처리를 DB 생성 컬럼에서도 수행한다.
`players_touch` 트리거는 닉네임을 정리하고 `updated_at`을 서버 시간으로 갱신한다.

공개 RPC는 다음 4개다.

- `nickname_available`: 정규화 닉네임 사용 가능 여부만 반환한다.
- `register_player`: 등록 후 플레이어 정보를 반환한다. 같은 비밀 토큰의 재요청은 같은 레코드를 반환한다.
- `complete_game`: UUID와 비밀 토큰으로 소유권을 검사하고 행 잠금 후 원자적으로 완료 처리한다. 이미 완료됐다면 저장된 쿠폰과 시간을 반환한다.
- `lookup_coupon`: 일치하는 쿠폰의 번호·닉네임·완료 여부·완료 시간만 반환한다.

RLS를 활성화하고 anon/authenticated/PUBLIC의 테이블 권한을 회수했다.
직접 접근을 허용하는 정책은 없으며, 기본 거부 상태에서 필요한 RPC의 EXECUTE만 허용한다.
SECURITY DEFINER 함수는 search_path를 고정하고 테이블을 완전한 스키마 이름으로 참조한다.
사용자별 256비트 무작위 토큰은 브라우저에 저장하고 DB에는 SHA-256 해시만 저장한다.
닉네임이나 UUID만으로 다른 사용자의 게임을 완료할 수 없다.

## 화면 처리 흐름

1. 새 게임: 입력 검증 → 재시도용 토큰 보관 → 닉네임 중복 확인 → DB 등록 → 기기 저장 → 기존 보물 배정 화면.
   진행 중에는 버튼과 입력을 잠그고 ref로 같은 이벤트 루프의 연속 클릭도 차단한다.
   사전 중복과 DB UNIQUE 충돌은 동일한 요청 문구를 표시한다. 네트워크 실패 시 게임을 시작하지 않는다.
2. 세 번째 보물 확정: 기존 엔진이 만든 쿠폰을 기기에 저장 → 완료 RPC → 서버 응답 저장.
   최종 보물 버튼도 저장 성공 후에만 이동한다. 실패 시 결과 화면에서 재시도할 수 있다.
   쿠폰 충돌일 때만 기존 생성 함수를 다시 호출하며 총 4회까지만 저장을 시도한다.
3. 쿠폰 조회: 홈의 작은 “쿠폰 조회” 버튼 → 입력값 trim → 조회 RPC → 필요한 네 가지 정보 표시.
   로딩 중 중복 요청을 차단하고 미등록/통신 오류를 구분한다.

기존 버전 1 저장도 읽을 수 있다. DB 정보가 없는 기존 탐험은 완료 저장 시 등록하고,
보물 진행과 기존 쿠폰 번호를 유지한다. 이미 다른 플레이어가 같은 닉네임을 등록했다면
임의로 그 레코드를 가져오지 않고 중복 오류를 표시한다.
기존 완료 저장도 서버 저장 전에는 결과 화면에서 확인을 거친다.
기기 저장이 삭제되면 소유권 토큰과 진행 상황은 복구되지 않는다. 쿠폰 번호를 알고 있다면 조회는 가능하다.

## 환경 변수

`.env.example`에는 다음 이름만 추가했으며 실제 값이 든 환경 변수 파일은 생성하지 않았다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase 프로젝트 Settings의 API URL과 공개 publishable key 또는 legacy anon key를 사용한다.
이 프로젝트의 기존 변수명 호환을 위해 publishable key도 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 넣는다.
service role key 또는 secret key는 사용하지 않는다.

Vercel Project Settings → Environment Variables에서 두 값을 Production/Preview 등에 설정한 후
재배포한다. Next.js 정적 빌드는 NEXT_PUBLIC 값을 빌드 시점에 포함하므로,
변경 후 반드시 다시 빌드해야 한다. 로컬 개발에서는 사용자가 `.env.local`을 설정하고 서버를 재시작한다.
개발 검증에는 MCP에서 확인한 공개 값을 프로세스 환경에만 전달했다.
Vercel에서는 두 변수가 없거나 공백이면 빌드를 중단하고 누락된 변수 이름을 안내한다.
로컬에서는 환경 변수 없이도 빌드할 수 있지만 등록·조회는 안내 오류를 표시한다.
추가 Supabase Auth 로그인/익명 로그인 설정이나 service role 설정은 필요 없다.

## 검증

- `pnpm test`: 24개 통과. A*, 실제 QR 픽셀 디코딩, AR 좌표/추적, 보물 3개 진행, 기기 저장,
  닉네임 검증/중복/네트워크 오류, 쿠폰 재시도 한도/멱등 응답, 조회 응답 제한을 포함한다.
- `pnpm typecheck`: 통과.
- `pnpm build`: 통과, 쿠폰 조회 포함 정적 경로 생성.
- `supabase/tests/players.sql`: 실제 Supabase에서 기본값, 공백·대소문자 중복,
  등록 재시도, 소유권, 완료 시간, 원자성/멱등성, 쿠폰 충돌, 일관성 제약,
  timestamp 트리거, anon 직접 접근 차단 및 RPC 호출을 검증했다. 테스트 전체를 롤백했다.
- `tests/players.browser.mjs`: Chrome headless에서 RPC 오류를 주입해 빈 입력/중복/오프라인,
  연속 클릭, 보물 3개 획득, 저장 실패·새로고침·재시도, 쿠폰 조회/미등록/오류,
  기존 버전 1 저장 데이터 호환성, 모바일 390px 및 데스크톱 1280px 가로 넘침을 확인한다.
- `tests/players.live-browser.mjs`: 실제 공개 API로 등록부터 게임 완료·새로고침·쿠폰 조회까지 통과.
  서버 레코드도 MCP로 확인했고 생성한 QA 플레이어 한 명만 삭제했다.
  재실행은 `RUN_LIVE_SUPABASE_TEST=1`로 명시적으로 활성화하며 출력된 QA ID만 정리한다.
- 프로젝트에 lint 스크립트는 없다. TypeScript와 기존 테스트 및 빌드로 검증했다.
- 실제 스마트폰 카메라로 현장에서 마커를 비추는 검증은 수행하지 않았다.
  자동화에서는 기존 QR/추적 테스트와 개발용 정답 마커 버튼을 이용했다.

기존 pnpm 설정의 esbuild 값이 불리언 대신 안내 문자열이어서 설치/테스트가 중단됐다.
`pnpm-workspace.yaml`의 해당 패키지 빌드 허용을 true로 수정했다.
Windows 샌드박스의 사용자 정보 조회 제한 때문에 테스트는 승인된 정상 환경에서 실행했다.

## 보안 검사와 범위

Supabase advisor의 “RLS Enabled No Policy”는 위의 기본 거부 설계에 따른 INFO다.
공개 SECURITY DEFINER RPC 경고도 필요한 4개 RPC를 공개한 데 따른 것으로,
소유권 검증·고정 search_path·출력 제한·테이블 접근 차단을 별도로 검증했다.
기존 `rls_auto_enable` 함수에 대한 경고는 이번 변경 전부터 있던 함수에 해당한다.
참고: [RLS 검사](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[공개 RPC 검사](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

현재 게임은 기존처럼 클라이언트에서 마커/보물 획득을 판정한다.
이번 기능은 서버 측 AR 판정 또는 부정행위 방지 시스템을 추가하지 않는다.
쿠폰 조회는 요청대로 번호를 아는 사람이 닉네임과 완료 정보를 조회할 수 있다.
쿠폰 사용/교환 처리나 관리자 로그인은 이번 범위에 포함하지 않는다.

## 파일 목록

- 추가: `.env.example`, `lib/supabase/client.ts`, `types/player.ts`,
  `services/players.ts`, `services/playerRegistration.ts`,
  `components/coupon/CouponLookup.tsx`, `SUPABASE.md`.
- 추가: `supabase/migrations/202609080001_players.sql`, `supabase/tests/players.sql`,
  `tests/players.test.ts`, `tests/players.browser.mjs`, `tests/players.live-browser.mjs`.
- 수정: `components/GameApp.tsx`, `types/game.ts`,
  `app/game/[screen]/page.tsx`, `app/globals.css`, `pnpm-workspace.yaml`.
