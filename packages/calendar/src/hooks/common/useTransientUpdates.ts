import { calendarStore } from '@/contexts/calendarStore';
import { GridSelectionData } from '@/types/gridSelection.type';
import { useEffect, useRef } from 'react';

export function useTransientUpdates(subscribe: (state: GridSelectionData) => void) {
  const subscribeRef = useRef(subscribe);

  useEffect(() => {
    return calendarStore.subscribe(
      (state) => state.gridSelection.timeGrid,
      (timeGrid, prevTimeGrid) => {
        if (timeGrid && JSON.stringify(timeGrid) !== JSON.stringify(prevTimeGrid)) {
          subscribeRef.current(timeGrid);
        }
      },
      {
        // equalityFn: (a, b) => {
        //   return JSON.stringify(a) === JSON.stringify(b);
        // },
        fireImmediately: true,
      }
    );
  }, []);
}
