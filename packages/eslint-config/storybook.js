import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import pluginStorybook from 'eslint-plugin-storybook';
import pluginMdx from 'eslint-plugin-mdx';
import onlyWarn from 'eslint-plugin-only-warn';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * 为 Storybook 项目定制的 ESLint 配置
 * 这个配置包含了 Storybook 开发所需的所有必要规则
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  // 继承基础配置 - 包含通用的代码质量和格式化规则
  ...baseConfig,

  {
    ignores: [
      'node_modules/', // 忽略 node_modules 目录
      'dist/', // 忽略构建输出目录
    ],
  },

  // 使用 ESLint 推荐的 JavaScript 规则
  js.configs.recommended,

  // 禁用与 Prettier 冲突的规则
  eslintConfigPrettier,

  // 使用 TypeScript ESLint 推荐的规则
  ...tseslint.configs.recommended,

  // Storybook 插件推荐的规则
  pluginStorybook.configs.recommended,

  // MDX 插件推荐的规则
  pluginMdx.configs.recommended,

  {
    // 语言选项配置
    languageOptions: {
      // 定义全局变量
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        ...globals.browser,
      },
    },
  },

  {
    // 插件配置
    plugins: {
      // 启用 only-warn 插件，将所有错误降级为警告
      onlyWarn,
    },

    // 规则配置
    rules: {
      // 关闭默认导出检查，允许使用默认导出
      'import/no-default-export': 'off',
    },
  },
];
