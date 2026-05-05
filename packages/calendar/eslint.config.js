import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

import { config } from '@repo/eslint-config/react.js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // 品味不变式（harness engineering: 机械化执行）

      // 禁止裸 console — 组件库不应污染宿主环境的控制台
      // Fix: 删除调试语句，或抽取到用户可配置的 logger 接口
      "no-console": "warn",

      // 文件行数上限 — 超过 400 行须拆分到 domain-specific 子模块
      // Fix: 参考 packages/calendar/AGENTS.md#常见模式 拆分建议
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],

      // 导入排序 — 保持导入顺序可预测，智能体更易理解依赖关系
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",

      // 清理未使用的导入
      "unused-imports/no-unused-imports": "warn",
    },
  },
  {
    // Stories 文件豁免行数限制（数据密集）
    files: ["src/stories/**"],
    rules: {
      "max-lines": "off",
      "no-console": "off",
    },
  },
];
