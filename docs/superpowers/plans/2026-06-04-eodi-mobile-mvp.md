# EODI Mobile MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Expo mobile app shell for EODI with mobile auth, role-based navigation, and typed API foundations.

**Architecture:** Use Expo Router for route groups, TanStack Query for server state, Zustand for auth state, SecureStore for tokens, and axios for the API client. Start with working authentication and role-aware tabs, then add domain screens incrementally.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, axios, TanStack Query, Zustand, expo-secure-store, expo-web-browser, expo-linking.

---

## Chunk 1: Project Bootstrap And Auth Foundation

### Task 1: Scaffold Expo App

**Files:**
- Create: `package.json`
- Create: `app.config.ts`
- Create: `tsconfig.json`
- Create: `app/_layout.tsx`
- Create: `src/config/env.ts`

- [ ] Initialize Expo TypeScript project.
- [ ] Install runtime dependencies.
- [ ] Configure dev/prod scheme and API base URL.
- [ ] Verify TypeScript project loads.

### Task 2: Auth Storage And API Client

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/auth.ts`
- Create: `src/stores/auth-store.ts`
- Create: `src/types/auth.ts`

- [ ] Implement SecureStore token persistence.
- [ ] Implement mobile authorize/exchange/refresh/me/dev-login APIs.
- [ ] Add single-flight refresh handling for concurrent 401s.
- [ ] Add logout state cleanup.

### Task 3: Login And Role Navigation

**Files:**
- Create: `app/index.tsx`
- Create: `app/auth/callback.tsx`
- Create: `app/(user)/_layout.tsx`
- Create: `app/(teacher)/_layout.tsx`
- Create: `app/(admin)/_layout.tsx`

- [ ] Add login screen with BSM login and dev role login.
- [ ] Parse oneTimeToken from deep link callback.
- [ ] Route USER, TEACHER, ADMIN to their own tab groups.
- [ ] Add route guard for missing or mismatched roles.

### Task 4: Domain API Skeleton

**Files:**
- Create: `src/types/item.ts`
- Create: `src/types/common.ts`
- Create: `src/api/items.ts`
- Create: `src/api/rewards.ts`
- Create: `src/api/claims.ts`
- Create: `src/api/images.ts`

- [ ] Add endpoint wrappers and query key factories.
- [ ] Add image URL normalization.
- [ ] Add date helpers that preserve Korea date strings.

### Task 5: Verification

- [ ] Run TypeScript check.
- [ ] Run lint if configured.
- [ ] Start Expo dev server and report URL.
