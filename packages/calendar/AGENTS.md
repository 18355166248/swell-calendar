# packages/calendar — 智能体导航

> 核心日历组件库。技术栈：React 18 + Zustand 5 + Immer + dayjs + SCSS。

## src/ 目录结构

```
src/
├── types/          [层 0] TypeScript 类型定义
├── constants/      [层 1] 常量（CSS 前缀、颜色、尺寸）
├── utils/          [层 2] 通用工具（Collection、数组、对象、DOM）
├── time/           [层 3] 时间处理（DayjsTZDate、日期操作）
├── model/          [层 4] 数据模型（EventModel、EventUIModel）
├── store/          [层 5] Zustand Context 工厂
├── slices/         [层 5] 状态切片（options、calendar、view、layout、dnd、gridSelection、theme）
├── contexts/       [层 5] Store 实例（calendarStore、themeStore）
├── controller/     [层 6] 业务逻辑（碰撞分组、布局、事件CRUD、时间计算）
├── helpers/        [层 7] 视图辅助（css工具、网格、星期名称）
├── hooks/          [层 8] React Hooks（拖拽、网格选择、滚动同步）
├── Template/       [层 9] 可替换渲染函数（时间格式、事件标题等）
└── components/     [层 10] UI 组件（根组件、视图、时间网格、事件卡）
```

## 关键文件速查

### 状态管理
- `contexts/calendarStore.ts` — 主 Store（组合所有 slices）
- `contexts/themeStore.ts` — 主题 Store（全局单例）
- `store/index.ts` — `createStoreContext` 工厂函数

### 事件数据流
```
EventObject（用户输入）
  → EventModel（business，含碰撞检测）
  → EventUIModel（render，含 top/left/width/height）
  → TimeEvent 组件渲染
```

### 组件树
```
<Calendar>                   ← Store 注入
  <Layout>                   ← 尺寸监听
    <Panel>                  ← 区域高度管理
      <TimeGridView>         ← 时间网格主体
        <TimeColumn>         ← 左侧时间轴
        <Column>             ← 日期列（含事件渲染）
          <TimeEvent>        ← 事件卡片（拖拽/resize）
```

### 视图文件
- `components/view/Day.tsx` — 日视图（已完成）
- `components/view/Week.tsx` — 周视图（已完成）
- `components/view/Month.tsx` — 月视图（开发中）

## 分层约束详情

违反规则 = `node scripts/check-arch.mjs` 报错，含修复指令。

| 层 | 目录 | 不能导入 |
|----|------|---------|
| 0 | types/ | 任何项目内部目录 |
| 1 | constants/ | utils/ time/ model/ 及以上 |
| 2 | utils/ | time/ model/ controller/ hooks/ components/ |
| 3 | time/ | model/ controller/ hooks/ components/ |
| 4 | model/ | controller/ hooks/ components/ |
| 5 | store/ slices/ contexts/ | controller/ hooks/ components/ |
| 6 | controller/ | hooks/ components/ |
| 7 | helpers/ | hooks/ components/ |
| 8 | hooks/ | components/ |
| 9 | Template/ | components/ |

## 状态切片列表

| 切片文件 | 状态内容 |
|---------|---------|
| `slices/options.slice.ts` | week/month 选项、defaultView、isReadOnly |
| `slices/calendat.slice.ts` | EventModel 集合（Collection） |
| `slices/view.slice.ts` | currentView、renderDate |
| `slices/layout.slice.ts` | 面板高度、lastPanel |
| `slices/dnd.slice.ts` | 拖拽状态机（IDLE/INIT/DRAGGING） |
| `slices/gridSelection.slice.ts` | 时间范围选择状态 |
| `slices/template.slice.ts` | 7 个可定制渲染函数 |
| `slices/theme/` | 主题（common/week/month） |

## 品味不变式（ESLint 强制）

- 禁止 `console.log`（裸输出会污染组件库）
- 文件不超过 400 行（超过须拆分到 domain-specific 子模块）
- 导入顺序：第三方包 → 内部层（按层号升序）
- 组件文件后缀 `.tsx`，纯逻辑文件 `.ts`

## 常见模式

### 从 store 读取状态
```ts
// 在 hooks 中
const store = useCalendarStore();
const view = store(state => state.view.currentView);
```

### 创建 EventModel
```ts
const events = createEvents(rawEventObjects); // controller/event.controller.ts
```

### 计算事件布局
```ts
// controller/column.controller.ts
const uiModels = setRenderInfoOfUIModels(collisionGroup, timeGridData);
```
