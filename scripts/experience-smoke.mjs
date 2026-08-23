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

  const facilitatorChannel = page.locator('.channel').first();
  const facilitatorToggle = facilitatorChannel.locator('input[type="checkbox"]');
  const facilitatorVolume = facilitatorChannel.locator('input[type="range"]');
  await facilitatorToggle.check();
  const preservedVolume = await facilitatorVolume.inputValue();

  await page.getByRole('button', { name: 'Experience Mode' }).click();
  assert(await page.getByRole('heading', { name: 'Experience Mode' }).count() === 1, 'Expected Experience Mode heading.');
  assert(await page.locator('.chakra-node').count() === 7, 'Expected seven chakra positions.');
  assert(await page.locator('.chakra-node.active').count() === 3, 'Expected three active chakras.');
  assert(await page.locator('.chakra-node.inactive').count() === 4, 'Expected four inactive chakras.');
  assert(await page.locator('.chakra-node.inactive').allTextContents().then(items => items.every(text => text.includes('Coming soon'))), 'Expected inactive chakras to say Coming soon.');
  assert(await page.locator('.experience-control-panel').count() === 1, 'Expected one selected chakra control panel.');
  assert(await page.locator('.experience-control-panel').evaluate(node => !node.closest('.geometry-field')), 'Expected selected controls outside the geometry field.');
  assert(await page.locator('.audio-reactive-spiral').count() === 1, 'Expected the live audio visualizer canvas.');
  const environmentPicker = page.getByLabel('Visual environment');
  assert(await environmentPicker.locator('option').allTextContents().then(items => items.join('|')) === 'Pearl Flow|Violet Flow|Chakra Flow|Reactive Spiral|Still / None', 'Expected all visual environments.');
  await environmentPicker.selectOption('violet');
  assert(await page.locator('.visual-environment-video').count() === 1, 'Expected the selected visual environment video.');
  assert(await page.locator('.visual-environment-video').evaluate(video => video.muted && video.loop && video.playsInline), 'Expected visual environment video to be muted, looping, and inline.');
  await environmentPicker.selectOption('still');
  assert(await page.locator('.visual-environment-video').count() === 0, 'Expected Still / None to stop visual video playback.');
  await environmentPicker.selectOption('pearl');
  assert(await page.locator('.live-essentials').count() === 1, 'Expected Live Essentials controls.');
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
  const timer = page.locator('.live-essential-timer strong');
  await page.waitForTimeout(1100);
  assert((await timer.textContent()) !== '00:00', 'Expected the session timer to start with audio.');
  await page.getByRole('button', { name: 'Pause timer' }).click();
  assert(await page.getByRole('button', { name: 'Resume timer' }).count() === 1, 'Expected timer pause/resume controls.');
  await page.getByRole('button', { name: 'Duck for voice' }).click();
  assert(await page.getByRole('button', { name: 'Restore voice mix' }).count() === 1, 'Expected manual voice ducking.');
  assert(await page.locator('.audio-reactive-spiral').evaluate(canvas => canvas.getBoundingClientRect().width > 0 && canvas.getBoundingClientRect().height > 0), 'Expected the analyser visualizer to initialize safely.');
  await page.getByRole('button', { name: 'Regular Strike' }).click();
  await page.getByRole('button', { name: 'Mute bowl' }).waitFor({ state: 'visible', timeout: 5000 });
  assert(await page.locator('.core-playback').filter({ hasText: 'Bowl is sounding' }).count() === 1, 'Expected bowl playback to work in Experience Mode.');
  await page.getByRole('button', { name: 'Mute all' }).click();
  assert(await page.locator('.core-playback').filter({ hasText: 'Muted during playback' }).count() === 1, 'Expected Mute All to mute Experience Mode bowl playback.');

  for (const width of [1440, 1024, 768, 430, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `Expected no Experience Mode overflow at ${width}px, got ${overflow}px.`);
  }
  await page.setViewportSize({ width: 844, height: 390 });
  const experienceLandscapeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(experienceLandscapeOverflow <= 1, `Expected no Experience Mode landscape overflow, got ${experienceLandscapeOverflow}px.`);

  await page.setViewportSize({ width: 390, height: 1100 });
  await page.getByRole('button', { name: 'Facilitator Mode' }).click();
  assert(await page.getByRole('heading', { name: 'Repeatable setups' }).count() === 1, 'Expected Facilitator Mode to remain available.');
  assert(await facilitatorToggle.isChecked(), 'Expected generated channel enabled state to be restored after returning to Facilitator Mode.');
  assert(await facilitatorVolume.inputValue() === preservedVolume, 'Expected generated channel volume to be restored after returning to Facilitator Mode.');
  assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'Expected no horizontal overflow at 390px.');
  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await browser.close();
  console.log('Experience Mode smoke checks passed.');
} finally {
  stopServer();
}
