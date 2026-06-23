<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# EODI Mobile

## Purpose
Expo React Native 앱. 학교 분실물 조회/회수 요청/폐기 관리/상점 지급 처리. 3개 역할(USER·TEACHER·ADMIN)별 탭 구조.

## Key Files

| File | Description |
|------|-------------|
| `app.config.ts` | Expo 설정 — 환경별 scheme/bundleId/appEnv 분기 |
| `package.json` | 의존성 및 스크립트 |
| `tsconfig.json` | TypeScript strict mode, `@/*` → `src/*` path alias |
| `eas.json` | EAS Build 프로파일 (development/preview/production) |
| `.env.example` | 환경변수 템플릿 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router 라우트 (see `app/AGENTS.md`) |
| `src/` | 앱 소스 코드 (see `src/AGENTS.md`) |
| `assets/` | 아이콘·스플래시 이미지 (see `assets/AGENTS.md`) |
| `docs/` | 기획 문서 및 구현 계획 (see `docs/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 코드 작성 전 반드시 Expo v56 문서 확인: https://docs.expo.dev/versions/v56.0.0/
- 새 패키지 추가 시 `expo install` 사용 (native 호환성 버전 고정)
- `@/*` alias는 `src/*`를 가리킴

### Testing Requirements
- `npm run typecheck` — TypeScript 오류 없어야 함
- `npm run web` — 웹 빌드 확인
- 실기기 테스트: `npm run dev-client` (tunnel 모드)

### Common Patterns
- 역할 기반 라우팅: `routeForRole(role)` in `src/components/role-gate.tsx`
- API 호출: `src/api/client.ts`의 `apiClient` (자동 토큰 첨부 + refresh)
- 서버 상태: TanStack Query (`useQuery` / `useMutation`)
- 인증 상태: Zustand `useAuthStore`

## Dependencies

### External
- `expo ~56.0.8` — React Native 플랫폼
- `expo-router ~56.2.8` — 파일 기반 라우팅
- `@tanstack/react-query ^5` — 서버 상태 관리
- `zustand ^5` — 클라이언트 상태 (auth)
- `axios ^1.17` — HTTP 클라이언트
- `expo-secure-store` — 토큰 보안 저장
- `expo-web-browser` — BSM OAuth 브라우저

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.
# userEmail
The user's email address is jaeminjo732@gmail.com.
# currentDate
Today's date is 2026-06-11.
