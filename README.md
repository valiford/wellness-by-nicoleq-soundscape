# Wellness by Nicole Soundscape Studio — MVP

A browser-based live sound console intended for Nicole to operate during guided wellness and Zoom sessions.

## Current MVP capabilities

- Four continuously adjustable audio channels
- White/pink/brown-style generated noise foundations
- Two generated sine-tone channels
- Per-channel volume, low-pass filtering, and reverb
- Live oscillator frequency control
- Master volume, fade-in, fade-out, and emergency mute
- Four starter presets: Grounding, Arrival, Deepening, Return
- Responsive session interface
- No accounts, database, analytics, or client data

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Hostinger should serve the generated `dist` directory for a static deployment, or import the repository through its Node.js Web App flow and use `npm run build`.

## Proposed domain

`soundscape.wellnessbynicoleq.com`

## Zoom operating procedure

1. Use the Zoom desktop application and headphones.
2. Open this console in Chrome or Edge.
3. Click Start audio.
4. In Zoom, choose Share Screen and enable Share sound.
5. Share the browser window when clients should see the controls; otherwise share computer audio only.
6. Keep Nicole's microphone active and verify voice remains louder than the soundscape.

## Safety and positioning

This console is intended to support guided relaxation and wellness sessions. It is not medical care, audiological treatment, or a diagnostic tool. Avoid claims that specific frequencies treat health conditions or guarantee outcomes.

## Next build increments

1. Add licensed/original bowl, ocean, and rain loops.
2. Add saved custom presets using localStorage.
3. Add output level metering and clipping alerts.
4. Add a one-click "duck" control to temporarily lower all sound beneath Nicole's voice.
5. Test Zoom transmission from a second device and document recommended levels.
