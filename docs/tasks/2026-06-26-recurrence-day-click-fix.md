# 2026-06-26 recurrence 日视图点击修复

## 背景

日视图中用户创建的重复事件实例（例如标题为 `111` 的卡片）可见但点击后无法稳定打开详情/编辑入口。普通事件不受影响。

后续验证发现：进入详情后编辑重复实例时，宿主表单提交没有保留被点实例的 recurrence 元数据，导致：

- 选择「仅此次」时无法写入当前发生日期对应的 exception override。
- 选择「此次及之后」时虽然创建了新系列，但旧系列的 recurrence 截断结果没有写回，旧卡片仍继续出现。
- 选择「此次及之后」时，之后实例已生效但当前本次未生效：新系列继承父事件首日作为 start，且 weekly 规则可能仍锚定旧星期几，导致本次日期没有被新系列覆盖。
- 每周重复任务点击编辑时，表单重复选项显示为「不重复」而不是「每周」：展开实例不携带 recurrence，编辑态合并时覆盖掉了父事件规则。
- 每周重复任务在编辑表单中改成「每天」不生效：实例编辑提交没有把 recurrence 规则变化写入 scope controller，且 controller 的 `all` / `following` 分支会屏蔽 recurrence 字段。
- 移动端 day/week 点击日程会直接进入编辑页，绕过桌面详情弹层保存的 recurrence 实例上下文，导致重复实例编辑不弹 scope 选择、规则切换也无法按实例语义写回。
- 移动端月视图/列表/搜索是宿主自绘入口，直接按原始 `CalEvent.day/endDay` 分组或检索，没有经过 calendar 包内部 recurrence 展开，因此只展示父事件首日，不展示后续重复卡片。
- 桌面端右侧预览虽然仍是桌面外壳，但 calendar 内部窄布局可能带有 `view--mobile` class，`TimeEvent` 因此错误启用移动端长按编辑，导致鼠标点击不再直接走桌面详情/编辑交互。
- 小屏 viewport 仍需要切换到移动端外壳，便于真实手机与浏览器设备模拟保持一致；桌面预览误触移动端交互应在事件卡片手势层修复，而不是禁止小屏切移动端。
- 移动端样式和桌面端样式的交互模式必须一一对应，不能由 pointer 类型、包内响应式 class 与宿主外壳混合决定。
- iOS 手机上日视图顶部周条左滑切到下一周不稳定：原实现只走 Pointer Events，横向触摸容易被 Safari 默认手势/页面滚动接管。
- 普通卡片后续改成「双周」重复后，日视图/多日视图仍每周展开：weekly interval 展开以当前视口周为锚点，导致每次进入新周视口都会重新对齐 interval=2。
- 移动端日/多日视图初始化时需要自动滚到当前时间段，但用户后续切日期、切周或切视图时不应再次强制滚回当前时间，避免打断浏览位置。

## 目标

- 修复 day/week time-grid 中 recurrence 展开实例的轻点点击链路。
- 修复宿主 S2 demo 中重复实例表单编辑的 `single` / `following` 写回链路。
- 保持已有 recurrence 展开、拖拽、resize 与编辑作用域 API 不变。

## 非目标

- 不调整公开 API。
- 不改变 recurrence 规则计算与 exceptions 语义。
- 不重构 time-grid 拖拽状态机。

## 方案

recurrence 实例每次 render 都会重新 `new EventModel(inst)`，默认内部 `cid` 会变化；而 `TimeEvent` 的 React key 与拖拽 item type 都依赖 `cid`。轻点卡片时 pointerdown 会初始化拖拽状态并触发重渲染，重复实例因 key 变化被卸载，导致 pointerup 监听丢失，最终不会触发 `onEventClick`。

修复方式：

