# Family Points / EasyQuest Agent Guide

This file is the fast entry point for Codex, GPT agents, and Claude Code.

## Project Description

Family Points / EasyQuest is a React Native + Expo mobile app for families. Parents create tasks, children complete and submit them, parents approve or reject submissions, and approved work creates points that children can spend on rewards.

The product should feel like a friendly quest system for everyday family responsibilities: motivating for children around 8-12+, clear for parents, and practical enough for an MVP.

## Read First

1. `docs/ai-collaboration.md` - working rules and project-specific AI skills.
2. `docs/architecture.md` - layers, ownership, and refactoring checklist.
3. `docs/app-flow-plan.md` - product logic, routes, and backend invariants.
4. `docs/app-flow-schema-ru.md` - same product logic in Russian.

Expo has changed: use the exact Expo SDK docs for this project version when needed:
`https://docs.expo.dev/versions/v56.0.0/`

## MVP Scope

Build and preserve the core loop:

- Parents create tasks.
- Children complete tasks.
- Children submit completed tasks for parent approval.
- Parents approve or reject task submissions.
- Approved submissions award points to the child.
- Children spend points on rewards.
- Children create wish/requested rewards.
- Parents approve wishes and set a point price.
- Approved wishes become available rewards.

Main MVP entities:

- `users`
- `families`
- `family_members`
- `children`
- `tasks`
- `task_submissions`
- `rewards`
- `reward_purchases`
- `point_transactions`

## Technical Stack

- React Native
- Expo
- TypeScript
- Supabase
- PostgreSQL
- TanStack Query
- Zustand
- React Hook Form
- Zod

## Data Reliability Rules

- Children must not be able to approve their own task submissions.
- Children must not be able to add points to themselves.
- Points are added only after parent approval.
- Reward spending must check that the child has enough points.
- Every points change must create a `point_transactions` record.
- A child's point balance must be recoverable from transaction history.
- Users must only access data that belongs to their own family.
- Keep security, validation, and ownership checks close to the service/database boundary, not only in UI state.

## Design Direction

- Overall feeling: adventure, quest, map, progress, points, rewards.
- Tone: friendly, warm, modern, and motivating.
- Avoid designs that feel too childish, corporate, or gendered.
- Parent screens should be clean, calm, scannable, and clear.
- Child screens can be more playful, quest-like, and celebratory while staying age-appropriate for 8-12+.
- Use explicit role clarity: parent actions and child actions should not be visually or verbally ambiguous.
- Favor practical mobile layouts, strong primary CTAs, clear empty states, and visible feedback for loading, success, rejection, and errors.

## Local Designer Skills And Commands

Reusable designer skills live in `.codex/skills/`. Command-style prompt shortcuts live in `.codex/commands/`. For quick slash-menu access, install or enable the local `easyquest-designers` plugin from the personal Codex marketplace.

Use these command prompts for design work:

- `/product-design <flow or screen>` for UX flows, screen structure, states, and CTA copy.
- `/ui-design <screen or component>` for visual style, layout, colors, cards, buttons, icons, and progress UI.
- `/ux-review <screen or flow>` for UX reviews, missing states, role clarity, and MVP scope checks.
- `/design-system <component area>` for tokens, reusable component APIs, and implementation planning.
- `/figma-prompt <screen set or brief>` for Figma AI, Recraft, and design brief prompts.

## Do Not Implement Unless Explicitly Requested

- AI task generator
- Subscriptions
- Ads
- Investments
- XP / levels
- School grade integration
- Real screen time control
- Complex themes

## Non-Negotiable Rules

- Use React Native components only: no HTML tags.
- New functions/components must be arrow functions.
- Do not call Supabase directly from screens.
- Put backend operations behind `src/shared/services` and state orchestration in `src/shared/state`.
- Add both `en` and `ru` translations for every visible string.
- New bottom navigation uses `BottomActionBar`; icons come from `QuestIcons`.
- All bottom popups/drawers must use `src/shared/ui/AppBottomSheet`. Keep its current pattern: native transparent `Modal` as the top layer, `@gorhom/bottom-sheet` inside it, swipe-down/backdrop/button close through the sheet close animation. Do not replace it with a plain `Modal`, hand-rolled `Animated` drawer, or `BottomSheetModal`.
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
