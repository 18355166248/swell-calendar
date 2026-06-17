// swell-calendar sample data — 团队成员排期（移植自设计稿 data.js）
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
    name: '周婷',
    short: '周婷',
    type: 'person',
    cap: '',
    color: 'seafoam',
    initials: 'ZT',
  },
  {
    id: 'r2',
    name: '赵阳',
    short: '赵阳',
    type: 'person',
    cap: '',
    color: 'indigo',
    initials: 'ZY',
  },
  {
    id: 'r3',
    name: '孙磊',
    short: '孙磊',
    type: 'person',
    cap: '',
    color: 'green',
    initials: 'SL',
  },
  {
    id: 'r4',
    name: '吴佳琪',
    short: '吴佳琪',
    type: 'person',
    cap: '',
    color: 'orange',
    initials: 'WJ',
  },
  {
    id: 'r5',
    name: '黄思雨',
    short: '黄思雨',
    type: 'person',
    cap: '',
    color: 'purple',
    initials: 'HS',
  },
  {
    id: 'p1',
    name: '陈伊一',
    short: '陈伊一',
    type: 'person',
    cap: '',
    color: 'magenta',
    initials: 'CY',
  },
  {
    id: 'p2',
    name: '张明',
    short: '张明',
    type: 'person',
    cap: '',
    color: 'seafoam',
    initials: 'ZM',
  },
  {
    id: 'p3',
    name: '李娜',
    short: '李娜',
    type: 'person',
    cap: '',
    color: 'indigo',
    initials: 'LN',
  },
  {
    id: 'p4',
    name: '王哲',
    short: '王哲',
    type: 'person',
    cap: '',
    color: 'green',
    initials: 'WZ',
  },
  {
    id: 'p5',
    name: '林峰',
    short: '林峰',
    type: 'person',
    cap: '',
    color: 'orange',
    initials: 'LF',
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
  },

  // ── 吴佳琪 (r4) ──
  {
    id: 'e11',
    res: 'r4',
    day: 0,
    start: 9,
    end: 12,
    title: '全员大会 · 季度回顾',
    cat: 'orange',
    who: '全员',
  },
  {
    id: 'e12',
    res: 'r4',
    day: 2,
    start: 14,
    end: 17,
    title: '产品发布会彩排',
    cat: 'seafoam',
    who: '产品 · 市场',
  },
  {
    id: 'e13',
    res: 'r4',
    day: 4,
    start: 10,
    end: 12,
    title: '投资人路演',
    cat: 'indigo',
    who: 'CEO · CFO · 张明',
  },

  // ── 黄思雨 (r5) ──
  {
    id: 'e14',
    res: 'r5',
    day: 0,
    start: 14,
    end: 17,
    title: '新员工入职培训',
    cat: 'purple',
    who: 'HR · 林峰 +5',
  },
  {
    id: 'e15',
    res: 'r5',
    day: 1,
    start: 9,
    end: 11,
    title: '安全合规培训',
    cat: 'orange',
    who: '全员',
  },
  {
    id: 'e16',
    res: 'r5',
    day: 1,
    start: 13,
    end: 16,
    title: '技术分享 · 微服务架构',
    cat: 'green',
    who: '王哲 · 工程组',
  },
  {
    id: 'e17',
    res: 'r5',
    day: 3,
    start: 9,
    end: 12,
    title: '设计系统工作坊',
    cat: 'magenta',
    who: '李娜 +3',
  },

  // ── 陈伊一 (p1) ──
  {
    id: 'e18',
    res: 'p1',
    day: 0,
    start: 9,
    end: 10,
    title: '周一晨会',
    cat: 'magenta',
    who: '陈伊一',
  },
  {
    id: 'e19',
    res: 'p1',
    day: 0,
    start: 10,
    end: 11.5,
    title: '产品评审',
    cat: 'seafoam',
    who: '陈伊一 · 产品组',
  },
  {
    id: 'e20',
    res: 'p1',
    day: 2,
    start: 14,
    end: 15,
    title: '1:1 · 张明',
    cat: 'magenta',
    who: '陈伊一 · 张明',
  },
  {
    id: 'e21',
    res: 'p1',
    day: 3,
    start: 9,
    end: 10,
    title: 'OKR 复盘',
    cat: 'indigo',
    who: '陈伊一',
  },
  {
    id: 'e22',
    res: 'p1',
    day: 4,
    start: 15,
    end: 16,
    title: '周报撰写',
    cat: 'magenta',
    who: '陈伊一',
  },

  // ── 张明 (p2) ──
  {
    id: 'e23',
    res: 'p2',
    day: 0,
    start: 14,
    end: 15,
    title: '客户演示',
    cat: 'orange',
    who: '张明 +3',
  },
  {
    id: 'e24',
    res: 'p2',
    day: 1,
    start: 10,
    end: 11,
    title: '销售周会',
    cat: 'seafoam',
    who: '张明 · 销售组',
  },
  {
    id: 'e25',
    res: 'p2',
    day: 1,
    start: 14,
    end: 16,
    title: '客户拜访 · 外勤',
    cat: 'orange',
    who: '张明',
  },
  {
    id: 'e26',
    res: 'p2',
    day: 3,
    start: 9,
    end: 10,
    title: '线索复盘',
    cat: 'seafoam',
    who: '张明 · 销售组',
  },
  {
    id: 'e27',
    res: 'p2',
    day: 4,
    start: 10,
    end: 12,
    title: '合作方案讨论',
    cat: 'orange',
    who: '张明 · 林峰',
  },

  // ── 李娜 (p3) ──
  {
    id: 'e28',
    res: 'p3',
    day: 0,
    start: 10,
    end: 12,
    title: '设计评审',
    cat: 'indigo',
    who: '李娜 · 设计组',
  },
  {
    id: 'e29',
    res: 'p3',
    day: 1,
    start: 9,
    end: 10,
    title: '站会',
    cat: 'green',
    who: '李娜 · 工程组',
  },
  {
    id: 'e30',
    res: 'p3',
    day: 2,
    start: 15,
    end: 17,
    title: '用户访谈',
    cat: 'magenta',
    who: '李娜 +1',
  },
  {
    id: 'e31',
    res: 'p3',
    day: 3,
    start: 14,
    end: 15.5,
    title: '交互走查',
    cat: 'indigo',
    who: '李娜 · 王哲',
  },

  // ── 王哲 (p4) ──
  {
    id: 'e32',
    res: 'p4',
    day: 0,
    start: 9,
    end: 9.5,
    title: '站会',
    cat: 'green',
    who: '工程组',
  },
  {
    id: 'e33',
    res: 'p4',
    day: 0,
    start: 10,
    end: 12,
    title: '技术选型会议',
    cat: 'purple',
    who: '王哲 · CTO',
  },
  {
    id: 'e34',
    res: 'p4',
    day: 1,
    start: 13,
    end: 15,
    title: '结对编程',
    cat: 'green',
    who: '王哲 · 实习',
  },
  {
    id: 'e35',
    res: 'p4',
    day: 2,
    start: 9,
    end: 11,
    title: '架构评审',
    cat: 'purple',
    who: '王哲 +4',
  },
  {
    id: 'e36',
    res: 'p4',
    day: 3,
    start: 10,
    end: 11.5,
    title: '工程周会',
    cat: 'green',
    who: '工程组',
  },
  {
    id: 'e37',
    res: 'p4',
    day: 4,
    start: 14,
    end: 16,
    title: 'Sprint 回顾',
    cat: 'seafoam',
    who: '王哲 · 工程组',
  },

  // ── 林峰 (p5) ──
  {
    id: 'e38',
    res: 'p5',
    day: 0,
    start: 14,
    end: 17,
    title: '新员工培训',
    cat: 'orange',
    who: '林峰 +5',
  },
  {
    id: 'e39',
    res: 'p5',
    day: 1,
    start: 9,
    end: 10,
    title: 'HR 周会',
    cat: 'purple',
    who: '林峰 · HR 组',
  },
  {
    id: 'e40',
    res: 'p5',
    day: 2,
    start: 10,
    end: 12,
    title: '面试 · 高级工程师',
    cat: 'indigo',
    who: '林峰 · 王哲',
  },
  {
    id: 'e41',
    res: 'p5',
    day: 3,
    start: 14,
    end: 15,
    title: '绩效沟通',
    cat: 'magenta',
    who: '林峰',
  },
  {
    id: 'e42',
    res: 'p5',
    day: 3,
    start: 15,
    end: 16.5,
    title: '组织文化建设',
    cat: 'orange',
    who: '林峰 · HR 组',
  },
  {
    id: 'e43',
    res: 'p5',
    day: 4,
    start: 9,
    end: 11,
    title: '团建方案讨论',
    cat: 'purple',
    who: '林峰 · 陈伊一',
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