- recurrence 展开实例按稳定实例 id 生成内部 `__cid`。
- `EventModel` 初始化时尊重内部 `__cid`，让展开实例跨 render 保持相同 `cid`。
- 详情弹层保留原始引擎事件对象，点击「编辑」时保存 `recurrenceParentId` 与 `recurrenceOccurrenceDate`。
- 表单提交重复实例时先弹作用域选择，再通过 `applyRecurrenceEditScope` 写回父事件或创建新系列。
- `engineEventToDraft` raw 更新路径优先采用引擎侧最新 `recurrence`，保证 `following` 截断后的 `until` 不被旧 raw 覆盖。
- `following` 新系列显式从被编辑 occurrence 开始；若 weekly 实例改到新星期几，同步 `byWeekDays` 到新起点，避免当前本次被展开规则跳过。
- 宿主写回 `following` 时顺序等待旧系列截断完成后再创建新系列，降低并发写入造成旧卡片残留的风险。
- 重复实例进入编辑时，使用实例 draft 回填日期/时间，但显式保留父事件 `recurrence` / `recurringExceptions`，确保「每周」等重复规则在表单中正确选中。
- 表单提交重复实例时把用户选择的 recurrence 带入 changes；`all` scope 直接更新父事件规则，`following` scope 截断旧系列后用新规则创建后续系列；`single` scope 忽略 recurrence 规则变化，只保留本次覆盖字段。
- recurrence 规则在 daily / weekly / biweekly / none 间切换时清空旧规则 exceptions，避免旧发生日期污染新规则。
- 移动端点击 Calendar 展开的事件实例时，改走 recurrence-aware 的 `openEventEdit(event)`；重复实例保留 `recurrenceParentId` 与 `recurrenceOccurrenceDate`，普通事件仍直接编辑父事件。
- 为移动端自绘月视图/列表/搜索增加宿主侧 recurrence 展开数据源，展开实例保留 `engineEvent.recurrenceParentId` 与 `recurrenceOccurrenceDate`，展示和点击编辑都复用同一实例上下文。
- 移动端外壳继续按小屏 viewport 切换，保证 390×844 等移动端预览进入移动端壳。
- 宿主外壳显式标记 `data-swell-interaction-mode="mobile|desktop"`，time-grid 事件卡片只按这个交互模式选择长按编辑或桌面点击/拖拽；pointer 类型与包内 `view--mobile` class 不再单独改变交互模式。
- 日视图/多日顶部周条保留鼠标 Pointer 拖动，同时增加 Touch Events fallback；确认横向手势后阻止 iOS 默认行为，纵向手势超过阈值仍释放给页面滚动。
- 包内 weekly recurrence interval 改为以事件首发生周为锚点；日视图/多日视图按不同视口查询时不会重新对齐双周规则。
- 移动端当前时间自动定位增加初始化 gate：只有初始移动视图就是日/多日、数据加载完成且日期仍是今天时执行一次；后续切换保留用户滚动位置。

## 验证

