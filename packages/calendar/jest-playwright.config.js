/* eslint-disable no-undef, turbo/no-undeclared-env-vars */
/**
 * jest-playwright 配置
 * @see https://github.com/playwright-community/jest-playwright#configuration
 */
module.exports = {
  // 通过 HEADED 环境变量控制：HEADED=true pnpm test:storybook:headed
  launchOptions: {
    headless: !process.env.HEADED || process.env.HEADED === 'false',
    slowMo: process.env.HEADED ? 300 : 0,
  },
  browsers: ['chromium'],
};
