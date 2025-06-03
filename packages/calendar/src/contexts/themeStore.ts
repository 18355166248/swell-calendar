import { create } from 'zustand';
import { Options, ThemeState } from '@/types/theme.type';
import { createThemeSlice } from '@/slices/theme.slice';
import { StateCreator } from 'zustand';

const storeCreator =
  (options: Options): StateCreator<ThemeState> =>
  (set) => ({
    ...createThemeSlice(options),
  });

export const createThemeStore = (options: Options = {}) => {
  return create<ThemeState>(storeCreator(options));
};

export const useThemeStore = createThemeStore();
