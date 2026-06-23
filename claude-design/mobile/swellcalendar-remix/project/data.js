// swell-calendar sample data — meeting rooms + staff scheduling
window.SWELL = (function () {
  const resources = [
    { id: "r1", name: "会议室 · 海景厅", short: "海景厅", type: "room", cap: "12 人", color: "seafoam", floor: "F12" },
    { id: "r2", name: "会议室 · 静思室", short: "静思室", type: "room", cap: "4 人", color: "indigo", floor: "F12" },
    { id: "r3", name: "会议室 · 协作区", short: "协作区", type: "room", cap: "8 人", color: "green", floor: "F11" },
    { id: "p1", name: "张明 · 产品", short: "张明", type: "person", cap: "产品经理", color: "magenta", initials: "张" },
    { id: "p2", name: "李娜 · 设计", short: "李娜", type: "person", cap: "设计师", color: "orange", initials: "李" },
    { id: "p3", name: "王哲 · 工程", short: "王哲", type: "person", cap: "工程师", color: "purple", initials: "王" },
  ];

  // events: day index 0=Mon..6=Sun within the displayed week; start/end in decimal hours
  const events = [
    { id: "e1", res: "r1", day: 0, start: 9, end: 10.5, title: "产品双周评审", cat: "seafoam", who: "产品 · 设计 · 工程", loc: "海景厅", desc: "回顾上个迭代，确认本期范围与优先级。" },
    { id: "e2", res: "r1", day: 0, start: 14, end: 15, title: "客户演示彩排", cat: "orange", who: "张明 +3", loc: "海景厅" },
    { id: "e3", res: "r1", day: 2, start: 10, end: 12, title: "季度规划工作坊", cat: "indigo", who: "全员", loc: "海景厅" },
    { id: "e3b", res: "r1", day: 3, start: 9, end: 10.5, title: "晨会 · 站会", cat: "seafoam", who: "团队", loc: "海景厅" },
    { id: "e3c", res: "r1", day: 3, start: 14, end: 16, title: "客户提案会", cat: "orange", who: "销售 · 张明 +2", loc: "海景厅" },
    { id: "e4", res: "r1", day: 4, start: 13.5, end: 14.5, title: "全员同步会", cat: "seafoam", who: "团队", loc: "海景厅" },

    { id: "e5", res: "r2", day: 0, start: 11, end: 12, title: "1:1 · 李娜", cat: "magenta", who: "张明 · 李娜", loc: "静思室" },
    { id: "e6", res: "r2", day: 1, start: 9.5, end: 10, title: "候选人面试", cat: "purple", who: "王哲", loc: "静思室" },
    { id: "e7", res: "r2", day: 3, start: 15, end: 16.5, title: "设计走查", cat: "indigo", who: "李娜 +2", loc: "静思室" },

    { id: "e8", res: "r3", day: 1, start: 13, end: 15, title: "结对编程", cat: "green", who: "王哲 · 实习", loc: "协作区" },
    { id: "e9", res: "r3", day: 2, start: 9, end: 10, title: "Bug 分诊", cat: "orange", who: "工程组", loc: "协作区" },
    { id: "e10", res: "r3", day: 4, start: 10.5, end: 12, title: "架构评审", cat: "purple", who: "王哲 +4", loc: "协作区" },
    { id: "e10b", res: "r3", day: 3, start: 10, end: 11.5, title: "工程周会", cat: "green", who: "工程组", loc: "协作区" },
    { id: "e10c", res: "r3", day: 3, start: 13, end: 14, title: "代码评审", cat: "purple", who: "王哲 · 实习", loc: "协作区" },

    { id: "e11", res: "p1", day: 0, start: 9, end: 10.5, title: "产品双周评审", cat: "seafoam", who: "海景厅", loc: "海景厅" },
    { id: "e12", res: "p1", day: 1, start: 16, end: 17, title: "路线图梳理", cat: "indigo", who: "个人专注", loc: "工位" },
    { id: "e13", res: "p1", day: 3, start: 11, end: 12, title: "干系人对齐", cat: "orange", who: "市场 · 销售", loc: "线上" },

    { id: "e14", res: "p2", day: 0, start: 11, end: 12, title: "1:1 · 张明", cat: "magenta", who: "静思室", loc: "静思室" },
    { id: "e15", res: "p2", day: 2, start: 14, end: 16, title: "组件库设计", cat: "purple", who: "专注时间", loc: "工位" },
    { id: "e16", res: "p2", day: 3, start: 15, end: 16.5, title: "设计走查", cat: "indigo", who: "静思室", loc: "静思室" },

    { id: "e17", res: "p3", day: 1, start: 13, end: 15, title: "结对编程", cat: "green", who: "协作区", loc: "协作区" },
    { id: "e18", res: "p3", day: 2, start: 9, end: 10, title: "Bug 分诊", cat: "orange", who: "协作区", loc: "协作区" },
    { id: "e19", res: "p3", day: 4, start: 10.5, end: 12, title: "架构评审", cat: "purple", who: "协作区", loc: "协作区" },
    { id: "e19b", res: "p3", day: 3, start: 10, end: 11.5, title: "工程周会", cat: "green", who: "协作区", loc: "协作区" },
    { id: "e19c", res: "p3", day: 3, start: 15, end: 17, title: "专注 · 修复缺陷", cat: "purple", who: "个人专注", loc: "工位" },
  ];

  // month: events keyed by day-of-month for a 5-week grid
  const monthEvents = {
    3: [{ title: "季度启动", cat: "seafoam" }, { title: "1:1 · 李娜", cat: "magenta" }],
    4: [{ title: "客户演示", cat: "orange" }],
    7: [{ title: "设计评审", cat: "indigo" }, { title: "结对编程", cat: "green" }, { title: "Bug 分诊", cat: "orange" }],
    8: [{ title: "全员同步", cat: "seafoam" }],
    11: [{ title: "面试 ×2", cat: "purple" }],
    12: [{ title: "路线图梳理", cat: "indigo" }, { title: "客户演示彩排", cat: "orange" }],
    14: [{ title: "季度规划工作坊", cat: "indigo" }],
    15: [{ title: "架构评审", cat: "purple" }, { title: "组件库设计", cat: "purple" }],
    18: [{ title: "干系人对齐", cat: "orange" }],
    21: [{ title: "产品双周评审", cat: "seafoam" }, { title: "1:1 · 张明", cat: "magenta" }, { title: "设计走查", cat: "indigo" }, { title: "Bug 分诊", cat: "orange" }],
    22: [{ title: "全员同步会", cat: "seafoam" }],
    25: [{ title: "发布评审", cat: "green" }],
    28: [{ title: "回顾会", cat: "indigo" }],
  };

  // one-off extras keyed by day-of-month (variety on top of the weekly recurring set)
  // days 1..31 = March, 32+ = April (day 32 = Apr 1)
  const dateExtra = {
    19: [{ id: "x19", start: 16, end: 17, title: "投资人季度更新", cat: "indigo", who: "CEO · 财务", loc: "海景厅" }],
    25: [{ id: "x25", start: 15, end: 16.5, title: "路线图评审", cat: "seafoam", who: "产品 · 张明", loc: "海景厅" }],
    26: [{ id: "x26a", start: 11, end: 12, title: "用户访谈 ×3", cat: "magenta", who: "研究 · 李娜", loc: "静思室" },
         { id: "x26b", start: 17, end: 18, title: "OKR 复盘", cat: "orange", who: "团队", loc: "海景厅" }],
    28: [{ id: "x28", start: 13.5, end: 15, title: "供应商评估", cat: "purple", who: "采购 +2", loc: "协作区" }],
    32: [{ id: "x32a", start: 9, end: 10, title: "Q2 启动会", cat: "seafoam", who: "全员", loc: "海景厅" },
         { id: "x32b", start: 14, end: 15.5, title: "季度目标对齐", cat: "indigo", who: "管理层", loc: "海景厅" }],
    33: [{ id: "x33", start: 10.5, end: 11.5, title: "新人入职引导", cat: "green", who: "HR · 王哲", loc: "协作区" }],
    34: [{ id: "x34", start: 15, end: 16, title: "品牌视觉评审", cat: "orange", who: "设计 · 李娜", loc: "静思室" }],
    35: [{ id: "x35", start: 13, end: 14, title: "节前安排同步", cat: "seafoam", who: "行政", loc: "线上" }],
    39: [{ id: "x39a", start: 9.5, end: 11, title: "产品评审 · v2", cat: "seafoam", who: "产品 · 设计", loc: "海景厅" },
         { id: "x39b", start: 16, end: 17, title: "市场复盘", cat: "magenta", who: "市场组", loc: "静思室" }],
    41: [{ id: "x41", start: 14, end: 15, title: "客户签约", cat: "orange", who: "销售 · 张明", loc: "海景厅" }],
    42: [{ id: "x42", start: 11, end: 12.5, title: "技术分享会", cat: "purple", who: "工程组", loc: "协作区" }],
    43: [{ id: "x43", start: 11, end: 12, title: "月度全员会", cat: "seafoam", who: "全员", loc: "海景厅" }],
  };

  // all-day items keyed by day-of-month (solar terms / company-wide)
  const allDay = {
    20: [{ title: "春分", cat: "green", term: true }],
    21: [{ title: "全员战略对齐", cat: "seafoam" }],
    32: [{ title: "Q2 启动周", cat: "seafoam" }],
    35: [{ title: "清明", cat: "green", term: true }],
  };

  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const weekDates = [18, 19, 20, 21, 22, 23, 24];

  return { resources, events, monthEvents, dateExtra, allDay, weekDays, weekDates };
})();
