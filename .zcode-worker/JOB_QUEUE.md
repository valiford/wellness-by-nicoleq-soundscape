# WBNQ Soundscape — ZCode Engineering Job Queue

The highest-priority READY job with satisfied dependencies and `AUTOMATION_ELIGIBLE: true` may be claimed by the scheduled ZCode worker.

## Ready Queue

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
| 6 | WBNS-0006 | READY | ZCODE | Audio asset load and fallback reliability guard |
| 7 | WBNS-0007 | READY | ZCODE | Playback node teardown and duplicate-session guard |
| 8 | WBNS-0008 | READY | ZCODE | Offline/reload and unavailable-media recovery guard |
| 9 | WBNS-0009 | READY | ZCODE | Keyboard media-control semantics guard |
| 10 | WBNS-0010 | READY | ZCODE | Volume/mute persistence bounds guard |

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
8. Maintain at least **five unclaimed READY jobs** at all times whenever feasible.
9. New job claims are allowed only from 11:00 AM through 9:00 PM Eastern Time (`America/New_York`).
10. Preserve client-side architecture, wellness-only claims, and licensed/original/synthetic audio boundaries.
