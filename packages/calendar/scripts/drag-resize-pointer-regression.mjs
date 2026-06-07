/* eslint-disable no-console, no-undef, turbo/no-undeclared-env-vars */
import { chromium } from 'playwright';

const DEFAULT_IFRAME_URL =
  'http://127.0.0.1:6006/iframe.html?id=calendar-scheduler-regression--drag-resize-pointer-regression-demo&viewMode=story';
const STORYBOOK_URL = process.env.STORYBOOK_URL || DEFAULT_IFRAME_URL;
const HEADED = process.env.HEADED === 'true';
const SLOW_MO = Number(process.env.SLOWMO || (HEADED ? 250 : 0));

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function expectCount(page, selector, expected) {
  const count = await page.locator(selector).count();
  if (count !== expected) {
    throw new Error(`Expected ${selector} count to be ${expected}, received ${count}`);
  }
}

async function boxOf(page, selector) {
  const locator = page.locator(selector);
  await locator.waitFor();
  const box = await locator.boundingBox();

  if (!box) {
    throw new Error(`Unable to resolve bounding box for ${selector}`);
  }

  return box;
}

async function pointerGesture(page, selector, steps, startOffset) {
  const box = await boxOf(page, selector);
  const startX = box.x + (startOffset?.x ?? box.width / 2);
  const startY = box.y + (startOffset?.y ?? box.height / 2);

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (const step of steps) {
    await page.mouse.move(startX + step.dx, startY + step.dy, { steps: 8 });
    await wait(40);
  }

  await page.mouse.up();
  await wait(260);
}

async function run() {
  const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOW_MO });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1200 } });

  try {
    await page.goto(STORYBOOK_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="event-card-reg-a"]');

    const allCardsSelector = '[data-testid^="event-card-reg-"]';
    await expectCount(page, allCardsSelector, 13);

    const regABefore = await boxOf(page, '[data-testid="event-card-reg-a"]');
    await pointerGesture(page, '[data-testid="event-card-reg-a"]', [
      { dx: 3, dy: 5 },
      { dx: 0, dy: 78 },
    ]);
    await expectCount(page, '[data-testid="event-card-reg-a"]', 1);
    await expectCount(page, allCardsSelector, 13);
    const regAAfterMove = await boxOf(page, '[data-testid="event-card-reg-a"]');
    if (regAAfterMove.y <= regABefore.y + 5) {
      throw new Error('reg-a did not move downward after real pointer drag');
    }

    const regAHeightBefore = regAAfterMove.height;
    await pointerGesture(page, '[data-testid="resize-handle-bottom-reg-a"]', [
      { dx: 0, dy: 12 },
      { dx: 0, dy: 100 },
    ]);
    const regAAfterResize = await boxOf(page, '[data-testid="event-card-reg-a"]');
    if (regAAfterResize.height <= regAHeightBefore + 10) {
      throw new Error('reg-a bottom resize did not increase height');
    }

    const regBBefore = await boxOf(page, '[data-testid="event-card-reg-b"]');
    await pointerGesture(page, '[data-testid="event-card-reg-b"]', [
      { dx: 4, dy: 4 },
      { dx: 1, dy: 1 },
    ]);
    await expectCount(page, '[data-testid="event-card-reg-b"]', 1);
    await expectCount(page, allCardsSelector, 13);
    await pointerGesture(page, '[data-testid="event-card-reg-b"]', [
      { dx: 3, dy: 5 },
      { dx: 0, dy: 78 },
    ]);
    const regBAfterMove = await boxOf(page, '[data-testid="event-card-reg-b"]');
    if (regBAfterMove.y <= regBBefore.y + 5) {
      throw new Error('reg-b did not move after no-op pointer cycle');
    }

    const regR31Before = await boxOf(page, '[data-testid="event-card-reg-r3-1"]');
    await pointerGesture(page, '[data-testid="resize-handle-bottom-reg-r3-1"]', [
      { dx: 0, dy: 12 },
      { dx: 0, dy: 90 },
    ]);
    await expectCount(page, '[data-testid="event-card-reg-r3-1"]', 1);
    const regR31AfterBottom = await boxOf(page, '[data-testid="event-card-reg-r3-1"]');
    if (regR31AfterBottom.height <= regR31Before.height + 10) {
      throw new Error('reg-r3-1 bottom resize did not increase height');
    }

    const regR31TopBefore = regR31AfterBottom.y;
    await pointerGesture(page, '[data-testid="resize-handle-top-reg-r3-1"]', [
      { dx: 0, dy: -12 },
      { dx: 0, dy: -80 },
    ]);
    await expectCount(page, '[data-testid="event-card-reg-r3-1"]', 1);
    const regR31AfterTop = await boxOf(page, '[data-testid="event-card-reg-r3-1"]');
    if (regR31AfterTop.y >= regR31TopBefore - 5) {
      throw new Error('reg-r3-1 top resize did not move the card upward');
    }

    const regBHeightBefore = regBAfterMove.height;
    await pointerGesture(page, '[data-testid="resize-handle-bottom-reg-b"]', [
      { dx: 0, dy: 12 },
      { dx: 0, dy: 90 },
    ]);
    await expectCount(page, '[data-testid="event-card-reg-b"]', 1);
    const regBAfterResize = await boxOf(page, '[data-testid="event-card-reg-b"]');
    if (regBAfterResize.height <= regBHeightBefore + 10) {
      throw new Error('reg-b bottom resize did not work after cross-column pointer interactions');
    }

    console.log('Drag/resize pointer regression passed.');
  } finally {
    await page.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
