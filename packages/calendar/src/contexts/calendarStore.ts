import { Options } from '@/types/options.type';
import { createOptionsSlice } from '@/slices/options';
import { create } from 'zustand';
import { CalendarWeekOptions } from '@/types/store';

interface CalendarState {
  options: {
    defaultView: 'month' | 'week' | 'day';
    week: CalendarWeekOptions;
  };
}

type SetState = (fn: (state: CalendarState) => Partial<CalendarState>) => void;

const storeCreator = (options: Options) => (set: SetState) => ({
  ...createOptionsSlice(options),
});

export const createCalendarStore = (options: Options = {}) => {
  return create<CalendarState>(storeCreator(options));
};

export const useCalendarStore = createCalendarStore();
