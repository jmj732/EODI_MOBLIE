<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# app/(teacher)/

## Purpose
TEACHER 역할 탭 그룹. 분실물 조회, 상점 지급, 지급 이력 확인 담당.

## Key Files

| File | Description |
|------|-------------|
| `_layout.tsx` | TEACHER 탭 레이아웃 — `RoleGate roles={["TEACHER"]}` 보호 |
| `find.tsx` | 분실물 찾기 — `(user)/find.tsx` 재사용 (`export { default }`) |
| `point.tsx` | 상점 지급 — 지급 대기 목록 조회 (giveReward 미구현) |
| `history.tsx` | 지급 로그 — 상점 지급 이력 목록 |
| `mypage.tsx` | 내 정보 — `ProfileScreen` 재사용 |

## For AI Agents

### Working In This Directory
- `point.tsx`에 `giveReward(itemId)` mutation 미구현 — 다음 작업
- 상점 API: `src/api/rewards.ts` — `getRewardRequests`, `giveReward`, `getRewardEligibleCount`

### Common Patterns
```tsx
// (user)/find.tsx 재사용
export { default } from "../(user)/find";
```

## Dependencies

### Internal
- `src/api/rewards.ts` — rewardKeys, giveReward
- `src/components/` — Screen, InfoCard, AppButton

<!-- MANUAL: -->
