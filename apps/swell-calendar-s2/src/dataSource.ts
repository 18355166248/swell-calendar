// ===== 事件数据源抽象层 =====（P6）
// P5 把事件 CRUD 直接写在 App.tsx 的四层 localStorage 里（种子 / 用户新建 / override / 墓碑）。
// P6 把这套逻辑收敛到一个可替换的「异步数据源」接口背后：App 只面向 list/create/update/remove，
// 不再持有 localStorage key 与叠加细节。默认实现仍落 localStorage（环境无后端），但接口形态
// 对齐真实后端，将来可整体替换为 HTTP / IndexedDB 实现而不动消费方。

import type { CalendarDataSource } from 'swell-calendar';

import { type CalEvent, events as SEED_EVENTS } from './data';

/** 新建草稿：除 id 外的全部业务字段。id 由数据源（后端职责）分配。 */
export type EventDraft = Omit<CalEvent, 'id'>;

/** 本 app 的数据源类型：泛型契约绑定到 CalEvent / EventDraft。 */
export type AppDataSource = CalendarDataSource<CalEvent, EventDraft>;

// 模拟网络/IO 延迟，让 loading 态成为真实存在的一帧而非闪烁。
// list() 保留首屏 loading 体验；mutation 路径（create/update/remove）设 0，
// 避免拖拽 move/resize 时引擎宿主受控渲染回弹闪烁（PLAN4 §4.1）。
const LIST_DELAY_MS = 180;
const MUTATION_DELAY_MS = 0;
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const USER_EVENTS_KEY = 'swell-calendar-s2:user-events';
const OVERRIDES_KEY = 'swell-calendar-s2:overrides';
const DELETED_KEY = 'swell-calendar-s2:deleted-ids';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * localStorage 实现：内部沿用 P5 的三层叠加模型——
 * 种子不可变；用户新建落 user 层；编辑写 override 层；删除写墓碑层。
 * 这样种子可被改/删（以叠加表达），demo 刷新后视图完整还原，且种子更新仍能下发。
 * 对外只暴露扁平 CRUD，调用方无需感知叠加细节。
 */
export class LocalStorageDataSource implements AppDataSource {
  private read(): { user: CalEvent[]; overrides: Record<string, CalEvent>; deleted: string[] } {
    return {
      user: readJSON<CalEvent[]>(USER_EVENTS_KEY, []),
      overrides: readJSON<Record<string, CalEvent>>(OVERRIDES_KEY, {}),
      deleted: readJSON<string[]>(DELETED_KEY, []),
    };
  }

  /** 把三层叠加解析为最终事件列表。 */
  private resolve(): CalEvent[] {
    const { user, overrides, deleted } = this.read();
    const tombstone = new Set(deleted);
    return [...SEED_EVENTS, ...user]
      .filter((e) => !tombstone.has(e.id))
      .map((e) => overrides[e.id] ?? e);
  }

  async list(): Promise<CalEvent[]> {
    await delay(LIST_DELAY_MS);
    return this.resolve();
  }

  async create(draft: EventDraft): Promise<CalEvent> {
    await delay(MUTATION_DELAY_MS);
    const created: CalEvent = { ...draft, id: `u-${Date.now()}` };
    const user = readJSON<CalEvent[]>(USER_EVENTS_KEY, []);
    writeJSON(USER_EVENTS_KEY, [...user, created]);
    return created;
  }

  async update(id: string, patch: EventDraft): Promise<CalEvent> {
    await delay(MUTATION_DELAY_MS);
    const updated: CalEvent = { ...patch, id };
    const overrides = readJSON<Record<string, CalEvent>>(OVERRIDES_KEY, {});
    writeJSON(OVERRIDES_KEY, { ...overrides, [id]: updated });
    return updated;
  }

  async remove(id: string): Promise<void> {
    await delay(MUTATION_DELAY_MS);
    const deleted = readJSON<string[]>(DELETED_KEY, []);
    if (!deleted.includes(id)) writeJSON(DELETED_KEY, [...deleted, id]);
  }
}

/** 默认数据源单例。替换为真后端时只需换这一处。 */
export const dataSource: AppDataSource = new LocalStorageDataSource();
