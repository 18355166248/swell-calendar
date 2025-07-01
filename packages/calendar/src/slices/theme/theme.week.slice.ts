import { WeekTheme } from '@/types/theme.type';
import { mergeObject } from '@/utils/object';
import { DeepPartial } from 'ts-essentials';

function initializeWeekOptions(weekOptions: DeepPartial<WeekTheme> = {}) {
  const week = {
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
    gridSelection: {
      color: '#515ce6',
    },
  };

  return mergeObject(week, weekOptions);
}

export function createWeekThemeSlice(options: DeepPartial<WeekTheme> = {}) {
  return {
    week: initializeWeekOptions(options),
  };
}
