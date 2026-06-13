// swell-calendar sample data — 会议室 + 成员排期（移植自设计稿 data.js）
export type Cat = 'seafoam' | 'indigo' | 'magenta' | 'orange' | 'green' | 'purple';

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
  /** 0=周一 .. 6=周日，当前展示周内 */
  day: number;
  /** 十进制小时，如 9.5 = 9:30 */
  start: number;
  end: number;
  title: string;
  cat: Cat;
  who?: string;
  loc?: string;
  desc?: string;
}

export interface MonthEvent {
  title: string;
  cat: Cat;
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

export const monthEvents: Record<number, MonthEvent[]> = {
  3: [
    { title: '季度启动', cat: 'seafoam' },
    { title: '1:1 · 李娜', cat: 'magenta' },
  ],
  4: [{ title: '客户演示', cat: 'orange' }],
  7: [
    { title: '设计评审', cat: 'indigo' },
    { title: '结对编程', cat: 'green' },
    { title: 'Bug 分诊', cat: 'orange' },
  ],
  8: [{ title: '全员同步', cat: 'seafoam' }],
  11: [{ title: '面试 ×2', cat: 'purple' }],
  12: [
    { title: '路线图梳理', cat: 'indigo' },
    { title: '客户演示彩排', cat: 'orange' },
  ],
  14: [{ title: '季度规划工作坊', cat: 'indigo' }],
  15: [
    { title: '架构评审', cat: 'purple' },
    { title: '组件库设计', cat: 'purple' },
  ],
  18: [{ title: '干系人对齐', cat: 'orange' }],
  21: [
    { title: '产品双周评审', cat: 'seafoam' },
    { title: '1:1 · 张明', cat: 'magenta' },
    { title: '设计走查', cat: 'indigo' },
    { title: 'Bug 分诊', cat: 'orange' },
  ],
  22: [{ title: '全员同步会', cat: 'seafoam' }],
  25: [{ title: '发布评审', cat: 'green' }],
  28: [{ title: '回顾会', cat: 'indigo' }],
};

export const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
export const weekDates = [18, 19, 20, 21, 22, 23, 24];

export const CAT_COLORS: Record<Cat, string> = {
  seafoam: 'var(--cat-seafoam-line)',
  indigo: 'var(--cat-indigo-line)',
  magenta: 'var(--cat-magenta-line)',
  orange: 'var(--cat-orange-line)',
  green: 'var(--cat-green-line)',
  purple: 'var(--cat-purple-line)',
};
