export type WeekGridRows = 'milestone' | 'task' | 'allday' | 'time' | string;

export type WeekViewLayoutSlice = {
  layout: number;
  weekViewLayout: {
    lastPanelType: string | null;
    dayGridRows: {
      [row in WeekGridRows]: {
        height: number;
      };
    };
  };
  updateLayoutHeight: (layout: number) => void;
  updateDayGridRowHeight: (row: WeekGridRows, height: number) => void;
};

export type OptionsSlice = {
  layout: WeekViewLayoutSlice;
};
