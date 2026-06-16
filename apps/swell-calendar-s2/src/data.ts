// swell-calendar sample data — 会议室 + 成员排期（移植自设计稿 data.js）
export type Cat = 'seafoam' | 'indigo' | 'magenta' | 'orange' | 'green' | 'purple';

/** 事件详情弹层（Popover）消费的事件结构，由 calendarData.toPickEvent 从引擎事件回填。 */
export interface PickEvent {
  id?: string;
  title: string;
  cat: Cat;
  dateLabel?: string;
  who?: string;
  loc?: string;
  desc?: string;
  start: number;
  end: number;
}

export interface Resource {
  id: string;
  name: string;
  short: string;
  type: 'room' | 'person';
  cap: string;
  color: Cat;
  floor?: string;
  initials?: string;
}

export interface CalEvent {
  id: string;
  res: string;
  /** 0=周一 .. 6=周日，当前展示周内（事件开始日） */
  day: number;
  /**
   * 事件结束日（周内索引）。省略时等同 `day`，即单日事件。
   * 跨天事件（如周一 14:00 → 周二 10:00）用 endDay > day 表示。
   */
  endDay?: number;
  /** 十进制小时，如 9.5 = 9:30 */
  start: number;
  end: number;
  title: string;
  cat: Cat;
  who?: string;
  loc?: string;
  desc?: string;
}

export interface CatColorStyle {
  line: string;
  fill: string;
  text: string;
}

export const resources: Resource[] = [
  {
    id: 'r1',
    name: '会议室 · 海景厅',
    short: '海景厅',
    type: 'room',
    cap: '12 人',
    color: 'seafoam',
    floor: 'F12',
  },
  {
    id: 'r2',
    name: '会议室 · 静思室',
    short: '静思室',
    type: 'room',
    cap: '4 人',
    color: 'indigo',
    floor: 'F12',
  },
  {
    id: 'r3',
    name: '会议室 · 协作区',
    short: '协作区',
    type: 'room',
    cap: '8 人',
    color: 'green',
    floor: 'F11',
  },
];

export const events: CalEvent[] = [
  {
    id: 'e1',
    res: 'r1',
    day: 0,
    start: 9,
    end: 10.5,
    title: '产品双周评审',
    cat: 'seafoam',
    who: '产品 · 设计 · 工程',
    loc: '海景厅',
    desc: '回顾上个迭代，确认本期范围与优先级。',
  },
  {
    id: 'e2',
    res: 'r1',
    day: 0,
    start: 14,
    end: 15,
    title: '客户演示彩排',
    cat: 'orange',
    who: '张明 +3',
    loc: '海景厅',
  },
  {
    id: 'e3',
    res: 'r1',
    day: 2,
    start: 10,
    end: 12,
    title: '季度规划工作坊',
    cat: 'indigo',
    who: '全员',
    loc: '海景厅',
  },
  {
    id: 'e3b',
    res: 'r1',
    day: 3,
    start: 9,
    end: 10.5,
    title: '晨会 · 站会',
    cat: 'seafoam',
    who: '团队',
    loc: '海景厅',
  },
  {
    id: 'e3c',
    res: 'r1',
    day: 3,
    start: 14,
    end: 16,
    title: '客户提案会',
    cat: 'orange',
    who: '销售 · 张明 +2',
    loc: '海景厅',
  },
  {
    id: 'e4',
    res: 'r1',
    day: 4,
    start: 13.5,
    end: 14.5,
    title: '全员同步会',
    cat: 'seafoam',
    who: '团队',
    loc: '海景厅',
  },

  {
    id: 'e5',
    res: 'r2',
    day: 0,
    start: 11,
    end: 12,
    title: '1:1 · 李娜',
    cat: 'magenta',
    who: '张明 · 李娜',
    loc: '静思室',
  },
  {
    id: 'e6',
    res: 'r2',
    day: 1,
    start: 9.5,
    end: 10,
    title: '候选人面试',
    cat: 'purple',
    who: '王哲',
    loc: '静思室',
  },
  {
    id: 'e7',
    res: 'r2',
    day: 3,
    start: 15,
    end: 16.5,
    title: '设计走查',
    cat: 'indigo',
    who: '李娜 +2',
    loc: '静思室',
  },

  {
    id: 'e8',
    res: 'r3',
    day: 1,
    start: 13,
    end: 15,
    title: '结对编程',
    cat: 'green',
    who: '王哲 · 实习',
    loc: '协作区',
  },
  {
    id: 'e9',
    res: 'r3',
    day: 2,
    start: 9,
    end: 10,
    title: 'Bug 分诊',
    cat: 'orange',
    who: '工程组',
    loc: '协作区',
  },
  {
    id: 'e10',
    res: 'r3',
    day: 4,
    start: 10.5,
    end: 12,
    title: '架构评审',
    cat: 'purple',
    who: '王哲 +4',
    loc: '协作区',
  },
  {
    id: 'e10b',
    res: 'r3',
    day: 3,
    start: 10,
    end: 11.5,
    title: '工程周会',
    cat: 'green',
    who: '工程组',
    loc: '协作区',
  },
  {
    id: 'e10c',
    res: 'r3',
    day: 3,
    start: 13,
    end: 14,
    title: '代码评审',
    cat: 'purple',
    who: '王哲 · 实习',
    loc: '协作区',
  },
];

export const CAT_COLOR_STYLES: Record<Cat, CatColorStyle> = {
  seafoam: {
    line: 'var(--cat-seafoam-line)',
    fill: 'var(--cat-seafoam-fill)',
    text: 'var(--cat-seafoam-text)',
  },
  indigo: {
    line: 'var(--cat-indigo-line)',
    fill: 'var(--cat-indigo-fill)',
    text: 'var(--cat-indigo-text)',
  },
  magenta: {
    line: 'var(--cat-magenta-line)',
    fill: 'var(--cat-magenta-fill)',
    text: 'var(--cat-magenta-text)',
  },
  orange: {
    line: 'var(--cat-orange-line)',
    fill: 'var(--cat-orange-fill)',
    text: 'var(--cat-orange-text)',
  },
  green: {
    line: 'var(--cat-green-line)',
    fill: 'var(--cat-green-fill)',
    text: 'var(--cat-green-text)',
  },
  purple: {
    line: 'var(--cat-purple-line)',
    fill: 'var(--cat-purple-fill)',
    text: 'var(--cat-purple-text)',
  },
};

export const CAT_COLORS: Record<Cat, string> = Object.fromEntries(
  Object.entries(CAT_COLOR_STYLES).map(([cat, colors]) => [cat, colors.line])
) as Record<Cat, string>;
