<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# src/utils/

## Purpose
순수 유틸리티 함수. 부수효과 없음, 외부 의존성 최소화.

## Key Files

| File | Description |
|------|-------------|
| `date.ts` | 날짜 문자열 처리 — 한국 날짜 형식 유지 헬퍼 |
| `image.ts` | 이미지 URL 정규화 — 상대경로를 절대 URL로 변환 |

## For AI Agents

### Working In This Directory
- 날짜는 `YYYY-MM-DD` 문자열 유지 (Date 객체 변환 지양)
- 이미지 URL: `apiBaseUrl` 기준 정규화

<!-- MANUAL: -->
