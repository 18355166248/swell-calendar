// ===== 事件数据源抽象层 =====（P6 → P9）
// P6 把事件 CRUD 收敛到可替换的「异步数据源」接口背后：App 只面向 list/create/update/remove。
// P9 把默认实现从「直接读写 localStorage」换成「走真实 HTTP 请求」：
// axios 在浏览器走 XMLHttpRequest，由 mockjs（src/mock/server.ts）就地拦截并返回 mock 数据。
// 接口形态对齐真实后端 RESTful（GET/POST/PUT/DELETE /api/events），将来接真后端只需
// 去掉 mock server、改 baseURL，消费方与契约都无需改动。

import axios from 'axios';

import type { CalendarDataSource } from 'swell-calendar';

import { type CalEvent } from './data';
import { setupMockServer } from './mock/server';

/** 新建草稿：除 id 外的全部业务字段。id 由数据源（后端职责）分配。 */
export type EventDraft = Omit<CalEvent, 'id'>;

/** 本 app 的数据源类型：泛型契约绑定到 CalEvent / EventDraft。 */
export type AppDataSource = CalendarDataSource<CalEvent, EventDraft>;

// 注册 mockjs 拦截器（仅一次）。接真后端时删除此行即可。
setupMockServer();

const http = axios.create({ baseURL: '/api' });

/** 后端统一响应包：{ data: T }。 */
interface ApiResponse<T> {
  data: T;
}

// 模拟读取链路的网络延迟，让首屏 loading 态成为真实存在的一帧而非闪烁。
// mutation（create/update/remove）不额外延时，避免拖拽 move/resize 时
// 受控渲染回弹闪烁（PLAN4 §4.1）。
const LIST_DELAY_MS = 180;
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * HTTP 实现：所有 CRUD 走 axios → mockjs 拦截 → localStorage。
 * 对外只暴露扁平 CRUD，调用方无需感知传输与持久化细节。
 */
export class HttpDataSource implements AppDataSource {
  async list(): Promise<CalEvent[]> {
    await delay(LIST_DELAY_MS);
    const res = await http.get<ApiResponse<CalEvent[]>>('/events');
    return res.data.data;
  }

  async create(draft: EventDraft): Promise<CalEvent> {
    const res = await http.post<ApiResponse<CalEvent>>('/events', draft);
    return res.data.data;
  }

  async update(id: string, patch: EventDraft): Promise<CalEvent> {
    const res = await http.put<ApiResponse<CalEvent>>(`/events/${id}`, patch);
    return res.data.data;
  }

  async remove(id: string): Promise<void> {
    await http.delete(`/events/${id}`);
  }
}

/** 默认数据源单例。替换为真后端时只需换这一处（并移除 mock server）。 */
export const dataSource: AppDataSource = new HttpDataSource();
