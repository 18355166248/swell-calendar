import { Options, ThemeState } from '@/types/theme.type';

function initializeWeekOptions(weekOptions: Options['week'] = {}): ThemeState['week'] {
  const week: ThemeState['week'] = {
    timeGridLeft: {
      width: '72px',
    },
    pastTime: {
      color: '#bbb',
    },
    futureTime: {
      color: '#333',
    },
    showNowIndicator: true,
    nowIndicatorLabel: {
      color: '#515ce6',
    },
    timeGridHalfHourLine: {
      borderBottom: 'none',
    },
    timeGridHourLine: {
      borderBottom: '1px solid #e5e5e5',
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
