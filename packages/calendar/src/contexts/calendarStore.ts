import { Options } from '@/types/options.type';
import { createOptionsSlice } from '@/slices/options.slice';
import { subscribeWithSelector } from 'zustand/middleware';
import { createViewSlice } from '@/slices/view.slice';
import { CalendarStore } from '@/types/store.type';
import { createTemplateSlice } from '@/slices/template.slice';
import { createLayoutSlice } from '@/slices/layout.slice';
import { createDndSlice } from '@/slices/dnd.slice';
import { createGridSelectionSlice } from '@/slices/gridSelection.slice';
import { create } from 'zustand';
import { createStoreContext } from '@/store';
import { createCalendarSlice } from '@/slices/calendat.slice';

// 定义状态更新函数的类型
// 这个函数接收一个状态转换函数，返回部分状态更新
type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

/**
 * 创建日历存储的核心函数
 * 将所有切片（slice）组合成一个完整的存储
 * @param options - 日历配置选项
 * @returns 返回一个函数，该函数接收 set 方法并返回完整的存储对象
 */
const storeCreator = (options: Options) => (set: SetState) => ({
  // 创建选项切片 - 处理日历的基本配置
  ...createOptionsSlice(options),
  // 创建日历切片 - 处理日历相关功能
  ...createCalendarSlice(options.calendars)(set),
  // 创建模板切片 - 处理事件模板相关功能
  ...createTemplateSlice(options.template),
  // 创建视图切片 - 处理日历视图状态（日视图、周视图等）
  ...createViewSlice(options.defaultView),
  // 创建布局切片 - 处理布局相关状态，需要 set 方法进行状态更新
  ...createLayoutSlice()(set),
  // 创建拖拽切片 - 处理拖拽相关功能，需要 set 方法进行状态更新
  ...createDndSlice()(set),
  // 创建网格选择切片 - 处理网格选择功能，需要 set 方法进行状态更新
  ...createGridSelectionSlice()(set),
});

export type CalendarStoreContext = ReturnType<typeof createCalendarStore>;

const {
  StoreProvider: CalendarStoreProvider,
  useStore: useCalendarStore,
  useInternalStore: useCalendarStoreInternal,
} = createStoreContext<CalendarStore>();

export { CalendarStoreProvider, useCalendarStore, useCalendarStoreInternal };

/**
 * 创建日历存储实例
 * 使用 Zustand 创建状态管理存储，并应用订阅选择器中间件
 * @param options - 日历配置选项，默认为空对象
 * @returns 返回配置好的 Zustand 存储实例
 */
export const createCalendarStore = (options: Options = {}) => {
  return create<CalendarStore>()(subscribeWithSelector(storeCreator(options)));
};
