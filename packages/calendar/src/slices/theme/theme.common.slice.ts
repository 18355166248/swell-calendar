import { CommonTheme } from '@/types/theme.type';
import { mergeObject } from '@/utils/object';
import { DeepPartial } from 'ts-essentials';

function initializeCommonOptions(commonOptions: DeepPartial<CommonTheme> = {}) {
  const common = {
    gridSelection: {
      backgroundColor: 'rgba(81, 92, 230, 0.15)',
      border: '1px solid rgba(81, 92, 230, 0.4)',
    },
    dayName: {
      color: 'inherit',
    },
    today: {
      color: 'inherit',
    },
    holiday: {
      color: '#bbb',
    },
    saturday: {
      color: '#bbb',
    },
  };

  return mergeObject(common, commonOptions);
}

export function createCommonThemeSlice(options: DeepPartial<CommonTheme> = {}) {
  return {
    common: initializeCommonOptions(options),
  };
}
