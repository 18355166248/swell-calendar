# Multi-day all-day height auto growth

## Background

Multi-day view can show multiple all-day events stacked in one day column. When a column has three all-day events, the all-day lane needs to grow beyond the previous two-slot height so the right preview is not clipped.

## Goals

- Keep all-day events stacked without vertical centering gaps when the available row is already filled.
- Let the all-day panel height follow the current all-day slot count, including the three-event case.
- Preserve the existing shared Day / Week / Multi-day / Scheduler panel layout model.

## Non-goals

- No public API changes.
- No new all-day event packing algorithm.
- No visual redesign of event cards.

## Scope

- Inspect the fixed panel height cache used by all-day rows.
- Add a regression test for stale cached panel height versus a larger intrinsic height.
- Update the panel height resolution so non-rest panels follow their latest intrinsic height.

## Validation

- `pnpm --filter swell-calendar test -- Panel.spec.tsx`
- `node scripts/check-docs.mjs`
- `node scripts/check-arch.mjs`
- `pnpm --filter swell-calendar exec tsc --noEmit`
- `pnpm --filter swell-calendar test`

## Risks

- The `Panel` component is shared by several views, so the fix must preserve the last panel behavior where the time grid consumes remaining height.

## Final solution

- Added a `Panel` regression test for the stale all-day height cache: a fixed all-day panel with cached `48px` must grow to a new intrinsic `72px` height.
- Added a guard test for the last panel behavior: the time panel still uses cached remaining height when it is the layout's last panel.
- Updated `Panel` height resolution so non-last panels follow their latest `initialHeight`, while the last panel continues to consume the store-calculated remaining height.

## Verification results

- `pnpm --filter swell-calendar test -- Panel.spec.tsx` passed with 2 tests.
- `node scripts/check-docs.mjs` passed.
- `node scripts/check-arch.mjs` passed.
- `pnpm --filter swell-calendar exec tsc --noEmit` passed.
- `pnpm --filter swell-calendar test` passed with 47 files and 381 tests.

## Remaining risk

- No remaining known risk for the reported three-all-day-event growth case. Manual browser preview was not run in this pass; coverage is from the shared panel regression and package test suite.
