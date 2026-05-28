# easyQuest

easyQuest is an Expo React Native + TypeScript app for parents and children.

Parents create tasks and rewards. Children complete tasks, earn points after parent approval,
and spend points on rewards or approved wishes.

## Current Direction

- Mobile-first Expo app using Expo Router.
- Supabase is the real backend path.
- Parent and child sessions are persisted.
- Rewards/wishes and balance/history are already combined into simpler pages.
- UI is bilingual: Russian and English.

## Start

```bash
npm install
npx expo start
```

Common targets:

```bash
npx expo start --web
npx expo run:ios
npx expo run:android
```

## Checks

```bash
npx tsc --noEmit
./node_modules/.bin/eslint .
```

## Important Docs

- `AGENTS.md` - fast rules for GPT/Codex and Claude Code.
- `docs/ai-collaboration.md` - project-specific AI skills and workflows.
- `docs/architecture.md` - folder ownership and architecture rules.
- `docs/app-flow-plan.md` - product flow, routes, and invariants.
- `docs/app-flow-schema-ru.md` - Russian product flow diagrams.
- `docs/supabase` - schema, migrations, and backend setup notes.

## Architecture Snapshot

- `src/app`: Expo Router screens.
- `src/shared/ui`: reusable UI components.
- `src/shared/state`: app state and domain actions.
- `src/shared/services`: Supabase/local service contracts and implementations.
- `src/shared/utils`: pure business rules.
- `src/shared/i18n`: translation keys.

## Product Invariants

- Do not show auth screens to an already signed-in user.
- Do not show parent screens to child sessions.
- Do not show child screens to parent sessions.
- Balance is derived from `point_transactions`.
- Fulfilled rewards and wishes leave active lists and move to received history.
- Rejecting a reward redemption refunds points once.
- New visible text must exist in Russian and English.
