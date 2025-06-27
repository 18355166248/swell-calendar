import { DndState, DndSlice, DraggingState } from '@/types/dnd.type';
import { CalendarStore } from '@/types/store.type';
import { produce } from 'immer';

function initializeDndOptions(): Omit<
  DndState,
  'initDrag' | 'setDragging' | 'cancelDrag' | 'reset'
> {
  const dnd: Omit<DndState, 'initDrag' | 'setDragging' | 'cancelDrag' | 'reset'> = {
    draggingItemType: null,
    draggingState: DraggingState.IDLE,
    initX: null,
    initY: null,
    x: null,
    y: null,
  };

  return dnd;
}

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createDndSlice() {
  return (set: SetState): DndSlice => ({
    dnd: {
      ...initializeDndOptions(),
      /**
       * 初始化拖拽操作
       * 设置初始坐标和拖拽类型，并将状态设置为 INIT
       */
      initDrag: (initState) => {
        console.log('🚀 ~ return ~ initState:', initState);
        set(
          produce((state: CalendarStore) => {
            state.dnd.draggingState = DraggingState.INIT;
          })
        );
      },

      /**
       * 设置拖拽状态
       * 更新拖拽相关数据并将状态设置为 DRAGGING
       */
      setDragging: (newState) => {
        set(
          produce((state: CalendarStore) => {
            state.dnd = {
              ...state.dnd,
              ...newState,
              draggingState: DraggingState.DRAGGING,
            };
          })
        );
      },

      /**
       * 取消拖拽操作
       * 将状态设置为 CANCELED
       */
      cancelDrag: () => {
        set(
          produce((state: CalendarStore) => {
            state.dnd.draggingState = DraggingState.CANCELED;
          })
        );
      },

      /**
       * 结束拖拽操作
       * 将状态设置为 IDLE
       */
      reset: () => {
        set(
          produce((state: CalendarStore) => {
            state.dnd = {
              ...state.dnd,
              ...initializeDndOptions(),
            };
          })
        );
      },
    },
  });
}
