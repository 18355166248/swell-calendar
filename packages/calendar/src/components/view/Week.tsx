import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { useMemo } from 'react';

/**
 * 周视图状态管理钩子
 *
 * 从全局状态中获取周视图所需的所有数据：
 * - options: 日历配置选项
 * - calendar: 日历数据
 * - gridRowLayout: 网格行布局信息
 * - lastPanelType: 最后一个面板类型
 * - renderDate: 当前渲染日期
 */
function useWeekViewState() {
  const { options, view, layout, calendar } = useCalendarStore();

  const { weekViewLayout } = layout;

  const { dayGridRows: gridRowLayout, lastPanelType } = weekViewLayout;

  const { renderDate } = view;

  return useMemo(
    () => ({
      options,
      calendar,
      gridRowLayout,
      lastPanelType,
      renderDate,
    }),
    [calendar, gridRowLayout, lastPanelType, options, renderDate]
  );
}

export function Week() {
  // 获取周视图状态
  const { options, calendar, gridRowLayout, lastPanelType, renderDate } = useWeekViewState();
  // 获取主题中的网格头部左边距
  const { timeGridLeft } = useThemeStore((state) => state.week);

  const { width: timeGridLeftWidth } = timeGridLeft;

  return <div>Week</div>;
}
