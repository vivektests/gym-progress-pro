# Gym Progress Pro Web — Implementation Plan

## Scope

Build a separate full-stack web companion for Gym Progress Pro. The mobile app remains untouched and is not used as a source checkout. The web app uses the initialized React/Express/tRPC/Drizzle starter, Manus OAuth for account access, and the managed MySQL database for user-owned training data.

## Product architecture

- **Authentication:** Preserve the starter's Manus OAuth callback, CSRF-bound state nonce, `webdev_app_session` cookie, Preview bearer fallback, and protected tRPC procedures.
- **Persistence:** Extend `drizzle/schema.ts` with user-scoped splits, exercises, workouts, workout exercises, and sets. Every read/write procedure scopes by the authenticated user ID. The standard exercise library is represented as seeded, non-owned records; custom exercises are owned by the creator.
- **API:** Add a typed tRPC router for dashboard summaries, split CRUD, custom exercise CRUD, workout start/save/complete, history, chart series, and progression recommendations. Keep recommendation logic deterministic and transparent: compare the latest completed performance with the previous comparable performance and suggest a small load or rep increase only when the prior target was completed with stable volume.
- **Frontend:** Replace the example page with a responsive app shell: left rail on desktop, compact bottom navigation on mobile, authenticated dashboard, split manager, workout logger, progress view, searchable history, and settings/logout. Use React Query through the existing tRPC client, Recharts for charts, and the supplied UI primitives where useful.
- **Testing:** Add Vitest coverage for recommendation calculations and user-scoping helpers, plus a smoke-style API test around the health endpoint and key route manifest. Run typecheck, tests, production build, and inspect Preview render/route manifest.
- **Deployment:** Keep the initialized container deployment (`Dockerfile`, `/api/health`), add a build-safe route manifest, commit/push the web project checkpoint to the canonical `main`, then publish permanently and report the confirmed URL.

## Project structure

- `client/src/App.tsx` — route map and app providers.
- `client/src/pages/` — dashboard, workout, splits, progress, history, settings, and 404 screens.
- `client/src/components/` — app shell, shared cards, charts, and workout controls.
- `client/src/lib/` — tRPC client and display utilities.
- `server/routers.ts` — protected application API.
- `server/db.ts` — typed database queries and user-scoped data access.
- `drizzle/schema.ts` and `drizzle/` — domain schema and migrations.
- `public/manus-routes.json` — complete client page route manifest.
- `app.config.ts` — project logo metadata.

## Design direction

The product uses a **performance editorial** visual language: an ink-dark canvas, warm paper cards, and a single high-visibility ember orange for action and progress. The layout feels like a training log upgraded into a command center rather than a generic SaaS dashboard.

- **Core principles:** high signal, coach-like clarity, tactile logging, and visible momentum.
- **Color philosophy:** charcoal grounds the serious training context; warm off-white keeps long logging sessions readable; ember orange marks action; muted sage/blue accents encode recovery and trend states.
- **Layout paradigm:** a fixed navigation rail and asymmetric content canvas with a dominant “today” panel, stacked metric cards, and a narrow activity feed; on mobile the rail becomes a bottom action bar.
- **Signature elements:** oversized session numbers, thin measurement rules, and orange “progress marks” used in buttons, chart highlights, and completion states.
- **Interaction:** fast defaults, inline edits, clear completion feedback, and no modal required for the primary set-logging path.
- **Animation:** restrained 150–220ms transitions for cards and chart reveals; no looping decoration; completed sets get a brief color/scale confirmation.
- **Typography:** system sans for utility text paired with a condensed display face via CSS fallbacks for headings; strong numeric hierarchy and tabular metric alignment.
- **Brand essence:** a focused training companion for lifters who want their next session to be obvious. Personality: direct, disciplined, encouraging.
- **Voice:** “Make the next set count.” / “You’re building a pattern, not chasing a number.”
- **Wordmark/mark:** a compact `GP` monogram built from two offset measurement bars, paired with the Gym Progress Pro wordmark.
- **Signature brand color:** ember orange `#F97316`.

## Data model

- `users` — supplied Manus identity records.
- `exercises` — standard or user-owned movement definitions.
- `splits` — named training schedules owned by a user.
- `split_days` — ordered days within a split, with focus labels.
- `split_day_exercises` — ordered exercise prescriptions for a day.
- `workouts` — started/completed sessions owned by a user and optionally tied to a split day.
- `workout_exercises` — exercise instances and target metadata for a workout.
- `workout_sets` — set number, weight, reps, RPE, completion, and notes.

## Required behavior

All private screens require a real Manus-authenticated user. A user can create/edit/delete their own splits and custom exercises, start a workout from a split day, log sets, complete the workout, see searchable history, inspect progress charts, and receive recommendation cards computed from their prior records. Standard exercises are available without duplicating them into every user account. No mobile source files are changed.
