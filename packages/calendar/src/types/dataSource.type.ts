/**
 * 宿主侧异步事件数据源契约（host-side data wiring）。
 *
 * 渲染/交互引擎本体只消费 `EventObject` props，数据获取与持久化是宿主职责。
 * 该接口与配套 `useCalendarDataSource` 仅为宿主接入异步 CRUD 提供可选样板，
 * 不参与引擎本体。任意实现（HTTP / IndexedDB / localStorage）都可直接喂给 hook。
 *
 * @typeParam TEvent - 宿主领域事件类型（宿主自行转换为 `EventObject` 后传给 `Calendar`）
 * @typeParam TDraft - 新建/更新草稿类型，默认 `Omit<TEvent, 'id'>`（`id` 由数据源分配）
 */
export interface CalendarDataSource<TEvent, TDraft = Omit<TEvent, 'id'>> {
  /** 返回当前完整事件列表（已解析叠加层等内部细节）。 */
  list(): Promise<TEvent[]>;
  /** 落库一条新事件，分配 id 后返回。 */
  create(draft: TDraft): Promise<TEvent>;
  /** 按 id 整体替换事件字段，返回更新后的事件。 */
  update(id: string, patch: TDraft): Promise<TEvent>;
  /** 按 id 删除事件。 */
  remove(id: string): Promise<void>;
}
