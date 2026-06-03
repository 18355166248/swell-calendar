import type { TestRunnerConfig } from '@storybook/test-runner';

/**
 * Storybook test-runner 配置
 *
 * 用于自动运行所有 stories 的 play 函数并验证交互逻辑。
 * 运行命令: npx test-storybook 或 pnpm test-storybook
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    // 等待 story 渲染完成后再执行 play 函数
    await page.waitForLoadState('networkidle');
  },

  async postVisit(page) {
    // 每次 story 跑完后确保清理完毕
    await page.waitForLoadState('networkidle');
  },

  // 可选：通过 tags 控制要运行的 stories
  // tags: {
  //   include: ['test-ready'],
  //   exclude: ['no-test', 'skip'],
  // },
};

export default config;
