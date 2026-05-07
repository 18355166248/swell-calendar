import { execSync } from 'node:child_process';

function run(command) {
  execSync(command, {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

try {
  run('git rev-parse --is-inside-work-tree');
  run('git config core.hooksPath .githooks');
  process.stdout.write('✅ git hooks 已启用 (.githooks)\n');
} catch {
  process.stdout.write('ℹ️  当前目录不是 git worktree，跳过 hooks 配置\n');
}
