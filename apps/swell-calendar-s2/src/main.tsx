// 设计稿是一套自包含的 Spectrum 2 近似 CSS 体系（非真实 S2 组件），
// 按 handoff README「像素级还原」优先，这里直接加载设计 CSS，不引 S2 的 page.css
// （其全局背景会冲突 --bg-app）。
// P4: 引入 swell-calendar 引擎样式。
import 'swell-calendar/style.css';
import './styles/spectrum-tokens.css';
import './styles/app.css';
import './styles/overlays.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
