# WBNQ Soundscape — ZCode Engineering Job Queue

The highest-priority READY job with satisfied dependencies and `AUTOMATION_ELIGIBLE: true` may be claimed by the scheduled ZCode worker.

## Owner Execution Directive — 2026-10-01 product-progress gate

> **This section overrides the lower READY tables for new claims on 2026-10-01.** Existing branch/worktree leases remain authoritative and continue under their current job contracts. Do **not** create or replenish jobs merely to maintain a queue reserve.
>
> New claims on 2026-10-01 may come **only** from rows marked **OPEN** below. **LEASED** rows must never be duplicated. **GATED** rows are staged but are not claimable until a controller/reviewer explicitly reopens them after a checkpoint. Historical READY rows outside this table are not claimable on 2026-10-01.
>
> **Checkpoint rule:** after three jobs in this workstream newly reach REVIEW/COMPLETE during the 2026-10-01 run (or sooner if a critical integration conflict appears), stop new claims and reassess current `origin/main`, merged PRs, reachable reports, and the runnable product. Release more work only when the completed tranche produced a visible user/operator capability, closed a critical integration gap, or fixed a demonstrated reliability defect. Do not reward PR count. Slot 10 is reserve work only.
>
> If fewer than three rows are OPEN, that is intentional: active leases or dependency/integration risk make backfilling with older READY work counterproductive.

| Slot | Job ID | Lane | Release | Intended outcome |
|---:|---|---|---|---|
| 1 | WBNS-0060 | Product | OPEN | Finish the mobile mixer layout and gestures. |
| 2 | WBNS-0061 | Product | OPEN | Finish preset create/save/load/recovery. |
| 3 | WBNS-0062 | Product | OPEN | Finish session timer, fade-out, and sleep continuity. |
| 4 | WBNS-0064 | Product | GATED | Improve audio-engine crossfade and node lifecycle after the first checkpoint. |
| 5 | WBNS-0063 | Integration | GATED | Integrate interruption, route-change, and resume behavior. |
| 6 | WBNS-0058 | Integration | GATED | Consolidate preset/timer/interruption recovery only if still needed after current product work. |
| 7 | WBNS-0059 | Reliability | GATED | Run long-session stability/performance protection around the completed flows. |
| 8 | WBNS-0066 | Reliability | GATED | Run release acceptance and soak. |
| 9 | WBNS-0065 | UX | GATED | Finish accessibility and live feedback. |
| 10 | WBNS-0057 | Reserve | GATED | Use the older mixer-precision pass only if the new mobile mixer work exposes a real remaining defect. |

## Ready Queue — 2026-09-30 fresh soundscape product wave

> Reconciled against current branch leases on 2026-09-30. These seven existing jobs are today's preferred runnable wave; no filler jobs were added.

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
| 1 | WBNS-0060 | READY | ZCODE | Mobile mixer layout and gesture completion |
| 2 | WBNS-0061 | READY | ZCODE | Preset create, save, load, and recovery |
| 3 | WBNS-0062 | READY | ZCODE | Session timer, fade-out, and sleep continuity |
| 4 | WBNS-0063 | READY | ZCODE | Audio interruption, route change, and resume |
| 5 | WBNS-0064 | READY | ZCODE | Audio engine crossfade and node lifecycle |
| 6 | WBNS-0065 | READY | ZCODE | Soundscape accessibility and feedback |
| 7 | WBNS-0066 | READY | ZCODE | Soundscape release acceptance and soak |

