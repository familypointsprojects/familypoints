---
name: design-system
description: Use this skill when planning EasyQuest design tokens and reusable React Native components such as buttons, cards, badges, inputs, modals, task cards, reward cards, progress components, and approval actions.
---

# Design System Skill

Use this skill to plan a small, reusable design system for Family Points / EasyQuest. Keep it MVP-sized and aligned with existing app patterns before introducing new abstractions.

## System Principles

- Prefer tokens and components that support the task, approval, points, rewards, and wish flows.
- Keep parent UI calm and child UI more expressive through variants, not separate systems.
- Make role, status, and affordability visible through consistent components.
- Support English and Russian visible strings.
- Do not build broad theming, complex animation systems, or speculative components unless explicitly requested.

## Use This Skill For

- Design tokens
- Reusable React Native components
- Buttons
- Cards
- Badges
- Inputs
- Modals
- Task cards
- Reward cards
- Progress components
- Approval actions

## Output Format

### Token Decisions

Define practical tokens for color, typography, spacing, radius, shadow/elevation, borders, and status colors.

### Component List

List the components needed now, grouped by foundation, form, feedback, card, and flow-specific components.

### Props API

Describe props for each component using concise names and variant options.

### TypeScript Interfaces

Sketch TypeScript interfaces for important props. Keep them small and implementation-ready.

### Folder Structure

Recommend where tokens, primitives, shared UI, and feature-specific components should live.

### Implementation Steps

Provide an ordered, incremental path for implementation and migration.

### What Not To Build Yet

Explicitly list deferred items such as complex themes, XP/level components, subscription UI, ad placements, investment widgets, AI task generation, school integrations, and real screen time controls.

