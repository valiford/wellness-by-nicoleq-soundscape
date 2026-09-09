# WBNQ Soundscape — ZCode Engineering Job Queue

The highest-priority READY job with satisfied dependencies and `AUTOMATION_ELIGIBLE: true` may be claimed by the scheduled ZCode worker.

## Ready Queue

| Priority | Job ID | Status | Agent | Description |
|---:|---|---|---|---|
| 1 | WBNS-0001 | READY | ZCODE | Audio context lifecycle and resume regression guard |
| 2 | WBNS-0002 | READY | ZCODE | Output meter, clipping, mute, fade, and duck safety guard |
| 3 | WBNS-0003 | READY | ZCODE | Session preset persistence and schema resilience guard |
| 4 | WBNS-0004 | READY | ZCODE | Experience Mode accessibility and operator control guard |
| 5 | WBNS-0005 | READY | ZCODE | Bowl sequence timing and cancellation determinism guard |

## Active Jobs

None.

## Review Queue

None.

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
