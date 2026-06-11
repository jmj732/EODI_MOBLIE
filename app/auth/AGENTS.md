<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-11 | Updated: 2026-06-11 -->

# app/auth/

## Purpose
BSM OAuth 콜백 처리. `eodi-dev://auth/callback` 딥링크 수신 후 토큰 교환.

## Key Files

| File | Description |
|------|-------------|
| `callback.tsx` | OAuth 콜백 화면 — oneTimeToken 파싱 → exchangeOneTimeToken → 세션 저장 → 리다이렉트 |

## For AI Agents

### Working In This Directory
- 이 화면은 직접 접근 불가 — WebBrowser 세션에서 딥링크로만 진입
- `WebBrowser.maybeCompleteAuthSession()` 은 `app/_layout.tsx`에서 호출

<!-- MANUAL: -->
