#!/usr/bin/env node
/**
 * 架构分层约束检查器
 *
 * 依赖方向：types → constants → utils → time → model → store/slices/contexts →
 *           controller → helpers → hooks → Template → components
 *
 * 运行：node scripts/check-arch.mjs
 * 在 pre-commit 和 CI 中自动运行。
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SRC = resolve(__dirname, '../packages/calendar/src');

// 分层定义（层号越小越基础，只能向前导入）
const LAYERS = [
  { layer: 0, dirs: ['types'] },
  { layer: 1, dirs: ['constants'] },
  { layer: 2, dirs: ['utils'] },
  { layer: 3, dirs: ['time'] },
  { layer: 4, dirs: ['model'] },
  { layer: 5, dirs: ['store', 'slices', 'contexts'] },
  { layer: 6, dirs: ['controller'] },
  { layer: 7, dirs: ['helpers'] },
  { layer: 8, dirs: ['hooks'] },
  { layer: 9, dirs: ['Template'] },
  { layer: 10, dirs: ['components'] },
];

// 构建 dir → layer 映射
const DIR_TO_LAYER = {};
for (const { layer, dirs } of LAYERS) {
  for (const dir of dirs) {
    DIR_TO_LAYER[dir] = layer;
  }
}

/** 递归收集所有 .ts/.tsx 文件 */
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.spec.ts') && !entry.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

/** 从文件内容中提取相对导入路径 */
function extractRelativeImports(content) {
  const imports = [];
  const re = /(?:import|from)\s+['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

/** 从文件路径提取所在的 src 子目录（层） */
function getLayerDir(filePath) {
  const rel = relative(SRC, filePath);
  return rel.split(/[/\\]/)[0];
}

/** 解析相对导入路径，找到目标层目录 */
function resolveTargetLayerDir(fromFile, importPath) {
  const fromDir = fromFile.replace(/[/\\][^/\\]+$/, '');
  const target = resolve(fromDir, importPath);
  const rel = relative(SRC, target);
  const parts = rel.split(/[/\\]/);
  // 如果 ../ 逃出了 src，忽略
  if (parts[0] === '..') return null;
  return parts[0];
}

let errors = 0;
const files = collectFiles(SRC);

for (const file of files) {
  const fromLayerDir = getLayerDir(file);
  const fromLayer = DIR_TO_LAYER[fromLayerDir];
  if (fromLayer === undefined) continue; // 未知目录跳过

  let content;
  try {
    content = readFileSync(file, 'utf-8');
  } catch {
    continue;
  }

  for (const importPath of extractRelativeImports(content)) {
    const targetDir = resolveTargetLayerDir(file, importPath);
    if (!targetDir) continue;
    const targetLayer = DIR_TO_LAYER[targetDir];
    if (targetLayer === undefined) continue;

    if (targetLayer > fromLayer) {
      const rel = relative(resolve(__dirname, '..'), file).replace(/\\/g, '/');
      console.error(`
❌ 架构违规：${rel}
   所在层 [${fromLayer}] ${fromLayerDir}/  导入了高层 [${targetLayer}] ${targetDir}/
   导入路径：${importPath}

   修复方案：
   - 将业务逻辑下沉到 [${fromLayer}] ${fromLayerDir}/ 可访问的层
   - 或将当前文件移动到更高层（>= 层 ${targetLayer}）
   - 参考分层规则：packages/calendar/AGENTS.md#分层约束详情
`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n共发现 ${errors} 处架构违规，请修复后再提交。`);
  process.exit(1);
} else {
  console.log(`✅ 架构检查通过（${files.length} 个文件，无分层违规）`);
}
