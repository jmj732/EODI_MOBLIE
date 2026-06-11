<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/

## Purpose
앱 비즈니스 로직 전체. `@/*` alias로 접근. API 클라이언트, 인증 스토어, 공유 컴포넌트, 타입 정의, 유틸리티 포함.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `api/` | axios 기반 API 함수 및 query key 팩토리 (see `api/AGENTS.md`) |
| `components/` | 공유 UI 컴포넌트 (see `components/AGENTS.md`) |
| `config/` | 환경변수 접근 레이어 (see `config/AGENTS.md`) |
| `stores/` | Zustand 상태 스토어 (see `stores/AGENTS.md`) |
| `types/` | TypeScript 타입 정의 (see `types/AGENTS.md`) |
| `utils/` | 순수 유틸리티 함수 (see `utils/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `@/` alias = `src/` — import 시 항상 `@/` 사용
- 새 API 엔드포인트: `api/` 아래 기존 파일에 추가하거나 새 파일 생성
- 새 타입: 도메인에 맞는 `types/` 파일에 추가

### Common Patterns
```tsx
import { apiClient } from "@/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { ItemSummary } from "@/types/item";
```

<!-- MANUAL: -->
