import { mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// playwright 走常规解析，跨平台可用；S2_VERIFY_PLAYWRIGHT 可显式指向自定义入口。
async function loadChromium() {
  const override = process.env.S2_VERIFY_PLAYWRIGHT;
  try {
    const mod = await import(override || 'playwright');
    return mod.chromium;
  } catch (err) {
    throw new Error(
      'playwright 未安装或无法解析。请先安装（pnpm add -D playwright），' +
        '或用 S2_VERIFY_PLAYWRIGHT 指定入口文件。\n原始错误：' +
        err.message
    );
  }
}

const chromium = await loadChromium();

const appUrl = process.env.S2_VERIFY_URL || 'http://127.0.0.1:4175/';
const screenshotDir =
  process.env.S2_VERIFY_OUT || path.join(os.tmpdir(), 'swell-calendar-s2-review');

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
