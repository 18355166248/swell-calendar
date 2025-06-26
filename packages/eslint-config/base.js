import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * 仓库的共享 ESLint 配置
 * 这个配置文件为整个项目提供统一的代码质量检查规则
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  // 使用 ESLint 推荐的 JavaScript 规则
  js.configs.recommended,
  // 禁用与 Prettier 冲突的 ESLint 规则
  // 这确保 ESLint 和 Prettier 不会产生冲突
  eslintConfigPrettier,
  // 使用 TypeScript ESLint 推荐的规则
  // 包括 TypeScript 特定的语法检查和最佳实践
  ...tseslint.configs.recommended,
  // Turbo 插件配置
  // 用于在 monorepo 中检查环境变量的使用
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      // 警告未声明的环境变量使用
      // 这有助于确保所有环境变量都在 turbo.json 中正确声明
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  // only-warn 插件配置
  // 将所有 ESLint 错误降级为警告，避免构建失败
  // 这对于开发环境很有用，可以继续开发而不被错误阻塞
  {
    plugins: {
      onlyWarn,
    },
  },
  // 忽略规则配置
  // 忽略 dist 目录下的所有文件，避免对构建产物进行检查
  {
    ignores: ['dist/**'],
  },
];
