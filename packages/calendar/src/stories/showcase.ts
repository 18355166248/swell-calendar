export type StorybookStageVariant = 'docs' | 'calendar' | 'component';

export interface StorybookShowcaseEntry {
  rootLabel: string;
  sectionLabel: string;
  categoryTrail: string;
  audienceLabel: 'Brand Showcase' | 'Internal QA';
  badgeLabel: string;
  stageVariant: StorybookStageVariant;
}

export const storybookTheme = {
  colorPrimary: '#c96f3b',
  colorSecondary: '#204c48',
  appBg: '#f3ede2',
  appContentBg: '#fbf7f0',
  appPreviewBg: '#efe6d7',
  borderColor: 'rgba(67, 42, 24, 0.14)',
  borderRadius: 18,
  textColor: '#1f1b16',
  textMutedColor: '#776754',
  inputBg: '#fffaf2',
  inputBorder: 'rgba(67, 42, 24, 0.16)',
  fontDisplay: '"Baskerville", "Times New Roman", "Songti SC", serif',
  fontBase: '"Avenir Next", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  fontCode: '"JetBrains Mono", "Cascadia Code", monospace',
} as const;

export const storybookStorySortOrder = [
  'Swell Calendar',
  ['概览'],
  '日历',
  [
    '视图',
    ['日视图', '周视图', '月视图', '时间线'],
    '调度器',
    ['基础', '交互', '高级能力', '回归测试'],
    '应用示例',
  ],
] as const;

export const showcaseSignals = [
  { value: '5', label: 'Core Views', description: 'Day / Week / Month / Scheduler / Timeline' },
  { value: 'Controlled', label: 'Host-owned data', description: '回调派发意图，宿主回写状态' },
  { value: 'Mobiscroll+', label: 'Desktop scheduling', description: '以桌面排程体验为对齐锚点' },
] as const;

export const showcaseViewCards = [
  {
    title: 'Day / Week',
    eyebrow: '时间网格',
    description: '全天区、跨天事件、拖拽创建 / 移动 / resize，适合日常排班与工时编排。',
    menuPath: '日历 / 视图 / 日视图 · 周视图',
  },
  {
    title: 'Month',
    eyebrow: '跨周月网格',
    description: '月格子、事件折叠、「+N 更多」浮层与 move / resize / create 的日粒度交互。',
    menuPath: '日历 / 视图 / 月视图',
  },
  {
    title: 'Scheduler',
    eyebrow: '资源调度',
    description: '资源列、显隐、recurrence、timezone、外部与跨实例拖拽，承载最完整的高级能力。',
    menuPath: '日历 / 调度器',
  },
  {
    title: 'Timeline',
    eyebrow: '日粒度排程',
    description: '按天列 + 资源行 + 跨天横条 + 车道堆叠，适合项目、驻场与里程碑排布。',
    menuPath: '日历 / 视图 / 时间线',
  },
] as const;

export const showcaseCapabilityPillars = [
  '受控增删改',
  '多资源列与分组',
  '共享事件',
  '资源显隐',
  'Recurrence 编辑作用域',
  'Timezone 双层转换',
  'External DnD',
  'Cross-instance DnD',
  '失败回调与策略来源',
] as const;

export const showcaseJourney = [
  {
    title: '从概览开始',
    description: '先看产品定位、五视图矩阵和核心约定，建立整体心智模型。',
  },
  {
    title: '浏览核心视图',
    description: '优先走 Day / Week / Month / Timeline，快速建立对渲染和交互能力的感知。',
  },
  {
    title: '深入 Scheduler',
    description: '把资源、复杂交互、高级约束和回归场景当作完整调度体系来浏览。',
  },
] as const;

export function classifyStorybookEntry(title?: string, storyName?: string): StorybookShowcaseEntry {
  const parts = title?.split('/') ?? [];
  const rootLabel = parts[0] ?? 'Swell Calendar';
  const isOverview = title === 'Swell Calendar/概览';
  const isRegression = title?.includes('回归测试') ?? false;
  const isCalendar = title?.startsWith('日历/') ?? false;
  const isAppStory = title === '日历/应用示例';
  const stageVariant: StorybookStageVariant = isOverview
    ? 'docs'
    : isCalendar || isAppStory
      ? 'calendar'
      : 'component';

  const sectionLabel = parts[1] ?? '概览';
  const categoryTrail = parts.slice(1).join(' / ') || storyName || '概览';

  let badgeLabel = '组件预览';
  if (isOverview) {
    badgeLabel = '品牌首页';
  } else if (isRegression) {
    badgeLabel = '回归场景';
  } else if (isAppStory) {
    badgeLabel = '整页工作台';
  } else if (title?.includes('/调度器/')) {
    badgeLabel = '旗舰能力';
  } else if (isCalendar) {
    badgeLabel = '核心视图';
  }

  return {
    rootLabel,
    sectionLabel,
    categoryTrail,
    audienceLabel: isRegression ? 'Internal QA' : 'Brand Showcase',
    badgeLabel,
    stageVariant,
  };
}
