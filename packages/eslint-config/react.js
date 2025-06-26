import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import globals from 'globals';
import { config as baseConfig } from './base.js';

/**
 * 为使用 React 的库定制的 ESLint 配置
 * 这个配置包含了 React 开发所需的所有必要规则
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
  // 继承基础配置 - 包含通用的代码质量和格式化规则
  ...baseConfig,
  // 使用 ESLint 推荐的 JavaScript 规则 - 包含常见的代码错误检测
  js.configs.recommended,
  // 禁用与 Prettier 冲突的规则 - 确保 ESLint 和 Prettier 不会相互干扰
  eslintConfigPrettier,
  // 使用 TypeScript ESLint 推荐的规则 - 包含 TypeScript 特定的语法检查
  ...tseslint.configs.recommended,
  // 使用 React 插件推荐的规则 - 包含 React 最佳实践和常见错误检测
  pluginReact.configs.flat.recommended,
  {
    ignores: [
      'node_modules/', // 忽略 node_modules 目录
      'dist/', // 忽略构建输出目录
      '.eslintrc.js', // 忽略 ESLint 配置文件本身
      '**/*.css', // 忽略所有 CSS 文件
    ],
  },
  {
    // 语言选项配置 - 定义代码运行环境和可用的全局变量
    languageOptions: {
      // 继承 React 推荐配置的语言选项 - 包含 JSX 解析等设置
      ...pluginReact.configs.flat.recommended.languageOptions,
      // 定义全局变量，包括 Service Worker 和浏览器环境
      // 这样 ESLint 就知道这些全局变量是合法的，不会报错
      globals: {
        // Service Worker 环境的全局变量（如 self, caches 等）
        ...globals.serviceworker,
        // 浏览器环境的全局变量（如 window, document 等）
        ...globals.browser,
      },
    },
  },

  {
    // 插件配置 - 启用额外的 ESLint 插件
    plugins: {
      // 启用 React Hooks 规则插件 - 用于检查 Hooks 的使用规则
      'react-hooks': pluginReactHooks,
    },
    // React 设置 - 配置 React 相关的选项
    settings: {
      // 自动检测 React 版本，确保规则与当前版本兼容
      react: { version: 'detect' },
    },
    // 规则配置 - 定义具体的代码检查规则
    rules: {
      // 使用 React Hooks 推荐的规则 - 包含 Hooks 的使用顺序和依赖检查
      ...pluginReactHooks.configs.recommended.rules,
      // 关闭 React 在 JSX 作用域中的规则
      // 因为新的 JSX 转换（React 17+）不再需要显式导入 React
      // 这样可以减少不必要的 import 语句
      'react/react-in-jsx-scope': 'off',
    },
  },
];
