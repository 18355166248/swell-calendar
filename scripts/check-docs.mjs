#!/usr/bin/env node

import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = process.cwd();
const args = new Set(process.argv.slice(2));
const useStaged = args.has('--staged');

const requiredDocs = [
  'docs/README.md',
  'docs/WORKFLOW.md',
  'docs/ARCHITECTURE.md',
  'docs/DEFINITION-OF-DONE.md',
  'docs/tasks/TEMPLATE.md',
  'docs/adrs/ADR-TEMPLATE.md',
  'docs/AGENTS.md',
  'packages/calendar/SPEC.md',
];

const sourceTriggers = [
  'packages/calendar/src/',
  'scripts/',
  '.github/workflows/',
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
  'packages/calendar/package.json',
];

const docTargets = [
  'docs/',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'packages/calendar/AGENTS.md',
  'packages/calendar/SPEC.md',
  'packages/calendar/README-CSS.md',
  'packages/calendar/README-STORE.md',
];

function fail(message) {
  console.error(`\n❌ 文档检查失败\n${message}\n`);
  process.exit(1);
}

for (const file of requiredDocs) {
  if (!existsSync(resolve(ROOT, file))) {
    fail(`缺少必需文档：${file}`);
  }
}

function getChangedFiles() {
  try {
    const trackedCmd = useStaged
      ? 'git diff --cached --name-only --diff-filter=ACMR'
      : 'git diff --name-only --diff-filter=ACMR HEAD';
    const tracked = execSync(trackedCmd, { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (useStaged) {
      return tracked;
    }

    const untracked = execSync('git ls-files --others --exclude-standard', {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log('✅ 文档检查通过（无待检查变更）');
  process.exit(0);
}

const hasSourceChange = changedFiles.some(file =>
  sourceTriggers.some(prefix => file === prefix || file.startsWith(prefix))
);

const hasDocChange = changedFiles.some(file =>
  docTargets.some(prefix => file === prefix || file.startsWith(prefix))
);

if (hasSourceChange && !hasDocChange) {
  fail(
    [
      '检测到实现文件变更，但没有任何文档变更。',
      '要求：先更新 docs，再提交代码。',
      '至少同步以下之一：',
      '- docs/tasks/*.md',
      '- docs/adrs/*.md',
      '- docs/ARCHITECTURE.md',
      '- docs/WORKFLOW.md',
      '- packages/calendar/SPEC.md',
    ].join('\n')
  );
}

console.log(`✅ 文档检查通过（${changedFiles.length} 个变更文件）`);
