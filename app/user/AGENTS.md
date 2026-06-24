<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# app/user/

## Purpose
USER 역할 탭 그룹. 분실물 검색/회수 요청, 내 요청 조회/취소 담당.

## Key Files

| File | Description |
|------|-------------|
| `_layout.tsx` | USER 탭 레이아웃 — `RoleGate roles={["USER"]}` 보호 |
| `find.tsx` | 분실물 찾기 — LOST 목록 + 회수 요청 모달 (visitDate 입력 → createClaim) |
| `claims.tsx` | 내 회수 요청 — 내 요청 목록 + PENDING 상태 취소 버튼 |
| `mypage.tsx` | 내 정보 — `ProfileScreen` 재사용 |

## For AI Agents

### Working In This Directory
- 회수 요청 생성: `createClaim(itemId, visitDate)` — visitDate는 `YYYY-MM-DD` 문자열
- 요청 취소: `cancelClaim(claimId)` — PENDING 상태만 가능
- mutation 성공 후 `claimKeys.my()` invalidate

### Common Patterns
```tsx
// find.tsx — 아이템 선택 후 모달에서 요청 제출
const claim = useMutation({
  mutationFn: () => createClaim(selectedItem!.id, visitDate),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: claimKeys.my() });
  },
});
```

## Dependencies

### Internal
- `src/api/claims.ts` — claimKeys, createClaim, cancelClaim
- `src/api/items.ts` — itemKeys, searchItems
- `src/components/` — Screen, InfoCard, AppButton

<!-- MANUAL: -->
