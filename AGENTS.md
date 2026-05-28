# easyQuest Agent Guide

This file is the fast entry point for Codex, GPT agents, and Claude Code.

## Read First

1. `docs/ai-collaboration.md` - working rules and project-specific AI skills.
2. `docs/architecture.md` - layers, ownership, and refactoring checklist.
3. `docs/app-flow-plan.md` - product logic, routes, and backend invariants.
4. `docs/app-flow-schema-ru.md` - same product logic in Russian.

Expo has changed: use the exact Expo SDK docs for this project version when needed:
`https://docs.expo.dev/versions/v56.0.0/`

## Non-Negotiable Rules

- Use React Native components only: no HTML tags.
- New functions/components must be arrow functions.
- Do not call Supabase directly from screens.
- Put backend operations behind `src/shared/services` and state orchestration in `src/shared/state`.
- Add both `en` and `ru` translations for every visible string.
- New bottom navigation uses `BottomActionBar`; icons come from `QuestIcons`.
- Child rewards and wishes are combined at `/child/rewards`.
- Child balance and task history are combined at `/child/balance`.
- Parent rewards and wish requests are combined at `/parent/rewards`.
- Do not revert unrelated dirty files; Claude Code and other agents may be working in parallel.

## Checks

Run before handing off:

```bash
npx tsc --noEmit
./node_modules/.bin/eslint .
```

Smoke-test at least:

- `/parent/dashboard`
- `/child/dashboard`
- the screen you changed
