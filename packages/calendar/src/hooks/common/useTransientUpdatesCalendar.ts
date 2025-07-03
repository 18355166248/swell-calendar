import { useCalendarStoreInternal } from '@/contexts/calendarStore';
import { CalendarState } from '@/types/store.type';
import { useEffect, useRef } from 'react';

export function useTransientUpdatesCalendar<T>(
  selector: (state: CalendarState) => T,
  subscribe: (state: T) => void
) {
  const subscribeRef = useRef(subscribe);
  const selectorRef = useRef(selector);

  useEffect(() => {
    subscribeRef.current = subscribe;
    selectorRef.current = selector;
  }, [subscribe, selector]);

  // 获取 store 实例
  const store = useCalendarStoreInternal();

  useEffect(
    () =>
      store.subscribe((state) => {
        const value = selectorRef.current(state);
        subscribeRef.current(value);
      }),
    [store]
  );
}
