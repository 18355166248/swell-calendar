import { DeepPartial } from 'ts-essentials';
import { create } from 'zustand';
import { StateCreator } from 'zustand';

import { createCommonThemeSlice } from '@/slices/theme/theme.common.slice';
import { createMonthThemeSlice } from '@/slices/theme/theme.month.slice';
import { createWeekThemeSlice } from '@/slices/theme/theme.week.slice';
import { ThemeState } from '@/types/theme.type';

const storeCreator =
  (options: DeepPartial<ThemeState>): StateCreator<ThemeState> =>
  (set) => ({
    ...createCommonThemeSlice(options.common),
    ...createWeekThemeSlice(options.week),
    ...createMonthThemeSlice(options.month)(set),
  });

export const createThemeStore = (options: DeepPartial<ThemeState> = {}) => {
  return create<ThemeState>(storeCreator(options));
};

export const useThemeStore = createThemeStore();
