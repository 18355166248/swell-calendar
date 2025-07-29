import { MonthTheme, ThemeState } from '@/types/theme.type';
import { mergeObject } from '@/utils/object';
import { produce } from 'immer';
import { DeepPartial } from 'ts-essentials';

function initializeMonthOptions(monthOptions: DeepPartial<MonthTheme> = {}) {
  const month = {
    dayName: {
      borderLeft: '1px solid #e5e5e5',
      backgroundColor: 'inherit',
    },
  };

  return mergeObject(month, monthOptions);
}

type SetState = (fn: (state: ThemeState) => Partial<ThemeState>) => void;

export function createMonthThemeSlice(options: DeepPartial<MonthTheme> = {}) {
  return (set: SetState) => ({
    month: {
      ...initializeMonthOptions(options),
      setMonthTheme: (theme: MonthTheme) => {
        set(
          produce<ThemeState>((state) => {
            state.month = theme;
          })
        );
      },
    },
  });
}
