export type TimeGridLeftTheme = {
  width: string;
};

export type WeekTheme = {
  timeGridLeft: TimeGridLeftTheme;
  pastTime: {
    color: string;
  };
  futureTime: {
    color: string;
  };
  showNowIndicator: boolean; // 是否显示当前时间指示器
};
export type ThemeState = {
  week: WeekTheme;
};

export type Options = {
  week?: {
    timeGridLeft?: TimeGridLeftTheme;
  };
};
