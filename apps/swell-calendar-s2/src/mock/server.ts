// ===== mockjs 模拟后端 =====
// 用 mockjs 拦截 XMLHttpRequest，把 /api/events 这套 RESTful 接口在前端就地实现，
// 让宿主侧 HttpDataSource 走「真实」axios 请求而无需起后端服务。
// 数据落 localStorage，刷新后视图完整还原（替代原 LocalStorageDataSource 的四层叠加，
// 收敛为单一事件表——后端的天然形态：种子仅在首次初始化时写入）。

import Mock from 'mockjs';

import { type CalEvent, events as SEED_EVENTS } from '../data';

const DB_KEY = 'swell-calendar-s2:mock-db';

function readDB(): CalEvent[] {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as CalEvent[];
  } catch {
    // 解析失败时退回种子
  }
  // 首次初始化：写入种子
  writeDB(SEED_EVENTS);
  return [...SEED_EVENTS];
}

function writeDB(events: CalEvent[]): void {
  localStorage.setItem(DB_KEY, JSON.stringify(events));
}

/** 从 URL 末段取出事件 id，如 `/api/events/u-123` → `u-123`。 */
function idFromUrl(url: string): string {
  return decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
}

interface MockReq {
  url: string;
  type: string;
  body?: string;
}

/** mockjs 注册：把事件 CRUD 暴露为 RESTful 接口。 */
export function setupMockServer(): void {
  // GET /api/events —— 返回完整事件列表
  Mock.mock(/\/api\/events$/, 'get', () => ({ data: readDB() }));

  // POST /api/events —— 新建，分配 id 后返回
  Mock.mock(/\/api\/events$/, 'post', (req: MockReq) => {
    const draft = JSON.parse(req.body ?? '{}') as Omit<CalEvent, 'id'>;
    const created: CalEvent = { ...draft, id: `u-${Date.now()}` };
    writeDB([...readDB(), created]);
    return { data: created };
  });

  // PUT /api/events/:id —— 整体替换，返回更新后的事件
  Mock.mock(/\/api\/events\/[^/]+$/, 'put', (req: MockReq) => {
    const id = idFromUrl(req.url);
    const patch = JSON.parse(req.body ?? '{}') as Omit<CalEvent, 'id'>;
    const updated: CalEvent = { ...patch, id };
    writeDB(readDB().map((e) => (e.id === id ? updated : e)));
    return { data: updated };
  });

  // DELETE /api/events/:id —— 删除
  Mock.mock(/\/api\/events\/[^/]+$/, 'delete', (req: MockReq) => {
    const id = idFromUrl(req.url);
    writeDB(readDB().filter((e) => e.id !== id));
    return { data: null };
  });
}
