import { produce } from 'immer';

import { flattenResourceTree } from '@/controller/scheduler-resources';
import { ResourceInfo } from '@/types/options.type';
import { ResourceSlice } from '@/types/resource.type';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createResourceSlice() {
  return (set: SetState): ResourceSlice => ({
    collapsedResourceIds: [],

    toggleCollapse: (resourceId: string) => {
      set(
        produce((state: CalendarStore) => {
          const idx = state.collapsedResourceIds.indexOf(resourceId);
          if (idx >= 0) {
            state.collapsedResourceIds.splice(idx, 1);
          } else {
            state.collapsedResourceIds.push(resourceId);
          }
        })
      );
    },

    setCollapsedIds: (ids: string[]) => {
      set(
        produce((state: CalendarStore) => {
          state.collapsedResourceIds = [...ids];
        })
      );
    },

    initCollapsedFromResources: (resources: ResourceInfo[]) => {
      const flatMap = flattenResourceTree(resources);
      const collapsedIds: string[] = [];

      for (const [, resource] of flatMap) {
        if (resource.collapsed) {
          collapsedIds.push(resource.id);
        }
      }

      set(
        produce((state: CalendarStore) => {
          state.collapsedResourceIds = collapsedIds;
        })
      );
    },
  });
}
