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

const appUrl = process.env.S2_VERIFY_URL || 'http://127.0.0.1:4173/';
const screenshotDir =
  process.env.S2_VERIFY_OUT || path.join(os.tmpdir(), 'swell-calendar-s2-review');

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

async function clickFirstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible()) {
      await candidate.click();
      return;
    }
  }

  throw new Error('No visible element matched locator');
}

await mkdir(screenshotDir, { recursive: true });

// 这是一条一次性验收脚本：模拟用户切换视图、点击事件与切周末开关，
// 直接验证 review 修复是否在真实浏览器渲染中生效，而不是只停留在构建通过。
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1080 } });

try {
  await page.goto(appUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const schedulerDayLabels = page.locator('[class*="scheduler-header-day-label"]');
  const schedulerEvent = page.getByText('产品双周评审').first();
  await schedulerEvent.click();
  const schedulerPopoverText = cleanText(await page.locator('.pop').innerText());
  const schedulerDayCountBefore = await schedulerDayLabels.count();
  await page.screenshot({ path: path.join(screenshotDir, 'scheduler-before.png'), fullPage: true });
  await page.locator('.pop-x').click();
  await page.waitForTimeout(150);

  await page.getByText('显示周末').click();
  await page.waitForTimeout(250);
  const schedulerDayCountAfter = await schedulerDayLabels.count();
  await page.screenshot({
    path: path.join(screenshotDir, 'scheduler-workweek.png'),
    fullPage: true,
  });

  await clickFirstVisible(page.locator('.nav-item', { hasText: '时间线' }));
  await page.waitForTimeout(400);

  const timelineResourceItems = page.locator('[class*="timeline-resource-item"]');
  const timelineEvent = page
    .locator('[class*="timeline-event"]')
    .filter({ hasText: '产品双周评审' })
    .first();
  await timelineEvent.click();
  const timelinePopoverText = cleanText(await page.locator('.pop').innerText());
  const timelineResourceCount = await timelineResourceItems.count();
  await page.screenshot({ path: path.join(screenshotDir, 'timeline.png'), fullPage: true });

  const result = {
    schedulerDayCountBefore,
    schedulerDayCountAfter,
    schedulerPopoverText,
    timelineResourceCount,
    timelinePopoverText,
    screenshotDir,
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await browser.close();
}
