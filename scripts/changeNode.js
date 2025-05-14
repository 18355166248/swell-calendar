#!/usr/bin/env node

const { execSync } = require('child_process');

// 获取参数
const args = process.argv.slice(2);
const nodeVersion = args[0] || '20';
const commands = args.slice(1).join(' ');

// 检查是否提供了命令
if (!commands) {
  console.error('请提供要执行的命令');
  console.error('用法: node changeNode.js [node版本] [命令]');
  console.error('例如: node changeNode.js 20 pnpm dev --filter docs');
  process.exit(1);
}

try {
  // 设置环境变量并执行nvm use
  console.log(`正在切换到Node版本: ${nodeVersion}`);

  // 构建包含nvm初始化和使用的命令
  const nvmCommand = `
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
    nvm use ${nodeVersion} && ${commands}
  `;

  // 执行命令
  console.log(`正在执行命令: ${commands}`);
  execSync(nvmCommand, { stdio: 'inherit', shell: '/bin/bash' });
} catch (error) {
  console.error('执行命令失败:', error.message);
  process.exit(1);
}
