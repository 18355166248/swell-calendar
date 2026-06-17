export type WeekGridRows = 'milestone' | 'task' | 'allday' | 'time' | string;

export type WeekViewLayoutSlice = {
  layout: number;
  weekViewLayout: {
    lastPanelType: string | null; // 最后一个面板类型
    dayGridRows: {
      [row in WeekGridRows]: {
        height: number;
      };
    };
  };
  setLastPanelType: (lastPanelType: string) => void;
  updateLayoutHeight: (layout: number) => void;
  updateDayGridRowHeight: (row: WeekGridRows, height: number) => void;
  /** 仅保留当前视图实际存在的面板，清除切换视图后残留的陈旧面板高度 */
  pruneDayGridRows: (validRows: string[]) => void;
};

export type OptionsSlice = {
  layout: WeekViewLayoutSlice;
};
