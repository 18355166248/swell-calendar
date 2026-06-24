import { MouseEvent, PointerEvent } from 'react';

/**
 * 是否为可发起拖拽的「主指针」。
 *
 * - 鼠标：仅左键（`button === 0`），与桌面行为一致。
 * - 触控 / 手写笔：放宽为任意主指针（`pointerType !== 'mouse'`），
 *   因为触控的 `button` 语义与鼠标不同（按下时为 0），不能用左键判定。
 *
 * 兼容传入原生 / React 的 MouseEvent：无 `pointerType` 字段时按鼠标处理，
 * 保证迁移期与历史鼠标路径完全等价。
 */
export function isPressablePointer(e: MouseEvent | PointerEvent): boolean {
  const pointerType = (e as PointerEvent).pointerType;
  if (pointerType && pointerType !== 'mouse') {
    return true;
  }

  return e.button === 0;
}
