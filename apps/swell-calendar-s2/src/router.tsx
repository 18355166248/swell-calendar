// ===== 前端路由 =====
// 二级路由 /app/calendar/:view，让 URL 成为视图的唯一真源，刷新保持在当前视图。
// 日期不走 URL（刷新回到今天），由 App 内部 useState 管理 + 引擎 onPageChange 回填。
// 一级 `app` 为应用区，为后续跨页面（/app/tasks、/app/people）预留位置。
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';

import App from './App';
import type { ViewId } from './shell';

/** 全部合法视图 ID，与引擎 ViewType 对齐（packages/calendar ViewType）。 */
export const VIEW_IDS: ViewId[] = [
  'day',
  'week',
  'month',
  'multiDay',
  'agenda',
  'scheduler',
  'timeline',
];

/** 默认视图（沿用改动前 useState 初值）。 */
const DEFAULT_VIEW: ViewId = 'scheduler';

function isViewId(v: string | undefined): v is ViewId {
  return !!v && (VIEW_IDS as string[]).includes(v);
}

/**
 * 校验路由参数并渲染 <App>。
 * view 非法或缺失 → <Navigate replace> 回落默认视图。
 */
function CalendarRoute() {
  const { view } = useParams<{ view?: string }>();

  if (!isViewId(view)) {
    return <Navigate to={`/app/calendar/${DEFAULT_VIEW}`} replace />;
  }

  return <App view={view} />;
}

/** 根入口：声明式路由表。 */
export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 根 → 默认视图 */}
        <Route path="/" element={<Navigate to={`/app/calendar/${DEFAULT_VIEW}`} replace />} />
        {/* 主路由：仅 view 参数，日期由 App 内部管理 */}
        <Route path="/app/calendar/:view" element={<CalendarRoute />} />
        {/* 其它 → 回默认视图 */}
        <Route path="*" element={<Navigate to={`/app/calendar/${DEFAULT_VIEW}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
