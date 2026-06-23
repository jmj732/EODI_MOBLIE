<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/api/

## Purpose
모든 백엔드 HTTP 통신 레이어. axios 기반 `apiClient` + 도메인별 함수 + TanStack Query key 팩토리.

## Key Files

| File | Description |
|------|-------------|
| `client.ts` | axios 인스턴스 — Bearer 토큰 자동 첨부, 401 시 단일 refresh 흐름 |
| `auth.ts` | 인증 전용 client — BSM authorize, OTT 교환, refresh, devLogin, fetchMe |
| `items.ts` | 분실물 CRUD, 장소 조회, 폐기 관련 API + `itemKeys`/`placeKeys` |
| `claims.ts` | 회수 요청 생성/조회/승인/반려/취소 + `claimKeys` |
| `rewards.ts` | 상점 지급 요청/지급/이력 + `rewardKeys` |
| `images.ts` | 이미지 업로드 (`multipart/form-data`) |

## For AI Agents

### Working In This Directory
- 새 엔드포인트 추가 시 해당 도메인 파일에 함수 + query key 추가
- 인증 필요 API: `apiClient` 사용 (자동 토큰 처리)
- 인증 불필요 API (login/refresh): `auth.ts`의 별도 `authClient` 사용

### Common Patterns
```ts
// query key 팩토리 패턴
export const itemKeys = {
  all: ["items"] as const,
  search: (filters: ItemSearchParams) => ["items", "search", filters] as const,
  detail: (itemId: number) => ["items", "detail", itemId] as const,
};

// API 함수 패턴
export async function getItemDetail(itemId: number) {
  const response = await apiClient.get<ItemDetail>(`/items/${itemId}`);
  return response.data;
}
```

### Refresh 흐름
- 401 응답 → `refreshPromise` 단일 실행 (동시 401 중복 방지)
- refresh 성공: 새 토큰으로 원 요청 재시도
- refresh 실패: `clearSession()` → `RoleGate`가 로그인 화면으로 리다이렉트

## Dependencies

### Internal
- `src/config/env.ts` — `apiBaseUrl`
- `src/stores/auth-store.ts` — 토큰 읽기/쓰기

### External
- `axios ^1.17`

<!-- MANUAL: -->
