import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:5175';
const storageKey = 'wbn-soundscape-session-presets-v1';

const server = spawn(
  'npm run dev -- --host 127.0.0.1 --port 5175',
  { shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
);

let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function stopServer() {
  if (!server.pid || server.killed) return;
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Vite may already be stopped.
    }
    try {
      const netstat = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
      const listener = netstat
        .split(/\r?\n/)
        .find(line => line.includes('127.0.0.1:5175') && line.includes('LISTENING'));
      const pid = listener?.trim().split(/\s+/).at(-1);
      if (pid) execFileSync('taskkill', ['/pid', pid, '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Best-effort cleanup.
    }
    return;
  }
  server.kill('SIGTERM');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await wait(250);
  }
  throw new Error(`Vite dev server did not start.\n${serverOutput}`);
}

async function setInput(locator, value) {
  await locator.evaluate((input, nextValue) => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setTextarea(locator, value) {
  await locator.evaluate((input, nextValue) => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function announcement(page) {
  return (await page.locator('.announcer').innerText()).trim();
}

async function runPresetCrud(page) {
  const presetSelect = page.getByLabel('Session preset');
  const presetName = page.getByLabel('Preset name');

  assert(await presetSelect.locator('option').count() >= 4, 'Expected built-in presets to load.');
  await presetSelect.selectOption({ label: 'Heart Opening' });
  assert((await announcement(page)).includes('Heart Opening preset loaded'), 'Expected built-in preset load announcement.');

  await presetName.fill('Smoke Preset');
  await page.getByRole('button', { name: 'Save current' }).click();
  assert((await announcement(page)).includes('Smoke Preset preset saved'), 'Expected save preset announcement.');
  assert(await presetSelect.locator('option', { hasText: 'Smoke Preset' }).count() === 1, 'Expected saved preset in select.');
  assert(await page.evaluate(key => Boolean(localStorage.getItem(key)), storageKey), 'Expected presets to persist in localStorage.');

  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Smoke Preset' }).count() === 1, 'Expected saved preset after reload.');

  await page.getByLabel('Session preset').selectOption({ label: 'Smoke Preset' });
  await page.getByRole('button', { name: 'Duplicate' }).click();
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Smoke Preset copy' }).count() === 1, 'Expected duplicate preset.');

  await page.getByLabel('Preset name').fill('Smoke Renamed');
  await page.getByRole('button', { name: 'Rename' }).click();
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Smoke Renamed' }).count() === 1, 'Expected renamed preset.');

  await page.getByRole('button', { name: 'Delete' }).click();
  assert((await announcement(page)).includes('Preset deleted'), 'Expected delete announcement.');

  await page.getByText('Import and export JSON').click();
  await page.getByRole('button', { name: 'Export presets' }).click();
  const exported = await page.getByLabel('Export JSON').inputValue();
  assert(exported.includes('"schemaVersion": 1'), 'Expected exported JSON schema version.');
  assert(exported.includes('"presets"'), 'Expected exported presets array.');

  const validImport = JSON.stringify({
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    presets: [{
      schemaVersion: 1,
      id: 'imported-smoke',
      name: 'Imported Smoke',
      channels: [
        { id: 'foundation', name: 'Foundation', source: 'brown', enabled: true, volume: 0.1, frequency: 110, filter: 1800, reverb: 0.1 },
      ],
      masterVolume: 0.22,
      reverbAmount: 0.1,
      bowlDefaults: {
        selectedBowlId: 'root',
        selectedStyleId: 'regular-strike',
        styleGains: { 'regular-strike': 0.5, 'amplified-rim': 0.4, 'hard-strike': 0.2 },
      },
      fadeInSeconds: 2,
      fadeOutSeconds: 3,
      sequence: {
        id: 'imported-seq',
        name: 'Imported sequence',
        steps: [{ id: 'cue-1', type: 'cue', label: 'Cue', text: 'Pause quietly.' }],
      },
      notes: 'Imported note.',
    }],
  });
  await setTextarea(page.getByLabel('Import JSON'), validImport);
  await page.getByRole('button', { name: 'Import presets' }).click();
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Imported Smoke' }).count() === 1, 'Expected valid import to add preset.');

  await setTextarea(page.getByLabel('Import JSON'), '{"schemaVersion":1,"presets":[{"id":"bad"}]}');
  await page.getByRole('button', { name: 'Import presets' }).click();
  assert((await announcement(page)).includes('missing a name'), 'Expected invalid import rejection.');
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Imported Smoke' }).count() === 1, 'Expected invalid import not to remove saved presets.');

  const builtInCollision = JSON.parse(validImport);
  builtInCollision.presets[0].id = 'builtin-grounding';
  builtInCollision.presets[0].name = 'Built-in Collision';
  await setTextarea(page.getByLabel('Import JSON'), JSON.stringify(builtInCollision));
  await page.getByRole('button', { name: 'Import presets' }).click();
  assert((await announcement(page)).includes('built-in preset id'), 'Expected built-in id collision rejection.');
  assert(await page.getByLabel('Session preset').locator('option', { hasText: 'Built-in Collision' }).count() === 0, 'Expected built-in collision not to add a preset.');
}

async function runSequenceChecks(page) {
  await page.getByRole('button', { name: 'Start audio' }).click();
  await page.waitForFunction(() => document.querySelector('.sample-status')?.textContent?.includes('Ready'), null, { timeout: 10_000 });
  await page.getByRole('button', { name: 'Clear sequence' }).click();
  await page.getByText('Edit sequence').click();
  const stepEditor = page.locator('.step-editor');
  const stepType = stepEditor.locator('select').first();

  await page.getByRole('button', { name: 'Add step' }).click();
  assert(await page.locator('.sequence-step.cue').count() === 1, 'Expected facilitator cue step.');

  await stepType.selectOption('play-sample');
  await stepEditor.locator('select').nth(1).selectOption('root-regular-strike');
  await page.getByRole('button', { name: 'Add step' }).click();

  await stepType.selectOption('wait');
  await setInput(stepEditor.locator('input').first(), 1.5);
  await page.getByRole('button', { name: 'Add step' }).click();

  await stepType.selectOption('master-volume');
  await setInput(stepEditor.locator('input').first(), 0.18);
  await page.getByRole('button', { name: 'Add step' }).click();

  await stepType.selectOption('fade-bowls');
  await page.getByRole('button', { name: 'Add step' }).click();
  await stepType.selectOption('stop-bowls');
  await page.getByRole('button', { name: 'Add step' }).click();

  assert(await page.locator('.sequence-step').count() === 6, 'Expected six sequence steps.');

  await page.getByRole('button', { name: 'Start sequence' }).click();
  assert((await page.locator('.sequence-status').innerText()).trim() === 'Running', 'Expected sequence to start.');
  assert(await page.locator('.cue-step').innerText().then(text => text.includes('facilitator cue')), 'Expected cue to be visually clear.');

  await page.getByRole('button', { name: 'Skip step' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.active-sample').length === 1, null, { timeout: 3_000 });
  assert(await page.locator('.active-sample').first().innerText().then(text => text.includes('Root Bowl - Regular Strike')), 'Expected bowl playback sequence step.');

  await page.getByRole('button', { name: 'Skip step' }).click();
  await page.waitForFunction(() => document.body.textContent?.includes('Wait remaining: 1s') || document.body.textContent?.includes('Wait remaining: 2s'), null, { timeout: 2_000 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedWait = await page.locator('.sequence-readout').innerText();
  await wait(900);
  assert(await page.locator('.sequence-readout').innerText() === pausedWait, 'Expected paused wait countdown to hold position.');
  await page.getByRole('button', { name: 'Resume' }).click();

  await page.getByRole('button', { name: 'Skip step' }).click();
  await page.waitForFunction(() => Number(document.querySelector('.master-slider input')?.value) === 0.18, null, { timeout: 2_000 });
  assert(await page.locator('.master-slider input').inputValue() === '0.18', 'Expected master-volume sequence step.');

  await page.getByRole('button', { name: 'Previous step' }).click();
  assert((await announcement(page)).includes('Returned to previous sequence step'), 'Expected previous step announcement.');

  await page.getByRole('button', { name: 'Mute all' }).click();
  assert(await page.locator('.live-status').innerText().then(text => text.trim()) === 'Muted', 'Expected Mute All during sequence.');

  await page.getByRole('button', { name: 'Stop sequence' }).click();
  assert((await page.locator('.sequence-status').innerText()).trim() === 'Idle', 'Expected stop sequence to reset status.');
  const stoppedReadout = await page.locator('.sequence-readout').innerText();
  await wait(1600);
  assert(await page.locator('.sequence-readout').innerText() === stoppedReadout, 'Expected stop sequence to cancel pending timers.');
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1200 } });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'networkidle' });

  console.log('Running preset CRUD/import/export smoke check...');
  await runPresetCrud(page);
  console.log('Running sequence runner smoke check...');
  await runSequenceChecks(page);

  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await browser.close();
  console.log('Preset and sequence smoke checks passed.');
} finally {
  stopServer();
}
