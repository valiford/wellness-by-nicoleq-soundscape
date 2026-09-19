# WBNS-0027 — Mobile slider versus page-scroll gesture isolation

**STATUS:** READY
**AGENT:** ZCODE
**AUTOMATION_ELIGIBLE:** true
**WAVE:** Tomorrow priority

## Goal
Harden touch-action, pointer capture, scroll isolation, thumb hit targets, and cancellation behavior so mixer gestures feel stable without trapping normal page scrolling.

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
