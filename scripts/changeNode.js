#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

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

// 获取当前Node版本
function getCurrentNodeVersion() {
  try {
    const currentVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    // 移除版本号前的 'v' 前缀
    return currentVersion.replace(/^v/, '');
  } catch (error) {
    console.error('获取当前Node版本失败:', error.message);
    return null;
  }
}

// 检查版本是否匹配
function isVersionMatch(current, target) {
  if (!current) return false;

  // 如果目标版本只是主版本号（如'20'），则只比较主版本号
  const currentMajor = current.split('.')[0];
  const targetMajor = target.split('.')[0];

  return currentMajor === targetMajor;
}

try {
  // 获取当前Node版本
  const currentVersion = getCurrentNodeVersion();
  console.log(`当前Node版本: ${currentVersion ? 'v' + currentVersion : '未知'}`);
  console.log(`目标Node版本: ${nodeVersion}`);

  // 检查版本是否匹配
  if (currentVersion && isVersionMatch(currentVersion, nodeVersion)) {
    console.log('当前Node版本已符合要求，直接执行命令...');
    console.log(`正在执行命令: ${commands}`);
    execSync(commands, { stdio: 'inherit' });
  } else {
    // 版本不匹配，需要切换
    console.log(`正在切换到Node版本: ${nodeVersion}`);
    console.log(`正在执行命令: ${commands}`);

    // 检测操作系统
    const isWindows = os.platform() === 'win32';
    let nvmCommand;

    if (isWindows) {
      try {
        // Windows下的nvm命令可能需要特殊处理
        // 首先尝试直接使用nvm命令
        execSync(`nvm use ${nodeVersion}`, { stdio: 'inherit' });
        // 如果成功，继续执行用户命令
        execSync(commands, { stdio: 'inherit' });
      } catch (e) {
        console.error('Windows下nvm命令执行失败，请确保已安装NVM for Windows并添加到环境变量中');
        console.error('错误详情:', e.message);
        process.exit(1);
      }
    } else {
      // Mac/Linux下的nvm命令
      nvmCommand = `
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
        nvm use ${nodeVersion} && ${commands}
      `;
      execSync(nvmCommand, { stdio: 'inherit', shell: '/bin/bash' });
    }
  }
} catch (error) {
  console.error('执行命令失败:', error.message);
  process.exit(1);
}
