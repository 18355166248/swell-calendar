import { DeepPartial } from 'ts-essentials';

import { TimelineTheme } from '@/types/theme.type';
import { mergeObject } from '@/utils/object';

function initializeTimelineOptions(timelineOptions: DeepPartial<TimelineTheme> = {}) {
  const timeline: TimelineTheme = {
    resourceList: {
      borderRight: '1px solid #e8e8e8',
      backgroundColor: '#fafafa',
    },
    resourceItem: {
      borderBottom: '1px solid #e8e8e8',
      nameColor: '#333',
    },
    header: {
      borderBottom: '1px solid #e8e8e8',
      backgroundColor: '#fff',
      placeholderBackgroundColor: '#fafafa',
      monthColor: '#333',
      monthBackgroundColor: '#fafafa',
      monthBorderBottom: '1px solid #f0f0f0',
      dayBorderRight: '1px solid #f0f0f0',
      weekendBackgroundColor: '#fafafa',
      todayBackgroundColor: 'rgba(81, 92, 230, 0.1)',
      todayColor: '#515ce6',
      weekdayColor: '#999',
      dateColor: '#333',
    },
    schedulerHeader: {
      borderBottom: '1px solid #e8e8e8',
      backgroundColor: '#fff',
      dateRowBackgroundColor: '#fafafa',
      dateRowBorderBottom: '1px solid #f0f0f0',
      dayLabelColor: '#666',
      dayLabelBorderRight: '1px solid #e8e8e8',
    },
    schedulerResourceCell: {
      nameColor: '#333',
    },
    grid: {
      rowBorderBottom: '1px solid #e8e8e8',
      cellBorderRight: '1px solid #f0f0f0',
      weekendBackgroundColor: '#fafafa',
      todayBackgroundColor: 'rgba(81, 92, 230, 0.06)',
      dragGhostBackgroundColor: 'rgba(81, 92, 230, 0.22)',
      dragGhostBorder: '1px dashed rgba(81, 92, 230, 0.9)',
    },
    emptyColor: '#999',
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.96)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
  };

  return mergeObject(timeline, timelineOptions);
}

export function createTimelineThemeSlice(options: DeepPartial<TimelineTheme> = {}) {
  return {
    timeline: initializeTimelineOptions(options),
  };
}
