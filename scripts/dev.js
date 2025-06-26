#!/usr/bin/env node

const { execSync } = require('child_process');

// 获取参数
const args = process.argv.slice(2);
const target = args[0] || 'docs';

console.log(`🚀 启动开发环境: ${target}`);

try {
  // 使用turbo运行dev命令
  execSync(`node scripts/run.js turbo run dev --filter=${target}`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ 启动开发环境失败:', error.message);
  process.exit(1);
}
