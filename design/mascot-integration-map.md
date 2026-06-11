# easyQuest Mascot Integration Map

## Where The Mascot Should Appear

The mascot should not sit everywhere as decoration. Use it when the app gives feedback, explains something, or celebrates progress.

## Best Places In The Current App

- `src/app/child/dashboard.tsx`
  - Hero block with level/rank and XP progress.
  - Mascot can peek from behind the rank card or point at the next task.
  - Good place for a compact "today tip" bubble.

- `src/app/child/tasks.tsx`
  - Task completion bottom sheet.
  - After `submitTaskWithProof`, show a success popover with mascot, coin burst, and XP gained.
  - Daily quest cards can have a small mascot hand/antenna peeking from the side when a task is important.

- `src/app/child/task-details.tsx`
  - Information block before submission.
  - Mascot can explain what proof is needed.

- `src/app/child/balance.tsx`
  - Coin history and piggy bank/investment states.
  - Mascot can appear near ready payouts, locked coin states, and "money is growing" explanations.

- `src/app/child/rewards.tsx`
  - Reward purchase modal and wish modal.
  - Use mascot in the confirmation popup, success state, and "not enough coins" explanation.

- `src/app/child/growth-missions.tsx`
  - Deposit modal and mission cards.
  - Mascot can explain how the piggy bank profit timer works.

- `src/app/parent/submissions.tsx`
  - Parent review list.
  - Use a smaller, calmer mascot version only in empty states or review helper text, not in every card.

- `src/app/parent/tasks.tsx`
  - Task detail modal.
  - Mascot can be a small guide for task quality and daily task rules.

- `src/shared/ui/EmptyState.tsx`
  - Add optional `mascotVariant` prop.
  - Empty states are ideal for mascot presence because they need warmth and explanation.

- `src/shared/ui/AppCard.tsx`
  - Add an optional `mascotPeek`/`accent` variant later if repeated patterns emerge.
  - Avoid baking mascot into every card by default.

- `src/shared/ui/PointsBadge.tsx`
  - Replace emoji star with the real compass coin SVG.
  - This is the first icon cleanup target.

- `src/shared/ui/QuestIcons.tsx`
  - Extend this file with real app icons: task/check, book/focus, plant/care, streak/flame, XP/compass progress, piggy bank, coin burst, info mascot.

- Level / XP progress components
  - Use a rocket-at-the-end progress bar for child-facing level progress.
  - The filled track should read as a fire/energy trail from the rocket.
  - Use this for level progress and major achievement progress, not every small percentage bar.

## Feedback Moments

- Task submitted: small burst, +coins, +XP, mascot thumbs-up/antenna sparkle.
- Task approved by parent: bigger reward popup, coins fly into balance or piggy bank.
- Reward bought: reward card flips or pops, mascot in modal.
- Level up: full-width rank celebration, compass progress bar fills, skill unlock shown.
- Streak saved: compact flame/flag chain, not too much pressure.
- Piggy bank ready: mascot points at pink piggy bank, "прибыль готова".

## Rules

- Use mascot for feedback and guidance, not as wallpaper.
- Child screens can be expressive; parent screens should be calmer.
- Use vector icons from `QuestIcons.tsx` or future SVG assets. No emoji in final UI.
- Navigation and task icons should be colorful filled app icons, not gray outline placeholders.
- Avoid placing non-transparent mascot PNGs directly over cards; use transparent assets or UI-native mini mascot shapes.
- Keep the mascot fixed to the style guide in `design/mascot-style-guide.md`.
