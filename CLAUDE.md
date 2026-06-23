# FitFutures App — Working Agreement

## Stack
Backend: FastAPI (Python 3.11), Supabase, Railway
Frontend: React 18 + TypeScript, Vite, Tailwind (PWA, dark only)
AI: OpenAI gpt-4o-2024-11-20 (Anthropic + Gemini fallback scaffolded)
Reminders: Twilio WhatsApp + Web Push (VAPID)

## Rules
1. Propose before implementing non-trivial changes
2. One logical change per diff
3. RLS enabled on every new table — never skip
4. All AI calls: timeout=30, max_retries=1
5. WhatsApp templates must be pre-approved before live send (avoid HTTP 400)
6. Never commit .env
7. Every new route needs a Pydantic schema
8. Dark theme only; mobile-first, test at 375px
9. GDPR: prospect/lead names default to initials/refs in UI

## Design tokens (non-negotiable)
bg #0D1117 | surface #161B22 | accent #00E5FF
success #3FB950 | warning #D29922 | danger #F85149
Inter, weights 400/500 only. Use Tailwind `brand.*` tokens — no raw hex.

## Scope discipline
MVP = Phases 1–7 only. Do NOT build Phases 8–10 until instructed.
Do NOT implement TrackWise or SOLID Coach features here.

## Naming
Components PascalCase.tsx | hooks usePascal.ts | routers snake_case.py

## This repo (fitfutures-web)
- `src/components/layout/` — AppShell, BottomNav, PageHeader
- `src/components/ui/` — RAGPill, ProgressBar, KPICard, etc. (built per phase)
- `src/pages/` — one file per screen
- `src/sw.ts` — custom service worker (push handler + Workbox precache)
- 5-tab bottom nav: Home · KPIs · Coach · Evidence · Profile.
  Units / Business / Completion are reached from Dashboard cards.

### Run locally
    npm install
    cp .env.example .env   # fill in values
    npm run dev            # http://localhost:5173
