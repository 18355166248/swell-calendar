// 设计稿是一套自包含的 Spectrum 2 近似 CSS 体系（非真实 S2 组件），
// 按 handoff README「像素级还原」优先，这里直接加载设计 CSS，不引 S2 的 page.css/Provider
// （二者的全局背景会冲突）。真实 S2 组件替换留作后续阶段。
import './styles/spectrum-tokens.css';
import './styles/app.css';
import './styles/views.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
