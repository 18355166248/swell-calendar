import { produce } from 'immer';

import { OptionsSlice, WeekViewLayoutSlice } from '@/types/layout.type';
import { CalendarStore } from '@/types/store.type';

function initializeLayoutOptions(): Pick<WeekViewLayoutSlice, 'layout' | 'weekViewLayout'> {
  return {
    layout: 500,
    weekViewLayout: {
      lastPanelType: null,
      dayGridRows: {},
    },
  };
}

function getRestPanelHeight(
  dayGridRows: Record<string, { height: number }>,
  type: string,
  layout: number
) {
  const totalHeight = Object.keys(dayGridRows).reduce((acc, rowName) => {
    if (rowName !== type) {
      acc += dayGridRows[rowName].height;
    }

    return acc;
  }, 0);

  return layout - totalHeight;
}

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createLayoutSlice() {
  return (set: SetState): OptionsSlice => ({
    layout: {
      ...initializeLayoutOptions(),
      setLastPanelType: (type) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.weekViewLayout.lastPanelType = type;

            if (type) {
              // 最后一行面板（通常是 time panel）可能在严格模式下晚于容器 effect 注册；
              // 这里先兜底初始化，保证“剩余高度”计算不会因为缺行而失效。
              state.layout.weekViewLayout.dayGridRows[type] ??= { height: 0 };
              state.layout.weekViewLayout.dayGridRows[type].height = getRestPanelHeight(
                state.layout.weekViewLayout.dayGridRows,
                type,
                state.layout.layout
              );
            }
          })
        );
      },
      updateLayoutHeight: (num: number) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.layout = num;

            const { lastPanelType } = state.layout.weekViewLayout;

            if (lastPanelType) {
              state.layout.weekViewLayout.dayGridRows[lastPanelType] ??= { height: 0 };
              state.layout.weekViewLayout.dayGridRows[lastPanelType].height = getRestPanelHeight(
                state.layout.weekViewLayout.dayGridRows,
                lastPanelType,
                state.layout.layout
              );
            }
          })
        );
      },
      updateDayGridRowHeight: (row, height) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.weekViewLayout.dayGridRows[row] = {
              height,
            };
          })
        );
      },
      pruneDayGridRows: (validRows: string[]) => {
        set(
          produce((state: CalendarStore) => {
            // 切换视图时，dayGridRows 会残留上一个视图的面板（如 scheduler-header /
            // week-view-day-names），这些陈旧高度会被 getRestPanelHeight 从 time 面板里
            // 扣掉，导致网格高度被吃光。这里按当前视图实际存在的面板做一次裁剪。
            const valid = new Set(validRows);
            const { dayGridRows } = state.layout.weekViewLayout;
            Object.keys(dayGridRows).forEach((row) => {
              if (!valid.has(row)) {
                delete dayGridRows[row];
              }
            });
          })
        );
      },
    },
  });
}
