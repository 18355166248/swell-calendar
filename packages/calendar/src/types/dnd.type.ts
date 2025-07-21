import { EventUIModel } from '@/model/eventUIModel';
import { DraggingTypes } from './drag.type';

/**
 * 拖拽状态枚举
 * 定义了拖拽操作的不同阶段
 */
export enum DraggingState {
  IDLE, // 空闲状态 - 未进行任何拖拽操作
  INIT, // 初始化状态 - 拖拽开始初始化
  DRAGGING, // 拖拽中状态 - 正在执行拖拽操作
  CANCELED, // 已取消状态 - 拖拽操作被取消
}

export type DndState = {
  draggingItemType: DraggingTypes | null; // 当前拖拽的项目类型
  draggingState: DraggingState; // 当前拖拽状态
  initX: number | null; // 拖拽开始时的 X 坐标
  initY: number | null; // 拖拽开始时的 Y 坐标
  x: number | null; // 当前拖拽位置的 X 坐标
  y: number | null; // 当前拖拽位置的 Y 坐标
  draggingEventUIModel: EventUIModel | null; // 正在拖拽的事件 UI 模型

  initDrag: (initState: Pick<DndState, 'draggingItemType' | 'initX' | 'initY'>) => void;
  setDragging: (state: Partial<DndState>) => void;
  cancelDrag: () => void;
  reset: () => void;
  setDraggingEventUIModel: (uiModel: EventUIModel | null) => void;
};

export type DndSlice = {
  dnd: DndState;
};
