# WBNS-0032 — Long-session audio performance and accessibility gate

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** Tomorrow priority

## Goal
Add representative long-session memory/CPU/node-lifecycle checks plus responsive, reduced-motion, keyboard, and touch accessibility regression coverage.

## Constraints
- Keep the app client-side and preserve licensed/original/synthetic audio boundaries. Do not add camera, location, account, cloud, network-service, or vendor requirements. Preserve wellness-only claims.
- Preserve current-main safety, privacy, compatibility, and data-authority boundaries.
- No production secrets or environment-specific credentials in source.
- Worker ends in REVIEW; never merge, deploy, publish, or release.

## Acceptance
- Deterministic tests/regression evidence cover success and relevant stale/duplicate/failure/recovery paths.
- Existing build/test/safety suites remain green.
- Diagnostics are bounded and redacted.
- Report evidence and stop in REVIEW.
