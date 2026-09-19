# WBNQ Soundscape — ZCode Engineering Job Queue

The highest-priority READY job with satisfied dependencies and `AUTOMATION_ELIGIBLE: true` may be claimed by the scheduled ZCode worker.

## Ready Queue

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
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
