<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/config/

## Purpose
환경변수 접근 단일 지점. `expo-constants`와 `EXPO_PUBLIC_*` 변수를 통합해 타입 안전하게 노출.

## Key Files

| File | Description |
|------|-------------|
| `env.ts` | `apiBaseUrl`, `appEnv`, `appScheme`, `authCallbackUrl`, `isDevApp` 익스포트 |

## For AI Agents

### Working In This Directory
- 환경변수 직접 접근 금지 — 반드시 `@/config/env.ts` 임포트
- 새 환경변수 추가 시 `app.config.ts` extra 섹션 + `env.ts` 동시 수정

### Common Patterns
```ts
import { apiBaseUrl, isDevApp, authCallbackUrl } from "@/config/env";

// dev 전용 UI 분기
if (isDevApp) { /* dev login 버튼 표시 */ }
```

<!-- MANUAL: -->
