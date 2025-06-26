# Node版本管理脚本

本项目提供了自动化的Node版本管理功能，确保所有命令都在正确的Node版本下执行。

## 脚本说明

### `run.js` - 通用命令执行器
自动检查Node版本要求并执行任何命令。

**用法:**
```bash
node scripts/run.js [命令]
```

**示例:**
```bash
node scripts/run.js pnpm dev
node scripts/run.js pnpm build
node scripts/run.js npm test
```

### `dev.js` - 开发环境启动器
专门用于启动开发环境，支持指定目标包。

**用法:**
```bash
node scripts/dev.js [目标包名]
```

**示例:**
```bash
node scripts/dev.js docs      # 启动docs开发环境
node scripts/dev.js calendar  # 启动calendar开发环境
node scripts/dev.js          # 默认启动docs
```

### `changeNode.js` - 指定版本切换器
强制切换到指定的Node版本并执行命令。

**用法:**
```bash
node scripts/changeNode.js [Node版本] [命令]
```

**示例:**
```bash
node scripts/changeNode.js 20 pnpm dev
node scripts/changeNode.js 18 npm test
```

## 功能特性

### 自动版本检查
- 读取项目根目录的 `package.json` 中的 `engines.node` 配置
- 自动检测当前Node版本
- 比较版本要求并给出提示

### 自动版本切换
- 如果当前版本不符合要求，自动切换到推荐版本
- 支持Windows和Mac/Linux系统
- 使用nvm进行版本管理

### 智能推荐
- 对于 `>=18` 的要求，推荐使用Node 20
- 支持各种版本要求格式（`>=18`, `>18`, `18 - 20` 等）

## 项目配置

### package.json配置
在项目根目录的 `package.json` 中设置Node版本要求：

```json
{
  "engines": {
    "node": ">=18"
  }
}
```

### 脚本配置
所有脚本都已经配置为使用版本检查：

```json
{
  "scripts": {
    "dev": "node scripts/run.js turbo run dev",
    "build": "node scripts/run.js turbo run build",
    "lint": "node scripts/run.js turbo run lint"
  }
}
```

## 使用建议

### 日常开发
推荐使用以下命令：

```bash
# 启动开发环境
pnpm dev

# 或者直接使用脚本
node scripts/dev.js

# 构建项目
pnpm build

# 代码检查
pnpm lint
```

### 特殊情况
如果需要使用特定Node版本：

```bash
# 强制使用Node 20
node scripts/changeNode.js 20 pnpm dev

# 强制使用Node 18
node scripts/changeNode.js 18 pnpm test
```

## 注意事项

1. **nvm安装**: 确保已安装nvm (Node Version Manager)
2. **权限设置**: 确保脚本有执行权限 (`chmod +x scripts/*.js`)
3. **环境变量**: Windows用户需要确保nvm在PATH中
4. **版本兼容**: 推荐使用Node 20 LTS版本

## 故障排除

### 常见问题

1. **nvm命令未找到**
   - 确保nvm已正确安装
   - 检查环境变量配置

2. **权限错误**
   - 给脚本添加执行权限：`chmod +x scripts/*.js`

3. **版本切换失败**
   - 确保目标Node版本已安装：`nvm install 20`
   - 检查nvm配置是否正确

### 调试模式
可以设置环境变量来查看详细日志：

```bash
DEBUG=1 node scripts/run.js pnpm dev
```
