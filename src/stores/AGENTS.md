<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/stores/

## Purpose
Zustand 클라이언트 상태 스토어. 현재 인증 상태만 관리. 서버 상태는 TanStack Query 사용.

## Key Files

| File | Description |
|------|-------------|
| `auth-store.ts` | `useAuthStore` — accessToken, refreshToken, user, status + hydrate/setSession/clearSession |

## For AI Agents

### Working In This Directory
- 새 전역 클라이언트 상태 필요 시 이 디렉토리에 스토어 추가
- 서버 데이터는 스토어 금지 — TanStack Query 사용

### Auth Status 흐름
```
앱 시작 → status: "loading"
hydrate() 완료:
  토큰 있음 → status: "authenticated"
  토큰 없음 → status: "anonymous"
clearSession() → status: "anonymous" → RoleGate → "/" 리다이렉트
```

### Common Patterns
```ts
// 훅으로 구독
const { status, user } = useAuthStore();

// 인터셉터에서 직접 접근 (훅 외부)
const token = useAuthStore.getState().accessToken;
```

## Dependencies

### External
- `zustand ^5`
- `expo-secure-store` — 토큰 영속성

<!-- MANUAL: -->
