# CLAUDE.md

**LevelUp** — Next.js 16 gamified dashboard. Next.js App Router, React 19, Tailwind v4, Supabase.

@AGENTS.md

## Quick Start

```bash
npm run dev       # localhost:3000 (always running — don't restart)
npm run build     # Production build
npm run lint      # ESLint
```

No tests. Auth bypassed: `lib/auth.ts` hardcodes `DEFAULT_CLERK_ID = 'default_user'`.

## Key Architecture

**Request flow**: Client components fetch from `app/api/` on mount → API routes call `getServiceSupabase()` (service role key, bypasses RLS) → JSON response.

**Global state**: `components/Providers.tsx` wraps app with `AppContext`:
- `user`, `userLoading`, `refetchUser` (from `hooks/useUser.ts`)
- `totalXP`, `progress`, `recentEvents`, `awardXP`, `refetchXP` (from `hooks/useXP.ts`)

**To award XP**: Call `awardXP(reason)` from `useApp()`. The reason must exist in `lib/xp.ts:XP_VALUES`. This POSTs to `/api/xp`, updates state, fires toast, and triggers level-up modal if threshold crossed.

## Gamification

- **XP** (`lib/xp.ts`): `XP_VALUES` object maps activity reason → points; `getXPLabel(reason)` for display
- **Levels** (`lib/levels.ts`): `getXPProgress()` returns current level/progress; levels 1–5 hand-tuned, 6–100 scale ×1.6 exponentially
- **Badges** (`lib/badges.ts`): `BADGE_DEFINITIONS`; hidden badges in `SECRET_BADGE_REVEALS`
- **Character stats** (`str`, `vit`, `int`, `wil`, `agi`): computed at `/api/stats` from activity data, not stored in DB
- **Streaks**: checks if habit logged today; full per-habit streak logic could be implemented

## File Structure

- `lib/` — Supabase clients, XP/level/badge logic, auth, utils
- `components/` — Providers, Sidebar, modals, layout components (see `components/` directory)
- `hooks/` — useUser, useXP, useApp
- `types/index.ts` — all domain models (User, Habit, HabitLog, Workout, Quest, Journal, etc.)
- `app/page.tsx` — public landing page
- `app/(dashboard)/` — protected dashboard (shared layout mounts Providers + Sidebar)
- `app/api/` — API routes (see directory for full endpoint list)

## Common Patterns

**Adding XP**: Call `awardXP(reason)` from context. Reason key must exist in `lib/xp.ts:XP_VALUES`.

**Fetching data**: Client component + `useEffect` on mount to fetch from `/api/`, store in local state, refetch on mutations.

**Dates**: Use `lib/utils.ts:todayString()` for YYYY-MM-DD comparisons. `date-fns` for formatting.

**Database writes**: POST/PATCH via API routes. Service role key bypasses RLS.

## Notes

- Dev server always running at localhost:3000 — do not start/restart
- No tests; verify manually in browser
- Clerk installed but bypassed; all requests use default_user
- Dark theme (Tailwind + `globals.css`); icons via lucide-react; animations via framer-motion
- Photos: schema in DB but storage not yet implemented

### Environment variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Common patterns

**Adding XP for an action**: Call `awardXP(reason)` from `useApp()`. The reason key must exist in `lib/xp.ts:XP_VALUES`. This:
1. POSTs to `/api/xp` with the reason
2. Updates optimistic local state
3. Fires `XPToast` notification
4. Triggers `LevelUpModal` if threshold crossed
5. Refetches XP data from context

**Fetching data**: Pages fetch from API on mount with `useEffect`, store in local state, refetch on mutations. No server-side rendering.

**Dates**: Use `lib/utils.ts:todayString()` for date comparisons (YYYY-MM-DD format). Use `date-fns` for formatting.

**Database changes**: All writes through API routes (POST/PATCH). Service role key bypasses RLS, so no additional auth checks needed in API code. Client must trust API for permission checking.

### Notes

- Vercel is not currently configured for this project; project runs locally with npm run dev
- No tests exist; verify features manually in browser
- Clerk is installed but auth is bypassed; all requests use default_user
- Photos are stored in Supabase (storage_path in DB; not implemented yet, just schema)
- Theme: dark (Tailwind + custom colors in globals.css)
- Icons: lucide-react
- Animations: framer-motion
