/* eslint-disable no-undef, turbo/no-undeclared-env-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const { getJestConfig } = require('@storybook/test-runner');

const testRunnerConfig = getJestConfig();

// HEADED=true 时显示浏览器窗口，用于演示/调试
const headed = process.env.HEADED === 'true';
// 演示模式下每个操作间隔（ms），可通过 SLOWMO=2000 覆盖
const slowMo = headed ? parseInt(process.env.SLOWMO || '5000', 10) : 0;

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...testRunnerConfig,

  // headed 模式下放宽超时（慢动作需要更长时间）
  testTimeout: headed ? 120000 : 30000,

  // 演示模式下只跑带 play 函数的 Scheduler stories，其余故事跳过
  ...(headed
    ? {
        // 只跑 Scheduler stories（精确匹配源文件路径，排除 dist/.d.ts）
        testMatch: ['**/src/stories/Calendar/Scheduler.stories.*'],
      }
    : {}),

  testEnvironmentOptions: {
    ...testRunnerConfig.testEnvironmentOptions,
    'jest-playwright': {
      ...(testRunnerConfig.testEnvironmentOptions?.['jest-playwright'] || {}),
      // SERVER 模式只支持 headless，headed 模式改为 LAUNCH 才能弹出浏览器窗口
      ...(headed
        ? {
            launchType: 'LAUNCH',
            launchOptions: { headless: false, slowMo },
          }
        : {}),
    },
  },
};
