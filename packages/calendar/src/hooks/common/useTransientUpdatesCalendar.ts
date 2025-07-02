import { useCalendarStore } from '@/contexts/calendarStore';
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

  useEffect(
    () =>
      useCalendarStore.subscribe(
        selectorRef.current,
        (value, prevValue) => {
          if (value && JSON.stringify(value) !== JSON.stringify(prevValue)) {
            subscribeRef.current(value);
          }
        },
        {
          // equalityFn: (a, b) => {
          //   return JSON.stringify(a) === JSON.stringify(b);
          // },
          fireImmediately: true,
        }
      ),
    []
  );
}
