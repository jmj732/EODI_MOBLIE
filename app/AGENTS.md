<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# app/

## Purpose
Expo Router 라우트 디렉토리. 파일 경로 = URL 경로. 역할별 탭 2개(`user`, `admin`)와 인증 플로우(`auth/`)로 구성.

## Key Files

| File | Description |
|------|-------------|
| `_layout.tsx` | 루트 레이아웃 — QueryClientProvider, hydrate 호출, Stack 설정 |
| `index.tsx` | 로그인 화면 — BSM OAuth + dev role 로그인, 인증 후 역할별 리다이렉트 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `user/` | USER 역할 탭 (찾기·내 요청·내 정보) (see `user/AGENTS.md`) |
| `admin/` | ADMIN 역할 탭 (관리·회수요청·폐기·내 정보) (see `admin/AGENTS.md`) |
| `auth/` | OAuth 콜백 처리 (see `auth/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- 새 화면 추가 시 해당 역할 그룹 폴더에 파일 생성
- `_layout.tsx`의 `<Stack.Screen>` 등록 필요
- 역할 보호는 각 그룹 `_layout.tsx`의 `<RoleGate>` 담당

### Testing Requirements
- 각 역할로 dev 로그인 후 탭 전환 확인
- `RoleGate` — 잘못된 역할 접근 시 올바른 경로로 리다이렉트 확인

### Common Patterns
```tsx
// 역할별 진입점
routeForRole("USER")    // → "/user/find"
routeForRole("ADMIN")   // → "/admin/manage"
```

## Dependencies

### Internal
- `src/stores/auth-store.ts` — 인증 상태
- `src/components/role-gate.tsx` — 역할 보호 + 라우팅 헬퍼
- `src/config/env.ts` — `authCallbackUrl`, `isDevApp`

<!-- MANUAL: -->
