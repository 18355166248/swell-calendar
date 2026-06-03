/* eslint-disable no-undef, turbo/no-undeclared-env-vars */
/**
 * jest-playwright 配置
 * @see https://github.com/playwright-community/jest-playwright#configuration
 *
 * 环境变量：
 *   HEADED=true  — 显示浏览器窗口
 *   SLOWMO=5000  — 拖拽操作间隔（ms），默认 300，数值越大演示越慢
 */
const headed = process.env.HEADED === 'true';
const slowMo = headed ? parseInt(process.env.SLOWMO || '300', 10) : 0;

module.exports = {
  launchOptions: {
    headless: !headed,
    slowMo,
  },
  browsers: ['chromium'],
};