## Ready Queue

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
| 1 | WBNS-0060 | READY | ZCODE | Mobile mixer layout and gesture completion |
| 2 | WBNS-0061 | READY | ZCODE | Preset create, save, load, and recovery |
| 3 | WBNS-0062 | READY | ZCODE | Session timer, fade-out, and sleep continuity |
| 4 | WBNS-0063 | READY | ZCODE | Audio interruption, route change, and resume |
| 5 | WBNS-0064 | READY | ZCODE | Audio engine crossfade and node lifecycle |
| 6 | WBNS-0065 | READY | ZCODE | Soundscape accessibility and feedback |
| 7 | WBNS-0066 | READY | ZCODE | Soundscape release acceptance and soak |
| 1 | WBNS-0057 | READY | ZCODE | Mixer precision and mobile gesture release pass |
| 2 | WBNS-0058 | READY | ZCODE | Preset timer and interruption recovery consolidation |
| 3 | WBNS-0059 | READY | ZCODE | Audio accessibility and long-session stability gate |
| 1 | WBNS-0049 | READY | ZCODE | Mixer slider and gesture interaction consolidation |
| 2 | WBNS-0050 | READY | ZCODE | Preset undo reset and accidental-change recovery workflow |
| 3 | WBNS-0051 | READY | ZCODE | Mobile audio interruption and resume hardening |
| 4 | WBNS-0052 | READY | ZCODE | Crossfade and gain-ramp audio quality implementation |
| 5 | WBNS-0053 | READY | ZCODE | Session timer persistence and interruption correctness |
| 6 | WBNS-0054 | READY | ZCODE | Mixer keyboard screen-reader and touch accessibility pass |
| 7 | WBNS-0055 | READY | ZCODE | Long-session audio memory CPU and node-lifecycle soak |
| 8 | WBNS-0056 | READY | ZCODE | Soundscape mobile and desktop release-candidate acceptance suite |
| 1 | WBNS-0041 | READY | ZCODE | Precision mixer pointer touch and track-click behavior consolidation |
| 2 | WBNS-0042 | READY | ZCODE | Mobile page-scroll and slider gesture isolation |
| 3 | WBNS-0043 | READY | ZCODE | Preset scenes undo reset and local recovery workflow |
| 4 | WBNS-0044 | READY | ZCODE | Crossfade gain-ramp mute and transition smoothing |
| 5 | WBNS-0045 | READY | ZCODE | Audio interruption background resume and timer continuity |
| 6 | WBNS-0046 | READY | ZCODE | Keyboard screen-reader focus and value-feedback accessibility |
| 7 | WBNS-0047 | READY | ZCODE | Long-session audio memory CPU and node-lifecycle soak |
| 8 | WBNS-0048 | READY | ZCODE | Soundscape responsive reduced-motion and mobile-browser release gate |
| 1 | WBNS-0035 | READY | ZCODE | Precision mixer gesture and pointer-capture consolidation |
| 2 | WBNS-0036 | READY | ZCODE | Mixer presets undo reset and recovery workflow |
| 3 | WBNS-0037 | READY | ZCODE | Audio interruption background resume and timer continuity |
| 4 | WBNS-0038 | READY | ZCODE | Crossfade gain-ramp and audible-transition quality pass |
| 5 | WBNS-0039 | READY | ZCODE | Keyboard screen-reader and reduced-motion accessibility release gate |
| 6 | WBNS-0040 | READY | ZCODE | Long-session audio performance memory and lifecycle soak |
| 1 | WBNS-0033 | READY | ZCODE | Mixer state undo reset and accidental-change recovery |
| 2 | WBNS-0034 | READY | ZCODE | Mobile Safari and Android Chrome audio-interruption regression pass |
| 1 | WBNS-0026 | READY | ZCODE | Precision slider pointer and drag stability pass |
| 2 | WBNS-0027 | READY | ZCODE | Mobile slider versus page-scroll gesture isolation |
| 3 | WBNS-0028 | READY | ZCODE | Keyboard screen-reader and value-feedback mixer polish |
| 4 | WBNS-0029 | READY | ZCODE | Local mixer preset scenes and safe recall |
| 5 | WBNS-0030 | READY | ZCODE | Layer crossfade and transition smoothing |
| 6 | WBNS-0031 | READY | ZCODE | Session timer background and recovery hardening |
| 7 | WBNS-0032 | READY | ZCODE | Long-session audio performance and accessibility gate |
| 1 | WBNS-0019 | READY | ZCODE | Mixer preset scenes and local recall |
| 2 | WBNS-0020 | READY | ZCODE | Keyboard and screen-reader mixer semantics |
| 3 | WBNS-0021 | READY | ZCODE | Mobile audio unlock suspend and resume resilience |
| 4 | WBNS-0022 | READY | ZCODE | Layer transition and crossfade smoothing |
| 5 | WBNS-0023 | READY | ZCODE | Session timer persistence and recovery guard |
| 6 | WBNS-0024 | READY | ZCODE | Audio asset integrity and decode fallback guard |
| 7 | WBNS-0025 | READY | ZCODE | Long-session audio memory and CPU budget guard |
| 1 | WBNS-0013 | READY | ZCODE | Smooth volume slider pointer/gesture control; eliminate jumpy track clicks and erratic drags |
| 2 | WBNS-0014 | READY | ZCODE | Slider cross-browser latency/input regression lab for rapid scrubbing, resize, and touch behavior |
| 3 | WBNS-0015 | READY | ZCODE | Mixer control visual affordance polish for premium, stable, touch-friendly controls |
| 4 | WBNS-0016 | READY | ZCODE | Live mix value feedback and meter smoothing without changing authoritative audio values |
| 5 | WBNS-0017 | READY | ZCODE | Mobile mixer ergonomics and gesture isolation between slider drag and page scroll |
| 6 | WBNS-0018 | READY | ZCODE | Mixer state coalescing and persistence throttle to keep high-frequency interaction smooth |
| 20 | WBNS-0006 | READY | ZCODE | Audio asset load and fallback reliability guard |
| 21 | WBNS-0007 | READY | ZCODE | Playback node teardown and duplicate-session guard |
| 22 | WBNS-0008 | READY | ZCODE | Offline/reload and unavailable-media recovery guard |
| 23 | WBNS-0009 | READY | ZCODE | Keyboard media-control semantics guard |
| 24 | WBNS-0010 | READY | ZCODE | Volume/mute persistence bounds guard |
| 25 | WBNS-0011 | READY | ZCODE | Audio visibility/suspension recovery guard |
| 26 | WBNS-0012 | READY | ZCODE | Session timer drift/backgrounding guard |

