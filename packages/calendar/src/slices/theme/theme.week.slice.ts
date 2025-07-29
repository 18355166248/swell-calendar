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
    dayGrid: {
      borderRight: '1px solid #e5e5e5',
      backgroundColor: 'inherit',
    },
    weekend: {
      backgroundColor: 'inherit',
    },
    today: {
      color: 'inherit',
      backgroundColor: 'rgba(81, 92, 230, 0.05)',
    },
    pastDay: {
      color: '#bbb',
    },
    dayName: {
      borderLeft: 'none',
      borderTop: '1px solid #e5e5e5',
      borderBottom: '1px solid #e5e5e5',
      backgroundColor: 'inherit',
    },
  };

  return mergeObject(week, weekOptions);
}

export function createWeekThemeSlice(options: DeepPartial<WeekTheme> = {}) {
  return {
    week: initializeWeekOptions(options),
  };
}
