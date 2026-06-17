# ADR-2026-06 swell-calendar-s2 前端路由

## 标题

宿主应用 `apps/swell-calendar-s2` 引入 react-router-dom，URL 作为视图的唯一真源；日期不走 URL，刷新回到今天。

## 状态

- Accepted

## 背景

宿主应用此前没有路由：当前视图（`view`）是 `useState`，刷新即丢失。聚焦日期（`currentDate`）也由 `useState` 管理，但刷新回到当天即可，无需持久化到 URL。后期可能出现跨页面功能（如任务、人员），需要一级应用区为兄弟页面预留位置。

## 决策

### 1. 路由结构采用二级 `/app/calendar/:view`

- 一级 `app`：应用区，为后续跨页面（`/app/tasks`、`/app/people`）预留
- 二级 `:view`：`day | week | month | scheduler | timeline`
- 非法 view 通过 `<Navigate replace>` 回落默认视图 `scheduler`

日期（`currentDate`）**不**放进 URL——由 App 内部 `useState(() => new Date())` 管理，刷新回到今天。理由：日历应用刷新回到当前日期范围是自然预期，日期参数增加 URL 复杂度但用户收益有限。

### 2. 驱动模式：view 走 URL，日期走 state + 命令式

- `view`：唯一真源是 URL，切视图直接 `navigate('/app/calendar/' + nextView)`
- `currentDate`：沿用原有模式——`calRef.setDate/navigate/goToToday` 命令式驱动引擎，`onPageChange` 回填 `useState`（按天短路）
- `options.defaultView/initialDate` 用 `useMemo` 稳定引用，避免每次 render 触发引擎 options effect（`Calendar.tsx:60-68`）

### 3. 选择 react-router-dom

生态成熟，声明式 `Routes`/`Navigate` 适合参数校验与兜底重定向，契合路由结构与后续跨页面扩展。

## 备选方案

- 方案 A：三级路由 `/app/calendar/:view/:date`（日期也走 URL）
  - 优点：URL 可分享完整状态（视图 + 日期）
  - 缺点：增加 URL 复杂度，日历应用刷新回到当天是自然预期，日期参数用户收益有限
- 方案 B：TanStack Router
  - 优点：search params 类型安全更强
  - 缺点：学习曲线陡、团队陌生度高，收益与成本不匹配
- 方案 C：不引库，手写 history API + URL 同步
  - 优点：零新依赖
  - 缺点：需自行处理前进 / 后退 / 嵌套 / 守卫，后期跨页面会变成负担

## 影响

- 对开发流程的影响：引入新运行时依赖 `react-router-dom`，命中「建议写 ADR」（`docs/WORKFLOW.md`）
- 对 API 的影响：无。不改变 `packages/calendar` 的公开 API，路由纯粹是宿主应用内部结构
- 对架构的影响：宿主应用首次拥有路由层；`docs/ARCHITECTURE.md` 根目录表补 `apps/swell-calendar-s2/` 并新增「宿主应用」小节。`check-arch.mjs` 不扫 `apps/`，路由不触发架构门禁

## 后续动作

- 新增 `docs/tasks/2026-06-16-s2-react-router.md`
- 更新 `docs/ARCHITECTURE.md`（根目录表 + 宿主应用小节）
