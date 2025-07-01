import { CommonTheme } from '@/types/theme.type';
import { mergeObject } from '@/utils/object';
import { DeepPartial } from 'ts-essentials';

function initializeCommonOptions(commonOptions: DeepPartial<CommonTheme> = {}) {
  const common = {
    gridSelection: {
      backgroundColor: 'rgba(60, 179, 113, 0.5)',
      border: '1px solid #8FBC8F',
    },
  };

  return mergeObject(common, commonOptions);
}

export function createCommonThemeSlice(options: DeepPartial<CommonTheme> = {}) {
  return {
    common: initializeCommonOptions(options),
  };
}
