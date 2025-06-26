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
  console.error('用法: node checkNodeVersion.js [命令]');
  console.error('例如: node checkNodeVersion.js pnpm dev');
  process.exit(1);
}

// 读取项目根目录的package.json来获取Node版本要求
function getRequiredNodeVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.engines && packageJson.engines.node) {
      return packageJson.engines.node;
    }

    // 如果没有找到engines配置，检查当前目录是否是子包
    const parentPackageJsonPath = path.join(process.cwd(), '../../package.json');
    if (fs.existsSync(parentPackageJsonPath)) {
      const parentPackageJson = JSON.parse(fs.readFileSync(parentPackageJsonPath, 'utf8'));
      if (parentPackageJson.engines && parentPackageJson.engines.node) {
        return parentPackageJson.engines.node;
      }
    }

    // 默认要求Node 18+
    return '>=18';
  } catch (error) {
    console.warn('无法读取package.json，使用默认Node版本要求: >=18');
    return '>=18';
  }
}

// 解析版本要求
function parseVersionRequirement(requirement) {
  if (requirement.startsWith('>=')) {
    return {
      minVersion: requirement.substring(2),
      operator: '>=',
    };
  } else if (requirement.startsWith('>')) {
    return {
      minVersion: requirement.substring(1),
      operator: '>',
    };
  } else if (requirement.startsWith('<=')) {
    return {
      maxVersion: requirement.substring(2),
      operator: '<=',
    };
  } else if (requirement.startsWith('<')) {
    return {
      maxVersion: requirement.substring(1),
      operator: '<',
    };
  } else if (requirement.includes(' - ')) {
    const [min, max] = requirement.split(' - ');
    return {
      minVersion: min,
      maxVersion: max,
      operator: 'range',
    };
  } else {
    // 假设是精确版本
    return {
      exactVersion: requirement,
      operator: '=',
    };
  }
}

// 比较版本号
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

// 检查版本是否满足要求
function isVersionSatisfied(currentVersion, requirement) {
  const parsed = parseVersionRequirement(requirement);

  switch (parsed.operator) {
    case '>=':
      return compareVersions(currentVersion, parsed.minVersion) >= 0;
    case '>':
      return compareVersions(currentVersion, parsed.minVersion) > 0;
    case '<=':
      return compareVersions(currentVersion, parsed.maxVersion) <= 0;
    case '<':
      return compareVersions(currentVersion, parsed.maxVersion) < 0;
    case '=':
      return currentVersion === parsed.exactVersion;
    case 'range':
      return (
        compareVersions(currentVersion, parsed.minVersion) >= 0 &&
        compareVersions(currentVersion, parsed.maxVersion) <= 0
      );
    default:
      return true;
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

// 获取推荐的Node版本
function getRecommendedNodeVersion(requirement) {
  const parsed = parseVersionRequirement(requirement);

  if (parsed.operator === '>=') {
    // 对于 >=18 这样的要求，推荐使用最新的LTS版本
    return '20';
  } else if (parsed.exactVersion) {
    return parsed.exactVersion;
  } else if (parsed.minVersion) {
    // 使用最小版本号的主版本
    return parsed.minVersion.split('.')[0];
  }

  return '20'; // 默认推荐Node 20
}

// 切换Node版本
function switchNodeVersion(targetVersion) {
  const isWindows = os.platform() === 'win32';

  if (isWindows) {
    try {
      execSync(`nvm use ${targetVersion}`, { stdio: 'inherit' });
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
      nvm use ${targetVersion}
    `;
    execSync(nvmCommand, { stdio: 'inherit', shell: '/bin/bash' });
  }
}

try {
  // 获取Node版本要求
  const requiredVersion = getRequiredNodeVersion();
  console.log(`项目要求的Node版本: ${requiredVersion}`);

  // 获取当前Node版本
  const currentVersion = getCurrentNodeVersion();
  console.log(`当前Node版本: ${currentVersion ? 'v' + currentVersion : '未知'}`);

  // 检查版本是否满足要求
  if (currentVersion && isVersionSatisfied(currentVersion, requiredVersion)) {
    console.log('✅ Node版本符合要求，直接执行命令...');
    console.log(`正在执行命令: ${commands}`);
    execSync(commands, { stdio: 'inherit' });
  } else {
    // 版本不满足要求，需要切换
    const recommendedVersion = getRecommendedNodeVersion(requiredVersion);
    console.log(`❌ Node版本不符合要求，正在切换到推荐版本: ${recommendedVersion}`);

    // 切换Node版本
    switchNodeVersion(recommendedVersion);

    // 重新执行命令
    console.log(`正在执行命令: ${commands}`);
    execSync(commands, { stdio: 'inherit' });
  }
} catch (error) {
  console.error('执行命令失败:', error.message);
  process.exit(1);
}
