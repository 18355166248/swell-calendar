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

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

const storeCreator = (options: Options) => (set: SetState) => ({
  ...createOptionsSlice(options),
  ...createTemplateSlice(options.template),
  ...createViewSlice(options.defaultView),
  ...createLayoutSlice()(set),
  ...createDndSlice()(set),
  ...createGridSelectionSlice()(set),
});

export const createCalendarStore = (options: Options = {}) => {
  return create<CalendarStore>()(subscribeWithSelector(storeCreator(options)));
};

// 创建默认的 store 实例
export const useCalendarStore = createCalendarStore();
