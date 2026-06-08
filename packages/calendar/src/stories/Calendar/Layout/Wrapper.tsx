import { PropsWithChildren, useRef } from 'react';

import { CalendarProvider } from '@/components/CalendarProvider';
import { CalendarStoreContext, createCalendarStore } from '@/contexts/calendarStore';
import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

export function Wrapper({
  children,
  events,
  options,
}: PropsWithChildren<{ events?: EventObject[]; options?: Options }>) {
  // 每个故事实例自带一个 store，并在创建时一次性 seed 事件 / options。
  // 不能用模块级的「只 seed 一次」标记：Storybook manager 内切换故事不会整页刷新，
  // 标记会停在 true，导致后续故事拿到未配置的新 store（如 timeline 报「暂无资源配置」）。
  const storeRef = useRef<CalendarStoreContext | null>(null);

  if (!storeRef.current) {
    storeRef.current = createCalendarStore(options ?? {});
    if (events && events.length > 0) {
      storeRef.current.getState().calendar.createEvents(events);
    }
  }

  return (
    <CalendarProvider store={storeRef.current}>
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 3 }}>{children}</div>
    </CalendarProvider>
  );
}