- `node scripts/check-docs.mjs`：通过
- `node scripts/check-arch.mjs`：通过
- `./node_modules/.bin/tsc --noEmit -p packages/calendar/tsconfig.json`：通过
- `./node_modules/.bin/tsc --noEmit -p apps/swell-calendar-s2/tsconfig.json`：通过
- `packages/calendar/node_modules/.bin/vitest run src/controller/scheduler-recurrence.spec.ts`：通过（16 tests；沙箱内 Vite WebSocket 监听 `0.0.0.0:24678` 报 EPERM，但测试进程最终通过）
- `node_modules/.pnpm/node_modules/.bin/vitest run apps/swell-calendar-s2/src/calendarData.spec.ts`：通过（21 tests；同样有 Vite WebSocket EPERM 提示但测试通过）
- `cd packages/calendar && node_modules/.bin/vitest run src/controller/recurrence-edit-scope.spec.ts`：通过（19 tests；沙箱内 Vite WebSocket 监听 `0.0.0.0:24678` 报 EPERM，但测试进程最终通过）
- in-app browser：刷新 `/app/calendar/day` 后，点击标题为 `111` 的 recurrence 日视图卡片可打开详情弹层；点击「编辑」后进入编辑表单并回填标题 `111`
- in-app browser：刷新 `/app/calendar/week` 后，编辑重复实例并选择「仅此次」，只有被选中的 6/28 实例变为 `single-scope-ok`；选择「此次及之后」后，旧系列只保留 6/26，新系列 6/27、6/28 均变为 `following-scope-ok`
- in-app browser：在 `/app/calendar/day` 中编辑 6/26 的重复实例并选择「此次及之后」后，当前本次卡片立即变为 `following-current-ok`；切到 6/27 后后续实例同样为 `following-current-ok`
- in-app browser：在 `/app/calendar/week` 中打开标题 `33` 的每周重复实例并点击编辑，重复选项中「每周」按钮为 `seg-pill on`
- in-app browser：在 `/app/calendar/day` 中打开标题 `33` 的重复实例编辑表单，依次点击「每天 / 每周 / 双周 / 不重复 / 每周 / 每天」，每一步都只有当前按钮为 `seg-pill on`
- in-app browser：将标题 `33` 从「每周」改为「每天」并选择「全部」后，6/26 与 6/27 均出现 `33`；重新打开 6/27 实例编辑，重复选项中「每天」按钮为 `seg-pill on`
- in-app browser：移动端 390×844 viewport 下，打开标题 `32467` 的重复实例直接进入全屏编辑页，重复选项正确回填「每周」；切到「每天」保存后弹出 scope 选择，选择「全部」后 6/27 出现同一实例；再切回「每周」后 6/27 消失，6/26 编辑页仍为「每周」选中
- 移动端 recurrence 展开单测：weekly 实例在移动端数据源中展开到后续周同一天，且 `engineEvent` 保留 recurrence 实例上下文；daily skipped / override 生效
- in-app browser：移动端 390×844 viewport 下切到月视图，6/26 与后续每周五（7/3、7/10、7/17、7/24、7/31 等）均展示标题 `32467` 的重复 chip；点击 7/10 的 chip 进入编辑页，日期为 2026-07-10 且「每周」为 `seg-pill on`
- in-app browser：移动端 390×844 viewport 下切到列表，6/26 可见 `32467`，下滑到 7/3 后列表展示 7/3 的 `32467`；移动端搜索 `32467` 时结果包含 6/26、7/3、7/10、7/17 等后续重复实例，点击 7/10 命中进入编辑页后日期为 2026-07-10 且「每周」选中
- `apps/swell-calendar-s2/src/useIsMobile.spec.ts`：小屏 viewport 切移动端外壳；平板/桌面宽度不使用移动端外壳
- in-app browser：临时设为 390×844 viewport 时，页面进入移动端外壳：存在 `.app--mobile`，且 `.app--desktop` 不存在
- `packages/calendar/src/components/events/TimeEvent.utils.spec.tsx`：desktop interaction mode 不启用长按编辑；mobile interaction mode 启用长按编辑
- in-app browser：桌面外壳右侧预览场景下，calendar 内部存在 `swell-calendar-day-view--mobile` class 时，只要外层是 `data-swell-interaction-mode="desktop"`，普通鼠标点击 `团建方案讨论` 仍打开桌面详情浮层（出现「删除 / 编辑」）
- in-app browser：临时设为 390×844 viewport 时，`.app--mobile[data-swell-interaction-mode="mobile"]` 存在；移动端样式下卡片进入移动端交互模式
- `./node_modules/.bin/tsc --noEmit -p apps/swell-calendar-s2/tsconfig.json`：通过，覆盖周条 Touch Events fallback 类型检查
- in-app browser：临时设为 390×844 viewport 时，拖动顶部周条从 2026-06-26 左滑后切到 2026-07-03，确认现有拖动路径未回退
- `packages/calendar/node_modules/.bin/vitest run src/time/recurrence.spec.ts src/controller/scheduler-recurrence.spec.ts`：通过；新增覆盖 2026-06-26 周五双周重复在 2026-07-03 不展开、在 2026-07-10 展开
- `./node_modules/.bin/tsc --noEmit -p packages/calendar/tsconfig.json`：通过
- `./node_modules/.bin/tsc --noEmit -p apps/swell-calendar-s2/tsconfig.json`：通过，覆盖移动端初始化滚动 gate 类型检查

## 风险

- 稳定 `__cid` 是内部字段，不作为公开宿主 API 使用。
- hash 碰撞概率很低；若未来需要完全消除，可把 recurrence 实例缓存上移到 controller 层。
