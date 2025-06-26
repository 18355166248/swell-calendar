#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// 获取参数
const args = process.argv.slice(2);
const commands = args.join(' ');

// 检查是否提供了命令
if (!commands) {
  console.error('请提供要执行的命令');
  console.error('用法: node run.js [命令]');
  console.error('例如: node run.js pnpm dev');
  console.error('例如: node run.js pnpm build');
  process.exit(1);
}

// 读取项目根目录的package.json来获取Node版本要求
function getRequiredNodeVersion() {
  try {
    // 首先检查当前目录
    let packageJsonPath = path.join(process.cwd(), 'package.json');

    // 如果当前目录没有package.json，尝试查找父目录
    if (!fs.existsSync(packageJsonPath)) {
      packageJsonPath = path.join(process.cwd(), '../../package.json');
    }

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.engines && packageJson.engines.node) {
        return packageJson.engines.node;
      }
    }

    // 默认要求Node 18+
    return '>=18';
  } catch (error) {
    console.warn('无法读取package.json，使用默认Node版本要求: >=18');
    return '>=18';
  }
}

// 获取当前Node版本
function getCurrentNodeVersion() {
  try {
    const currentVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    return currentVersion.replace(/^v/, '');
  } catch (error) {
    console.error('获取当前Node版本失败:', error.message);
    return null;
  }
}

// 检查版本是否满足要求
function isVersionSatisfied(currentVersion, requirement) {
  if (!currentVersion) return false;

  // 解析版本要求
  let minVersion = '18'; // 默认最小版本

  if (requirement.startsWith('>=')) {
    minVersion = requirement.substring(2);
  } else if (requirement.startsWith('>')) {
    minVersion = requirement.substring(1);
  } else if (requirement.includes(' - ')) {
    minVersion = requirement.split(' - ')[0];
  } else if (!isNaN(parseInt(requirement))) {
    minVersion = requirement;
  }

  // 比较主版本号
  const currentMajor = parseInt(currentVersion.split('.')[0]);
  const minMajor = parseInt(minVersion.split('.')[0]);

  return currentMajor >= minMajor;
}

// 切换Node版本并执行命令
function switchNodeVersionAndExecute(targetVersion, commands) {
  const isWindows = os.platform() === 'win32';

  if (isWindows) {
    try {
      // Windows下使用cmd执行
      const fullCommand = `nvm use ${targetVersion} && ${commands}`;
      execSync(fullCommand, { stdio: 'inherit', shell: 'cmd.exe' });
    } catch (e) {
      console.error('Windows下nvm命令执行失败，请确保已安装NVM for Windows并添加到环境变量中');
      console.error('错误详情:', e.message);
      process.exit(1);
    }
  } else {
    // Mac/Linux下的nvm命令
    const nvmCommand = `
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
      nvm use ${targetVersion} && ${commands}
    `;
    execSync(nvmCommand, { stdio: 'inherit', shell: '/bin/bash' });
  }
}

try {
  // 获取Node版本要求
  const requiredVersion = getRequiredNodeVersion();
  console.log(`📋 项目要求的Node版本: ${requiredVersion}`);

  // 获取当前Node版本
  const currentVersion = getCurrentNodeVersion();
  console.log(`🔍 当前Node版本: ${currentVersion ? 'v' + currentVersion : '未知'}`);

  // 检查版本是否满足要求
  if (currentVersion && isVersionSatisfied(currentVersion, requiredVersion)) {
    console.log('✅ Node版本符合要求，直接执行命令...');
    console.log(`🚀 正在执行命令: ${commands}`);
    execSync(commands, { stdio: 'inherit' });
  } else {
    // 版本不满足要求，需要切换
    const recommendedVersion = '20'; // 推荐使用Node 20
    console.log(`❌ Node版本不符合要求，正在切换到推荐版本: ${recommendedVersion}`);

    // 切换Node版本并执行命令
    switchNodeVersionAndExecute(recommendedVersion, commands);
  }
} catch (error) {
  console.error('❌ 执行命令失败:', error.message);
  process.exit(1);
}