## Active Jobs

None.

## Review Queue

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
| 1 | WBNS-0001 | REVIEW | ZCODE | Worker-reported implementation already completed on local `main` ahead of `origin/main`; preserve as completed local evidence and do not reclaim until remote integration state is reconciled |
| 2 | WBNS-0002 | REVIEW | ZCODE | Worker-reported implementation already completed on local `main` ahead of `origin/main`; preserve as completed local evidence and do not reclaim until remote integration state is reconciled |
| 3 | WBNS-0003 | REVIEW | ZCODE | Worker-reported implementation already completed on local `main` ahead of `origin/main`; preserve as completed local evidence and do not reclaim until remote integration state is reconciled |
| 4 | WBNS-0004 | REVIEW | ZCODE | Worker-reported implementation already completed on local `main` ahead of `origin/main`; preserve as completed local evidence and do not reclaim until remote integration state is reconciled |
| 5 | WBNS-0005 | REVIEW | ZCODE | Worker-reported implementation already completed on local `main` ahead of `origin/main`; preserve as completed local evidence and do not reclaim until remote integration state is reconciled |

## Proposed / Waiting

None.

## Completed

None.

## Queue Rules

1. Lower priority number means higher priority.
2. Claim only READY jobs with `AUTOMATION_ELIGIBLE: true`.
3. Never enter another job's existing worktree.
4. Branch/worktree existence is the temporary claim lease.
5. Never merge into `main`.
6. Never deploy/release/publish.
7. Successful autonomous work ends in REVIEW.
8. Maintain at least **six unclaimed READY jobs** at all times whenever feasible.
9. New job claims are allowed only from 11:00 AM through 9:00 PM Eastern Time (`America/New_York`).
10. Preserve client-side architecture, wellness-only claims, and licensed/original/synthetic audio boundaries.
