export type TimeGridLeftTheme = {
  width: string;
};

export type WeekTheme = {
  timeGridLeft: TimeGridLeftTheme;
};
export type ThemeState = {
  week: WeekTheme;
};

export type Options = {
  week?: {
    timeGridLeft?: TimeGridLeftTheme;
  };
};
