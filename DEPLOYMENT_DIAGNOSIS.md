# 배포 사이트에서 players가 생성되지 않은 원인

## 확인된 원인

2026-09-08 진단 시 GitHub origin/main은
`025e4b2f7d3769507530fb7601a8bfa644e7b264`였다.
Supabase 연결 파일, 플레이어 서비스, 쿠폰 조회 화면은 로컬 미커밋 파일에만 있었다.
main의 start 함수는 `newGame → persist → navigate`만 실행하며 DB 요청이 없다.

`https://school-treasure-hunt-rho.vercel.app/`의 HTML과 연결된 JavaScript 7개를
확인했으며 `register_player`, `nickname_available`,
`school-treasure-hunt-pending-player` 코드가 없었다.
따라서 기존 배포에서 게임을 시작해도 Supabase에 저장되지 않는 것은
연동 전 코드가 배포된 상태였기 때문이다.

## 환경 변수와 요청 코드

로컬 연결 코드는 두 NEXT_PUBLIC 변수를 정적으로 참조하므로
Next.js가 빌드 시 브라우저 번들에 포함한다.
키/URL을 코드나 실제 환경 변수 파일에 추가하지 않았다.
로그인 후 Vercel 대시보드에서 두 변수 모두 Production에 등록되어 있음을 확인했다.
운영 배포는 변수 등록보다 앞선 025e4b2 커밋이었다. 변수 값은 이 문서에 노출하지 않는다.
배포된 기존 코드에는 이 변수를 사용하는 코드 자체가 없었다.

새 코드는 중복 확인 RPC → 등록 RPC → 성공 확인 → 게임 시작 순서로 처리한다.
공개 publishable key는 apikey 헤더로 보내고,
기존 anon JWT는 Authorization 헤더도 사용한다.
키나 URL의 실수로 입력된 앞뒤 공백은 제거한다.
Vercel 빌드에서 필수 환경 변수가 누락되면 빌드가 실패하도록 검증을 추가했다.

Vercel의 해당 프로젝트 Settings → Environment Variables에 아래 값을 등록한다.

- NEXT_PUBLIC_SUPABASE_URL: 해당 Supabase 프로젝트의 API URL.
- NEXT_PUBLIC_SUPABASE_ANON_KEY: 해당 프로젝트의 공개 publishable key 또는 anon key.

실제 배포 대상(Production, 필요한 경우 Preview)에 적용하고 새 main 커밋을 재배포한다.
service role 또는 secret key는 등록하지 않는다.

## RLS와 RPC 진단

players의 RLS는 활성화되어 있고 anon의 직접 INSERT는 차단되어 있다.
anon은 nickname_available 및 register_player RPC를 실행할 권한이 있다.
이 구조는 의도된 제한이며 RLS를 해제하거나 전체 INSERT 정책을 열 필요가 없다.
최근 Supabase API 로그에서 등록/중복 확인/완료/쿠폰 조회 RPC의 200 응답을 확인했다.
기존 실제 API 및 DB 검증 결과는 SUPABASE.md에 기록되어 있다.

## 수정 범위

로컬에서 검증한 Supabase 통합 변경을 main에 반영한다.
추가로 Vercel 빌드 환경 변수 검사와 연결 값의 공백 제거,
관련 회귀 테스트를 포함한다.
AR 인식, A*, 보물 배정, 지도, 힌트, 기존 쿠폰 번호 생성 방식은 변경하지 않는다.

## main 반영 전 검증

기존 게임 및 배포 설정 회귀 테스트 25개가 통과했다. VERCEL=1과 MCP에서 확인한
공개 연결 값을 프로세스 환경에 전달한 정적 빌드도 검증했다.
