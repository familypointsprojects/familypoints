# AI Collaboration Rules And Project Skills

This document helps GPT/Codex and Claude Code understand easyQuest quickly and work safely in the same repo.

## Collaboration Protocol

- Assume the worktree may contain changes from another agent or the user.
- Inspect before editing. Use `git status --short`, `rg`, and targeted `sed` reads.
- Never revert unrelated changes.
- Keep changes scoped to the requested flow.
- Prefer small shared components and pure utilities over copy-pasted JSX or inline business logic.
- After editing, run TypeScript and lint checks when practical.

## Project Mental Model

easyQuest is a mobile-first Expo React Native app for parents and children.

- Parent creates children, tasks, rewards, and reviews requests.
- Child completes tasks, earns points after approval, and spends points on rewards or approved wishes.
- Supabase is the real backend direction. Local/mock behavior may exist for fallback, but new product behavior should be backend-ready.

## Skill: Add Or Change A Screen

1. Put route screens in `src/app`.
2. Wrap content in `AppScreen`.
3. Use shared UI from `src/shared/ui` before creating screen-local components.
4. Keep screen code focused on layout, route params, and local form state.
5. Move repeated calculations to `src/shared/utils`.
6. Move service orchestration to `src/shared/state` or `domainActions.ts`.
7. Add translations in both `en` and `ru`.

## Skill: Add Or Change Navigation

1. Check `docs/app-flow-plan.md` before adding routes.
2. Use canonical combined pages:
   - child rewards/wishes/received: `/child/rewards`
   - child balance/history: `/child/balance`
   - parent rewards/wish requests: `/parent/rewards`
3. Keep redirect routes only for compatibility.
4. Main parent/child screens get persistent bottom navigation from `AppBottomNavigation`, mounted in `src/app/_layout.tsx` outside the `Stack`.
5. Keep bottom navigation off focused form/detail flows such as create, edit, invite, and task detail screens.
6. Add new navigation icons to `QuestIcons`, then reference them from `BottomActionBar` / `AppBottomNavigation`.
7. Global top actions live in `AppHeaderMenu`, not individual screens.

## Skill: Add Or Change Backend Behavior

1. Define or update the contract in `src/shared/services/familyPoints/types.ts`.
2. Implement behavior in `supabaseFamilyPointsService.ts`.
3. Keep local service behavior aligned where reasonable.
4. Map database rows through `mappers.ts`; do not leak DTO shapes into screens.
5. Update SQL docs in `docs/supabase` when schema/RPC/RLS changes.
6. Keep the point ledger authoritative: balance is derived from `point_transactions`.

## Skill: Add Or Change Rewards, Wishes, Or Points

Respect these invariants:

- A child can redeem only when balance is enough.
- Redeem creates one spend transaction.
- Reject creates one refund via `manual_adjustment`.
- Fulfilled rewards/wishes leave active lists and move to received history.
- Approved wishes become rewards of type `wish`.
- Active wishlist must not show wishes already handled by reward flow.

## Skill: Add Or Change Auth

- Parent sessions come from Supabase auth.
- Child sessions come from invite token/link and are stored locally.
- Auth screens should not show after a stored session exists.
- Parent routes are blocked for child sessions.
- Child routes are blocked for parent sessions.
- Do not add complex auth screens until the route guard and session persistence are checked.

## Skill: Add Or Change UI Components

- Use React Native primitives only.
- Keep components small and typed.
- Prefer `StyleSheet.create`.
- Use design tokens from `src/constants/theme.ts`.
- Do not add new libraries for icons or styling unless the existing shared UI cannot cover it.
- Avoid screen-local SVG duplication; reusable icon art belongs in `QuestIcons`.

## Skill: Review Work

Use this order:

1. Product logic: does the flow match `docs/app-flow-plan.md`?
2. Data boundaries: are screens free of direct Supabase calls?
3. i18n: are all visible strings translated in both languages?
4. Navigation: are combined pages and redirects used correctly?
5. State consistency: are points, active/inactive flags, and histories updated exactly once?
6. UI: does it work on a mobile viewport and avoid overlapping bottom navigation?
7. Checks: `npx tsc --noEmit` and `./node_modules/.bin/eslint .`.

## ESLint Note

The Expo lint config is enabled, with a few project-specific rule overrides in `eslint.config.js`.

- Import resolver rules are disabled because the resolver native optional dependency can fail in this local environment.
- `react-hooks/refs` is disabled because React Native `Animated.Value` interpolation uses refs in a way this rule currently flags.
- `react-hooks/set-state-in-effect` is disabled because existing auth/deep-link hydration flows intentionally set state after mount.
- `react/no-unescaped-entities` is disabled because this is React Native text, not HTML.

TypeScript remains the source of truth for module resolution and type safety.
