<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# app/(admin)/

## Purpose
ADMIN 역할 탭 그룹. 분실물 CRUD, 회수 요청 승인/반려, 폐기 관리 담당.

## Key Files

| File | Description |
|------|-------------|
| `_layout.tsx` | ADMIN 탭 레이아웃 — `RoleGate roles={["ADMIN"]}` 보호 |
| `manage.tsx` | 물품 관리 — 목록 조회 + 등록/수정/삭제 CRUD, 장소 picker 모달 |
| `claims.tsx` | 회수 요청 — 대기 목록 + 승인/반려 mutation |
| `disposal.tsx` | 폐기 관리 — TO_BE_DISCARDED 목록 + 사유 등록/폐기 연장 |
| `mypage.tsx` | 내 정보 — `ProfileScreen` 재사용 |

## For AI Agents

### Working In This Directory
- 물품 CRUD: `src/api/items.ts` — `createItem`, `updateItem`, `deleteItem`, `getPlaces`
- 회수 요청: `src/api/claims.ts` — `approveClaim`, `rejectClaim`
- 폐기: `src/api/items.ts` — `submitDisposalReason`, `extendDisposal`, `getDisposalReason`
- mutation 후 반드시 `queryClient.invalidateQueries` 호출

### Common Patterns
```tsx
// mutation 성공 후 invalidate
const queryClient = useQueryClient();
const invalidate = () => void queryClient.invalidateQueries({ queryKey: itemKeys.all });

// 삭제 확인 Alert
Alert.alert("삭제 확인", `"${item.name}"을(를) 삭제하시겠습니까?`, [
  { text: "취소", style: "cancel" },
  { text: "삭제", style: "destructive", onPress: () => remove.mutate(item.id) },
]);
```

## Dependencies

### Internal
- `src/api/items.ts` — itemKeys, placeKeys, CRUD 함수
- `src/api/claims.ts` — claimKeys, approveClaim, rejectClaim
- `src/components/` — Screen, InfoCard, AppButton

<!-- MANUAL: -->
