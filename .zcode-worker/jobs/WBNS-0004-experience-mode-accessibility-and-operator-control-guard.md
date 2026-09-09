# WBNS-0004 — Experience Mode Accessibility and Operator Control Guard

STATUS: READY
PRIORITY: 4
AGENT: ZCODE
AUTOMATION_ELIGIBLE: true
DEPENDENCIES: None.
BASE: main
DO_NOT_MERGE: true
DO_NOT_DEPLOY: true
TARGET_DURATION: ~60 minutes

## Objective

Protect Experience Mode and facilitator controls at desktop and phone widths so Nicole can operate the session quickly by keyboard/touch without hidden focus, clipped controls, or mode confusion.

## Scope

- Inventory `ExperienceMode.tsx`, `LiveEssentials.tsx`, responsive CSS, and current visual environment controls.
- Add focused keyboard/touch/viewport tests for entering/exiting Experience Mode, emergency controls, timer visibility, and focus return.
- Preserve current brand and visual direction.

## Acceptance criteria

1. Emergency controls remain reachable in every supported mode.
2. No critical facilitator control is clipped at 1366x768 or a modern phone width.
3. Focus/keyboard flow is predictable and visible.
4. No public self-service redesign is introduced.

## Verification

- `npm run build`
- Run all existing smoke scripts relevant to the touched area.
- Add focused automated regression coverage where practical.
- `git diff --check`

## Product boundaries

- Keep the app client-side.
- Do not add accounts, client data collection, analytics, or external runtime services.
- Do not make medical/audiological/guaranteed-outcome claims.
- Use only original, licensed, or synthetic audio.
- Preserve desktop Chrome/Edge live-facilitation behavior.

## Completion

1. Commit focused work on the job branch.
2. Write `.zcode-worker/reports/WBNS-0004.md`.
3. Successful work ends in REVIEW.
4. Never merge or deploy.
