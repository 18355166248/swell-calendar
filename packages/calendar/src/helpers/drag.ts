import { GridSelectionType } from '@/types/gridSelection.type';

export const DRAGGING_TYPE_CREATE = {
  gridSelection: (type: GridSelectionType) => `gridSelection/${type}` as const,
};
