<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/components/

## Purpose
앱 전체에서 재사용되는 공유 UI 컴포넌트. 외부 UI 라이브러리 없이 React Native 기본 컴포넌트만 사용.

## Key Files

| File | Description |
|------|-------------|
| `screen.tsx` | `Screen` — ScrollView 래퍼, title/subtitle 헤더, 배경색 `#F8FAFC` |
| `info-card.tsx` | `InfoCard` — title/value/detail 표시용 카드, 테두리 `#E2E8F0` |
| `app-button.tsx` | `AppButton` — primary/secondary/danger 3가지 variant, loading 상태 |
| `role-gate.tsx` | `RoleGate` — 인증/역할 보호, `routeForRole()` 헬퍼 |
| `profile-screen.tsx` | `ProfileScreen` — 로그아웃 포함 내 정보 화면, mypage 탭 재사용 |

## For AI Agents

### Working In This Directory
- 새 공유 컴포넌트 추가 시 이 디렉토리에 작성
- 화면별 단독 컴포넌트는 해당 화면 파일 내 정의

### Common Patterns
```tsx
// AppButton variants
<AppButton title="확인" onPress={fn} />                    // primary (blue)
<AppButton title="취소" variant="secondary" onPress={fn} /> // gray
<AppButton title="삭제" variant="danger" onPress={fn} />    // red
<AppButton title="로딩" loading={isPending} onPress={fn} />

// InfoCard
<InfoCard title="물품명" value="갤럭시 버즈" detail="2026-06-01 · 3층 복도" />

// RoleGate
<RoleGate roles={["ADMIN"]}>
  <Tabs>...</Tabs>
</RoleGate>
```

## Dependencies

### Internal
- `src/stores/auth-store.ts` — RoleGate, ProfileScreen에서 사용

<!-- MANUAL: -->
