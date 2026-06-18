import { produce } from 'immer';

import { ExternalDropSlice } from '@/types/externalDrop.type';
import { CalendarStore } from '@/types/store.type';

export type { ExternalDropSlice };

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createExternalDropSlice() {
  return (set: SetState): ExternalDropSlice => ({
    externalDrop: {
      resolver: null,
      setResolver: (resolver) => {
        set(
          produce((state: CalendarStore) => {
            state.externalDrop.resolver = resolver;
          })
        );
      },
    },
  });
}
