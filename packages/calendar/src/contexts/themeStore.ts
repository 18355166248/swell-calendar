import { create } from 'zustand';
import { ThemeState } from '@/types/theme.type';
import { createWeekThemeSlice } from '@/slices/theme/theme.week.slice';
import { StateCreator } from 'zustand';
import { DeepPartial } from 'ts-essentials';
import { createCommonThemeSlice } from '@/slices/theme/theme.common.slice';

const storeCreator =
  (options: DeepPartial<ThemeState>): StateCreator<ThemeState> =>
  (set) => ({
    ...createCommonThemeSlice(options.common),
    ...createWeekThemeSlice(options.week),
  });

export const createThemeStore = (options: DeepPartial<ThemeState> = {}) => {
  return create<ThemeState>(storeCreator(options));
};

export const useThemeStore = createThemeStore();
