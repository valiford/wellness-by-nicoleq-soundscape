import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:5176';
const server = spawn('npm run dev -- --host 127.0.0.1 --port 5176', { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', chunk => { output += chunk.toString(); });
server.stderr.on('data', chunk => { output += chunk.toString(); });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function stopServer() {
  if (!server.pid || server.killed) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* best effort */ }
  } else server.kill('SIGTERM');
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* still starting */ }
    await wait(250);
  }
  throw new Error(`Vite dev server did not start.\n${output}`);
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 1100 } });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Experience Mode' }).click();
  assert(await page.getByRole('heading', { name: 'Experience Mode' }).count() === 1, 'Expected Experience Mode heading.');
  assert(await page.locator('.chakra-node').count() === 7, 'Expected seven chakra positions.');
  assert(await page.locator('.chakra-node.active').count() === 3, 'Expected three active chakras.');
  assert(await page.locator('.chakra-node.inactive').count() === 4, 'Expected four inactive chakras.');
  assert(await page.locator('.chakra-node.inactive').allTextContents().then(items => items.every(text => text.includes('Coming soon'))), 'Expected inactive chakras to say Coming soon.');
  assert(await page.locator('.experience-control-panel').count() === 1, 'Expected one selected chakra control panel.');
  assert(await page.locator('.experience-control-panel').evaluate(node => !node.closest('.geometry-field')), 'Expected selected controls outside the geometry field.');
  assert(await page.locator('.audio-reactive-spiral').count() === 1, 'Expected the live audio visualizer canvas.');
  assert(await page.locator('.channel').count() === 0, 'Expected generated channel controls to stay in Facilitator Mode.');
  assert(await page.locator('.bowl-tile.unavailable').count() === 4, 'Expected four unavailable bowl tiles.');
  assert(await page.locator('.bowl-tile.unavailable').evaluateAll(items => items.every(item => item.disabled)), 'Expected unavailable bowl tiles to be disabled.');

  const tiles = await page.locator('.tile-copy strong').allTextContents();
  assert(tiles.map(text => text.trim()).join('|') === 'Crown|Third Eye|Throat|Heart|Solar Plexus|Sacral|Root', 'Expected bowl tiles ordered Crown to Root.');
  await page.getByRole('button', { name: /Crown, volume/ }).click();
  assert(await page.getByRole('heading', { name: 'Crown' }).count() === 1, 'Expected bowl selection to update center panel.');
  assert(await page.getByRole('button', { name: 'Regular Strike' }).count() === 1, 'Expected active center controls.');

  const volume = page.getByLabel('Crown volume');
  const before = await volume.inputValue();
  await volume.fill('0.82');
  assert(await volume.inputValue() === '0.82' && before !== '0.82', 'Expected active chakra volume feedback.');
  assert(await page.locator('.geometry-ring').count() === 3 && await page.locator('.spiral-core').count() === 1, 'Expected sacred geometry and spiral core.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.locator('.spiral-core').evaluate(node => getComputedStyle(node, '::before').animationName === 'none'), 'Expected reduced motion to disable the spiral animation.');
  await page.getByRole('button', { name: 'Start audio' }).click();
  assert(await page.locator('.audio-reactive-spiral').evaluate(canvas => canvas.getBoundingClientRect().width > 0 && canvas.getBoundingClientRect().height > 0), 'Expected the analyser visualizer to initialize safely.');
  await page.getByRole('button', { name: 'Regular Strike' }).click();
  await page.waitForTimeout(100);
  assert(await page.locator('.active-sample-list').count() === 1, 'Expected bowl playback to work in Experience Mode.');
  await page.getByRole('button', { name: 'Mute all' }).click();
  assert(await page.locator('.sample-muted').count() === 1, 'Expected Mute All to mute Experience Mode bowl playback.');

  await page.getByRole('button', { name: 'Facilitator Mode' }).click();
  assert(await page.getByRole('heading', { name: 'Repeatable setups' }).count() === 1, 'Expected Facilitator Mode to remain available.');
  assert(await page.locator('.channel input[type="checkbox"]').evaluateAll(items => items.every(item => !item.checked)), 'Expected generated channels to remain off after returning to Facilitator Mode.');
  assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'Expected no horizontal overflow at 390px.');
  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await browser.close();
  console.log('Experience Mode smoke checks passed.');
} finally {
  stopServer();
}
