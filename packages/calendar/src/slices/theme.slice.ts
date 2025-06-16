import { Options, ThemeState } from '@/types/theme.type';

function initializeWeekOptions(weekOptions: Options['week'] = {}): ThemeState['week'] {
  const week: ThemeState['week'] = {
    timeGridLeft: {
      width: 72,
    },
    ...weekOptions,
  };

  return week;
}

export function createThemeSlice(options: Options = {}) {
  return {
    week: initializeWeekOptions(options.week),
  };
}
