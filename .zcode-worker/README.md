# WBNQ Soundscape — ZCode Worker Control Plane

This directory is the authoritative automation queue for Wellness by Nicole Q Soundscape Studio.

Workers claim only READY jobs with `AUTOMATION_ELIGIBLE: true`, use isolated branches/worktrees, never merge to main, and never deploy. Successful work ends in REVIEW with a report under `reports/`.

Maintain at least five unclaimed READY jobs whenever feasible.
