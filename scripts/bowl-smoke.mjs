import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:5174';

const samples = [
  '/audio/bowls/root-regular-strike.wav',
  '/audio/bowls/root-amplified-rim.wav',
  '/audio/bowls/root-hard-strike.wav',
  '/audio/bowls/heart-regular-strike.wav',
  '/audio/bowls/heart-amplified-rim.wav',
  '/audio/bowls/heart-hard-strike.wav',
  '/audio/bowls/crown-regular-strike.wav',
  '/audio/bowls/crown-amplified-rim.wav',
  '/audio/bowls/crown-hard-strike.wav',
];

const expectedDefaultVolumes = {
  'Root Bowl - Regular Strike': '24%',
  'Heart Bowl - Amplified Rim': '20%',
  'Crown Bowl - Hard Strike': '15%',
};

const server = spawn(
  'npm run dev -- --host 127.0.0.1 --port 5174',
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
      // The spawned shell can exit before cleanup if Vite has already stopped.
    }
    try {
      const netstat = execFileSync('netstat', ['-ano'], { encoding: 'utf8' });
      const listener = netstat
        .split(/\r?\n/)
        .find(line => line.includes('127.0.0.1:5174') && line.includes('LISTENING'));
      const pid = listener?.trim().split(/\s+/).at(-1);
      if (pid) execFileSync('taskkill', ['/pid', pid, '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Best-effort cleanup for local smoke-test servers.
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

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  assert(await page.locator('.bowl-player h2').innerText() === 'Bowls', 'Expected bowl player heading.');
  assert(await page.locator('.strike-button').count() === 9, 'Expected nine bowl strike buttons.');
  assert(samples.length === 9, 'Expected exactly nine manifest paths.');

  const sampleStatuses = await Promise.all(samples.map(async url => {
    const response = await page.evaluate(sampleUrl => fetch(sampleUrl).then(result => result.status), url);
    return { url, response };
  }));
  const missing = sampleStatuses.filter(sample => sample.response !== 200);
  assert(missing.length === 0, `Expected every bowl WAV to return 200: ${JSON.stringify(missing)}`);

  await page.getByRole('button', { name: 'Start audio' }).click();
  await page.waitForFunction(() => document.querySelector('.sample-status')?.textContent?.includes('Ready'), null, { timeout: 10_000 });

  await page.getByRole('button', { name: 'Play Root Bowl - Regular Strike' }).click();
  await page.getByRole('button', { name: 'Play Heart Bowl - Amplified Rim' }).click();
  await page.getByRole('button', { name: 'Play Crown Bowl - Hard Strike' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.active-sample').length === 3, null, { timeout: 2_000 });

  for (const [label, volume] of Object.entries(expectedDefaultVolumes)) {
    const card = page.locator('.active-sample').filter({ hasText: label });
    assert(await card.innerText().then(text => text.includes(volume)), `Expected ${label} to start at ${volume}.`);
  }

  await page.locator('.active-sample').first().getByRole('button', { name: 'Stop' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.active-sample').length === 2, null, { timeout: 2_000 });

  await page.locator('.active-sample').first().getByRole('button', { name: 'Fade out' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.active-sample').length === 1, null, { timeout: 5_500 });

  await page.locator('.active-sample').first().getByRole('button', { name: 'Mute' }).click();
  assert(await page.locator('.active-sample').first().innerText().then(text => text.includes('Muted')), 'Expected per-sample mute state.');

  await page.locator('.master-slider input').evaluate(input => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, '0.18');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  assert(await page.locator('.master-slider input').inputValue() === '0.18', 'Expected master slider to update while bowl sample is active.');

  await page.getByRole('button', { name: 'Mute all' }).click();
  assert(await page.locator('.live-status').innerText().then(text => text.trim()) === 'Muted', 'Expected global Mute All to set session status to Muted.');
  assert(await page.locator('.master-slider input').inputValue() === '0', 'Expected global Mute All to silence the master output.');
  assert(await page.locator('.active-sample').first().innerText().then(text => text.includes('Muted')), 'Expected global Mute All to mute active bowl samples.');

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `Expected no horizontal overflow at ${width}px, got ${overflow}px.`);
  }

  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await browser.close();
  console.log('Bowl smoke checks passed.');
} finally {
  stopServer();
}
