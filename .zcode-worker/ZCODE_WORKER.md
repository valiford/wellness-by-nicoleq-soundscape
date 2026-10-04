# WBNQ Soundscape — ZCode Worker Rules

1. Treat origin/main as authoritative before every claim.
2. Claim only READY jobs with `AUTOMATION_ELIGIBLE: true`.
3. Never enter another job's worktree or reuse an active branch.
4. Branch/worktree existence acts as a claim lease.
5. Never merge into main.
6. Never deploy/release/publish.
7. Successful autonomous work ends in REVIEW with a report.
8. Maintain at least five unclaimed READY jobs whenever feasible; do not claim if doing so would leave fewer than five unless the queue has just been replenished or no safe independent work remains.
9. New claims are allowed only from 11:00 AM through 9:00 PM America/New_York.
10. Preserve the app's client-side wellness positioning and audio provenance/safety boundaries.


## Owner reload selection rule — 2026-10-04

Only the newest non-superseded Owner Execution Wave table in `.zcode-worker/JOB_QUEUE.md` authorizes selection. Historical READY/execution tables are lineage, never fallback. Read `.zcode-worker/prompts/worker-2026-10-04.md` and the full job specification before claiming. Local/remote leases and accepted dependencies remain mandatory; this remote restock cannot certify unseen local ownership. Numeric reserve is conditional on useful independent work; this owner-authorized bounded wave must not be inflated with filler. All existing worker safety, scope, time-window, publishing and review rules remain in force.
