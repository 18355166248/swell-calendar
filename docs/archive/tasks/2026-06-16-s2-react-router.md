# 2026-06-16 swell-calendar-s2 引入前端路由

## 背景

当前 `apps/swell-calendar-s2` 宿主应用没有路由：当前视图（`view`）是 `useState`，刷新即丢失，无法分享或直达某个视图。聚焦日期（`currentDate`）也由 `useState` 管理，刷新回到今天即可。后期可能有跨页面功能（如任务、人员），需要一级应用区为兄弟页面预留位置。

## 目标

- 引入 `react-router-dom`，做路由 `/app/calendar/:view`
  - 一级 `app`：应用区，为后续跨页面（`/app/tasks`、`/app/people`）预留
  - 二级 `:view`：`day | week | month | scheduler | timeline`
- URL 成为 `view` 的唯一真源，刷新保持在当前视图
- 日期（`currentDate`）由 App 内部 `useState` 管理，刷新回到今天，不走 URL
- 非法 `view` 自动重定向到默认视图（`scheduler`）

## 非目标

- 不把日期放进 URL（刷新回到当前日期范围即可）
- 不改变 `packages/calendar` 包的公开 API
- 不处理跨页面业务（仅预留路由结构）

## 影响范围

- 代码：
  - `apps/swell-calendar-s2/package.json` — 新增 `react-router-dom`
  - `apps/swell-calendar-s2/src/router.tsx` — 新增路由配置与参数校验
  - `apps/swell-calendar-s2/src/App.tsx` — `view` 真源从 `useState` 迁移到路由 prop；切视图改为写 URL
  - `apps/swell-calendar-s2/src/main.tsx` — 挂载 `AppRoutes`
- 文档：
  - `docs/ARCHITECTURE.md` — 根目录表补 `apps/swell-calendar-s2/` 与宿主结构小节
  - `docs/adrs/ADR-2026-06-s2-router.md` — 新增决策记录
- 运行时行为：
  - 刷新页面保持在当前视图（日期回到今天）
  - 浏览器前进 / 后退可回溯视图切换
  - 直接访问 `/app/calendar/week` 直达周视图

## 现状

`App.tsx:206-208`：

```ts
const [view, setView] = useState<ViewId>('scheduler');
const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2025, 2, 21));
```

视图切换（侧栏 / 顶栏 SegmentedControl）、日期导航（MiniCalendar 点击、顶栏「今天 / 左右箭头」）都直接改这两个 state。引擎侧通过 `calRef` 命令式 + `onPageChange` 回调与这两个值双向同步（`App.tsx:318-356`）。

## 方案

### 路由结构

- `/` → `<Navigate>` 到 `/app/calendar/scheduler`
- `/app/calendar/:view` → `<CalendarRoute>`
- `*` → 回默认视图

### 驱动模式：view 走 URL，日期走 state

- `view` 由路由参数 `useParams` 派生，唯一真源是 URL
- `currentDate` 由 App 内部 `useState(() => new Date())` 管理，刷新回到今天
- 切视图：直接写 URL（`navigate('/app/calendar/' + nextView)`），日期不变
- 日期导航：沿用原有 `calRef` 命令式 + `onPageChange` 回填 state 的模式，不涉及 URL
- `options.defaultView/initialDate` 用 `useMemo` 稳定引用，避免每次 render 触发引擎 options effect

### 参数校验与兜底

`<CalendarRoute>` 读 `useParams`：
- `view ∉ {day,week,month,scheduler,timeline}` → 重定向到 `/app/calendar/scheduler`

## 文档变更

- [ ] 更新 `packages/calendar/SPEC.md`（不涉及包公开 API）
- [x] 更新 `docs/ARCHITECTURE.md`（根目录表补宿主应用、新增宿主结构小节）
- [x] 新增 ADR（`ADR-2026-06-s2-router.md`）
- [x] 任务记录（本文件）

## 验证计划

- [ ] `node scripts/check-docs.mjs`
- [ ] `node scripts/check-arch.mjs`
- [ ] `pnpm --filter swell-calendar-s2 exec tsc --noEmit`
- [ ] 手动：刷新各视图停留、前进 / 后退、直接访问 URL、非法 view 触发重定向

## 风险与回滚

- 风险：低。view 和 currentDate 的驱动逻辑互不干扰，不存在 options effect ↔ onPageChange 循环
- 回滚方式：改动集中在 `router.tsx`（新增）/ `App.tsx`（view 迁移）/ `main.tsx`（一行）+ 移除依赖；revert commit 即可

## 实施结果

实现完成后补充：

- 实际改动：
  - `apps/swell-calendar-s2/src/router.tsx` 已新增 `BrowserRouter + Routes`，落地 `/app/calendar/:view` 路由结构，非法 `view` 统一重定向到 `/app/calendar/scheduler`。
  - `apps/swell-calendar-s2/src/App.tsx` 已改为从路由 props 接收 `view`，并通过 `useNavigate()` 把顶栏 / 侧栏视图切换写回 URL；`currentDate` 继续由宿主 state 管理，经 `calRef` 和 `onPageChange` 双向同步。
  - `apps/swell-calendar-s2/src/main.tsx` 已改为挂载 `AppRoutes`。
  - `apps/swell-calendar-s2/package.json` 已接入 `react-router-dom` 依赖。
  - `docs/ARCHITECTURE.md` 与 `docs/adrs/ADR-2026-06-s2-router.md` 已同步记录宿主路由层。
- 与原计划的偏差：
  - `packages/calendar/SPEC.md` 未更新，原因与任务单一致：路由仅发生在宿主应用内部，不涉及组件库公开 API。
- 验证结果：
  - `node scripts/check-docs.mjs` 通过。
  - `node scripts/check-arch.mjs` 通过。
  - `pnpm --filter swell-calendar exec tsc --noEmit` 通过。
  - `pnpm --filter swell-calendar-s2 exec tsc --noEmit` 通过。
  - `pnpm --filter swell-calendar-s2 build` 通过。
- 剩余问题：
  - 本轮未在浏览器里逐项回放“前进 / 后退 / 直接访问非法 view”的手工验收，但路由表、参数校验和重定向代码已落地，且构建通过。
