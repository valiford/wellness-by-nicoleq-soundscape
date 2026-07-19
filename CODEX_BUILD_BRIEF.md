# Codex Build Brief — Wellness by Nicole Soundscape Studio

## Objective

Develop a reliable browser-based sound console Nicole can operate during in-person and Zoom wellness sessions. Optimize for live facilitation, not public self-service.

## Product constraints

- No medical, audiological, neurological, or guaranteed-outcome claims.
- No copying of myNoise recordings, code, presets, branding, or interface.
- Use original, commissioned, synthetic, or explicitly licensed audio only.
- No user accounts or collection of client-sensitive information in the MVP.
- Desktop Chrome and Edge are the initial supported browsers.
- Controls must remain usable while Nicole is speaking and facilitating.

## Required architecture

- React + TypeScript + Vite
- Web Audio API
- Entirely client-side
- Static production output in `dist/`
- Deployable from GitHub to Hostinger
- No external runtime services

## Acceptance criteria for Version 0.1

1. Audio starts only after an explicit user action.
2. Four sources can play simultaneously without clipping at default settings.
3. Each source has independent enable, volume, filter, and reverb controls.
4. Tone sources have continuously adjustable frequency.
5. Master mute takes effect immediately.
6. Fade-in and fade-out transitions contain no audible clicks.
7. Selecting a preset updates all active channels without restarting the page.
8. The layout remains usable at 1366×768 and on a modern phone.
9. A production build completes with no TypeScript errors.
10. README includes Hostinger and Zoom operating instructions.

## Version 0.2 priorities

- Local preset persistence
- Audio output meter
- 30% duck button with adjustable release
- Original/licensed file-loop channels
- Seamless loop crossfading
- Session timer
- Accessibility review
- Automated unit tests for preset serialization and control bounds
