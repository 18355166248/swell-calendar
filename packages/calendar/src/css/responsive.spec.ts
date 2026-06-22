import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const cssDir = dirname(fileURLToPath(import.meta.url));
const responsiveScss = readFileSync(resolve(cssDir, 'responsive.scss'), 'utf8');

describe('responsive mobile css contracts', () => {
  it('移动端 time event 窄卡内容必须在卡内省略，不能溢出遮挡邻卡', () => {
    // 标题对标设计稿 .m-ev-title：最多 2 行截断（仍 overflow 兜底，不溢出邻卡）
    expect(responsiveScss).toContain('.event-time-stack-title {');
    expect(responsiveScss).toContain('-webkit-line-clamp: 2;');
    // 副行（时间/「全天」）保持单行省略
    expect(responsiveScss).toContain('.event-time-stack-sub {');
    expect(responsiveScss).toContain('min-width: 0;');
    expect(responsiveScss).toContain('max-width: 100%;');
    expect(responsiveScss).toContain('overflow: hidden;');
    expect(responsiveScss).toContain('white-space: nowrap;');
    expect(responsiveScss).toContain('text-overflow: ellipsis;');
  });
});
