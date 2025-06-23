import { Options } from '@/types/options.type';
import { createOptionsSlice } from '@/slices/options.slice';
import { create } from 'zustand';
import { createViewSlice } from '@/slices/view.slice';
import { CalendarStore } from '@/types/store.type';
import { createTemplateSlice } from '@/slices/template.slice';
import { createLayoutSlice } from '@/slices/layout.slice';
import { createDndSlice } from '@/slices/dnd.slice';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

const storeCreator = (options: Options) => (set: SetState) => ({
  ...createOptionsSlice(options),
  ...createTemplateSlice(options.template),
  ...createViewSlice(options.defaultView),
  ...createLayoutSlice()(set),
  ...createDndSlice(),
});

export const createCalendarStore = (options: Options = {}) => {
  return create<CalendarStore>(storeCreator(options));
};

export const useCalendarStore = createCalendarStore();
