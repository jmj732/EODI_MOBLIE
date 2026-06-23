<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/types/

## Purpose
앱 전체 TypeScript 타입 정의. 런타임 코드 없음 — 타입만.

## Key Files

| File | Description |
|------|-------------|
| `auth.ts` | `Role`, `AuthUser`, `MobileTokenResponse`, `DevLoginRequest` 등 인증 타입 |
| `item.ts` | `ItemSummary`, `ItemDetail`, `ItemStatus`, `ItemCategory`, `ClaimRequest` 등 분실물/요청 타입 |
| `reward.ts` | `RewardRequest`, `RewardHistoryItem`, `RewardEligibleResponse` 등 상점 타입 |
| `common.ts` | 공통 타입 |
| `env.d.ts` | `EXPO_PUBLIC_*` 환경변수 타입 선언 |

## For AI Agents

### Working In This Directory
- 새 API 응답 타입은 도메인에 맞는 파일에 추가
- 백엔드 응답 구조 변경 시 여기만 수정하면 전체 적용

### Key Types
```ts
type Role = "ADMIN" | "TEACHER" | "USER"
type ItemStatus = "LOST" | "GIVEN" | "TO_BE_DISCARDED" | "DISCARDED"
type ItemCategory = "전자기기" | "의류" | "액세서리" | "기타"
type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED"
```

<!-- MANUAL: -->
