import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const PLAYWRIGHT_ENTRY =
  '/Users/xmly/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const { chromium } = await import(PLAYWRIGHT_ENTRY);

const appUrl = process.env.S2_VERIFY_URL || 'http://127.0.0.1:4175/';
const screenshotDir = '/private/tmp/swell-calendar-s2-review';

await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1019, height: 685 } });

try {
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /周/i }).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(screenshotDir, 'week-topbar.png'),
    fullPage: true,
  });
  process.stdout.write(`${screenshotDir}/week-topbar.png\n`);
} finally {
  await browser.close();
}
