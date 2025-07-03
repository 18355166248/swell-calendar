import React from 'react';
import { CalendarStoreContext, CalendarStoreProvider } from '@/contexts/calendarStore';

interface CalendarProps {
  children: React.ReactNode;
  store: CalendarStoreContext;
}

/**
 * 日历组件
 * 使用 CalendarStoreProvider 来管理 store 的生命周期
 * 支持按需加载和独立配置
 */
export function Calendar({ children, store }: CalendarProps) {
  return <CalendarStoreProvider store={store}>{children}</CalendarStoreProvider>;
}

export default Calendar;
