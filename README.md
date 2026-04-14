# LEVELUP — Personal Life Dashboard

A deeply gamified, self-hosted personal operating system. Built with Next.js 16, Supabase, Tailwind CSS v4, and Framer Motion.

---

## Setup Guide

### 1. Supabase — Run the Schema

1. Go to [supabase.com](https://supabase.com) and open your project dashboard.
2. Navigate to **SQL Editor → New query**.
3. Paste the full contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Click **Run**. This creates all tables, enables RLS, and sets up the `progress-photos` and `journal-photos` storage buckets.

### 2. Environment Variables

Your `.env.local` is already pre-filled. Double-check it has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://envnmbyyzmsmsarzxvxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

> **Security:** The service role key bypasses RLS — keep it server-side only (API routes only, never in client components). Rotate it if it was ever shared.

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app auto-creates a default user on first load.

### 4. Deploy to Vercel

```bash
npx vercel --prod
```

Or connect the repo in the Vercel dashboard and add these env vars under **Settings → Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Feature Overview

| Section | XP Awards | Highlights |
|---|---|---|
| **Dashboard** | — | Live stats, habit quick-check, XP feed |
| **Habits** | +15 per check, +50 perfect day | GitHub-style heatmap, streaks, grace days |
| **Body & Health** | +30 workout, +10 measurement | Charts, sleep log, water tracker |
| **Quests** | +150 per milestone | Monthly goals with epic completion screen |
| **Journal** | +20 per entry | Mood tracking, calendar view, full-text search |
| **Progress Photos** | +25 per upload | Side-by-side comparison |
| **Wins Board** | +20 per win | Masonry grid, star importance, gold glow |
| **Bucket List** | +100 on completion | Confetti burst on complete |
| **Character Sheet** | — | RPG stats (STR/VIT/INT/WIL/AGI), 16 badges, XP chart |
| **Settings** | — | Character name, height (for BMI), units, timezone |

## XP & Level System

- **Levels 1–5:** 0 / 500 / 1200 / 2500 / 4000 XP
- **Levels 6+:** each threshold = previous × 1.6
- **Level up:** full-screen confetti explosion + Web Audio chime + modal
- **Streaks:** +75 XP at 7 days, +300 XP at 30 days
- **Badges:** 13 earnable + 3 hidden secret badges

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework |
| Supabase | Postgres DB + File Storage |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations & transitions |
| Recharts | Charts (measurements, sleep, XP history) |
| canvas-confetti | Level up & quest complete effects |
| Lucide React | Icons |
| react-hot-toast | Toast notifications |
| date-fns | Date formatting & calculations |

## File Structure

```
levelup/
├── app/
│   ├── (dashboard)/        # All UI pages — share sidebar layout
│   │   ├── page.tsx        # Dashboard / home
│   │   ├── habits/page.tsx
│   │   ├── body/page.tsx
│   │   ├── quests/page.tsx
│   │   ├── journal/page.tsx
│   │   ├── photos/page.tsx
│   │   ├── wins/page.tsx
│   │   ├── bucket/page.tsx
│   │   ├── character/page.tsx
│   │   └── settings/page.tsx
│   ├── api/                # Route handlers (use service-role key)
│   │   ├── user/
│   │   ├── xp/
│   │   ├── habits/ + habits/log/
│   │   ├── body/ (measurements, workouts, sleep, water)
│   │   ├── quests/ + quests/milestones/
│   │   ├── journal/
│   │   ├── photos/
│   │   ├── wins/
│   │   ├── bucket/
│   │   ├── badges/
│   │   └── stats/
│   ├── layout.tsx          # Root layout (Inter font)
│   └── globals.css         # Dark theme, dot pattern, scrollbar
├── components/
│   ├── Providers.tsx       # App context (user, XP, toasts)
│   ├── Sidebar.tsx         # Desktop sidebar + mobile bottom bar
│   ├── XPToast.tsx         # Floating +XP notification
│   ├── LevelUpModal.tsx    # Full-screen level up celebration
│   ├── Modal.tsx           # Reusable modal wrapper
│   ├── StatBar.tsx         # RPG stat bar (STR/VIT etc.)
│   ├── EmptyState.tsx      # Empty state with CTA
│   ├── LoadingSkeleton.tsx # Loading placeholders
│   └── PageWrapper.tsx     # Fade-in page transition
├── hooks/
│   ├── useUser.ts
│   └── useXP.ts
├── lib/
│   ├── supabase.ts         # Supabase clients (anon + service-role)
│   ├── auth.ts             # getOrCreateUser (single-user mode)
│   ├── xp.ts               # XP values & labels
│   ├── levels.ts           # Level thresholds & titles
│   ├── badges.ts           # Badge definitions & display logic
│   └── utils.ts            # cn, formatDate, getGreeting, etc.
├── types/index.ts          # All TypeScript interfaces
└── supabase/
    └── schema.sql          # Full DB schema — run this first!
```
