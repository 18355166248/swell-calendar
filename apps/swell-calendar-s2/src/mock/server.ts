// ===== mockjs 模拟后端 =====
// 用 mockjs 拦截 XMLHttpRequest，把 /api/events 这套 RESTful 接口在前端就地实现，
// 让宿主侧 HttpDataSource 走「真实」axios 请求而无需起后端服务。
// 数据落 localStorage，刷新后视图完整还原（替代原 LocalStorageDataSource 的四层叠加，
// 收敛为单一事件表——后端的天然形态：种子仅在首次初始化时写入）。

import Mock from 'mockjs';

import { rebaseEventsToCurrentWeek } from '../calendarData';
import { type CalEvent, events as SEED_EVENTS } from '../data';

const DB_KEY = 'swell-calendar-s2:mock-db';
const DB_VERSION_KEY = 'swell-calendar-s2:mock-db-version';
// 锚定语义 / schema 变化时递增：
// v2 起种子事件按「当前周」锚定（修复首屏空日历），并借版本升级一次性重置旧的
// 停留在 2025 周 / 早期丢失 allDay 语义的历史 demo 数据。
const DB_VERSION = '2';

/** 写入一份锚定到当前周的全新种子，并打上当前版本号。 */
function seedDB(): CalEvent[] {
  const seeded = rebaseEventsToCurrentWeek(SEED_EVENTS);
  writeDB(seeded);
  localStorage.setItem(DB_VERSION_KEY, DB_VERSION);
  return seeded;
}

function readDB(): CalEvent[] {
  try {
    const version = localStorage.getItem(DB_VERSION_KEY);
    const raw = localStorage.getItem(DB_KEY);
    // 仅当版本匹配时复用既有数据；否则视为首次 / 旧版本，重置为当前周种子
    if (raw && version === DB_VERSION) return JSON.parse(raw) as CalEvent[];
  } catch {
    // 解析失败时退回种子
  }
  return seedDB();
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
