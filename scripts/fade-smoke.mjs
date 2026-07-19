import { execFileSync, spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:5173';

const server = spawn(
  'npm run dev -- --host 127.0.0.1',
  { shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
);

let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function stopServer() {
  if (!server.pid || server.killed) return;
  if (process.platform === 'win32') {
    execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  server.kill('SIGTERM');
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newConsolePage(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const overlayCount = await page.locator('.vite-error-overlay, #webpack-dev-server-client-overlay').count();
  assert(overlayCount === 0, 'Expected no Vite/browser error overlay.');
  return { page, errors };
}

async function statusText(page) {
  return (await page.locator('.live-status').innerText()).trim();
}

async function masterValue(page) {
  return Number(await page.locator('.master-slider input').inputValue());
}

async function setMasterValue(page, value) {
  await page.locator('.master-slider input').evaluate((input, nextValue) => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, String(nextValue));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function testFadeOutAndIn(browser) {
  const { page, errors } = await newConsolePage(browser);
  const priorLevel = await masterValue(page);

  await page.getByRole('button', { name: 'Start audio' }).click();
  await page.getByRole('button', { name: 'Fade out' }).click();
  await page.waitForFunction(() => Number(document.querySelector('.master-slider input')?.value) === 0, null, { timeout: 7_000 });

  assert(await statusText(page) === 'Muted', 'Fade Out should set status to Muted when complete.');
  assert(await masterValue(page) === 0, 'Fade Out should set displayed master level to 0.');

  await page.getByRole('button', { name: 'Fade in' }).click();
  await page.waitForFunction(
    expected => Number(document.querySelector('.master-slider input')?.value) === expected,
    priorLevel,
    { timeout: 5_000 },
  );

  assert(await statusText(page) === 'Active', 'Fade In should set status to Active when complete.');
  assert(await masterValue(page) === priorLevel, 'Fade In should restore the prior non-zero master level.');
  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await page.close();
}

async function testStopDuringFadeStaysStopped(browser) {
  const { page, errors } = await newConsolePage(browser);

  await page.getByRole('button', { name: 'Start audio' }).click();
  await page.getByRole('button', { name: 'Fade out' }).click();
  await wait(800);
  await page.getByRole('button', { name: 'Stop audio' }).click();

  assert(await statusText(page) === 'Stopped', 'Stop should immediately set status to Stopped.');
  await wait(6_300);
  assert(await statusText(page) === 'Stopped', 'Stop during fade should remain Stopped after original fade duration.');
  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await page.close();
}

async function testSliderCancelsPendingFadeStatus(browser) {
  const { page, errors } = await newConsolePage(browser);

  await page.getByRole('button', { name: 'Start audio' }).click();
  await page.getByRole('button', { name: 'Fade out' }).click();
  await wait(800);
  await setMasterValue(page, 0.3);

  assert(await statusText(page) === 'Active', 'Changing the master slider during fade should set status back to Active.');
  await wait(6_300);
  assert(await statusText(page) === 'Active', 'Canceled fade should not later set status to Muted.');
  assert(await masterValue(page) === 0.3, 'Canceled fade should not later overwrite the displayed master value.');
  assert(errors.length === 0, `Unexpected console errors: ${errors.join('\n')}`);
  await page.close();
}

try {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });
  console.log('Running fade out / fade in smoke check...');
  await testFadeOutAndIn(browser);
  console.log('Running stop-during-fade smoke check...');
  await testStopDuringFadeStaysStopped(browser);
  console.log('Running slider-cancels-fade smoke check...');
  await testSliderCancelsPendingFadeStatus(browser);
  await browser.close();
  console.log('Fade smoke checks passed.');
} finally {
  stopServer();
}
