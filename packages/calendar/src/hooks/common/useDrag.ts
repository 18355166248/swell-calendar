import { isNil } from 'lodash-es';
import { MouseEvent, useCallback, useEffect, useRef } from 'react';

import { LONG_PRESS_MOVE_TOLERANCE, MINIMUM_DRAG_MOUSE_DISTANCE } from '@/constants/mouse.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { DndState, DraggingState } from '@/types/dnd.type';
import { DraggingTypes } from '@/types/drag.type';
import { MouseEventListener } from '@/types/events.type';
import { isPressablePointer } from '@/utils/mouse';

import useLatest from './useLatest';

type MouseListener = (e: MouseEvent, dnd: DndState) => void;

/**
 * 判断指针是否移动了足够距离
 * 用于区分点击和拖拽操作
 * @param initX - 初始 X 坐标
 * @param initY - 初始 Y 坐标
 * @param x - 当前 X 坐标
 * @param y - 当前 Y 坐标
 * @returns 如果移动距离超过阈值返回 true，否则返回 false
 */
function isMouseMoved(initX: number, initY: number, x: number, y: number) {
  return (
    Math.abs(initX - x) >= MINIMUM_DRAG_MOUSE_DISTANCE ||
    Math.abs(initY - y) >= MINIMUM_DRAG_MOUSE_DISTANCE
  );
}

/**
 * 拖拽事件监听器接口
 * 定义了拖拽过程中各个阶段可以触发的回调函数
 */
export interface DragListeners {
  /** 指针按下（鼠标）/ 长按激活（触控）时触发，用于初始化拖拽状态 */
  onInit?: MouseListener;
  /** 拖拽开始时触发，当指针移动距离超过阈值时调用 */
  onDragStart?: MouseListener;
  /** 拖拽过程中触发，指针移动时持续调用 */
  onDrag?: MouseListener;
  /** 指针释放时触发，结束拖拽操作（名称保留 onMouseUp 以兼容历史调用方） */
  onMouseUp?: MouseListener;
}

export interface DragOptions {
  /**
   * 触控 / 手写笔「长按进入拖拽」的判定时长（毫秒）。
   *
   * 仅对触控/笔生效，用于解决「触控拖拽创建」与「网格滚动」的手势冲突：
   * - 未配置：触控按下即进入拖拽（适用于事件卡片 move/resize，配合 `touch-action:none`）。
   * - 配置后：触控需长按到达该时长且指针仍按住才进入拖拽（适用于空白网格创建），
   *   长按前的滑动保持为原生滚动。
   *
   * 鼠标 / 手写笔不受影响——鼠标始终即时进入拖拽，零回归。
   */
  delayTouchStart?: number;
}

/** 长按等待期内记录的待激活信息 */
interface PendingDrag {
  pointerId: number | null;
  target: HTMLElement | null;
  startX: number;
  startY: number;
}

/** 拖拽期内为锁定滚动而临时改写的 touch-action，结束后还原 */
interface TouchActionLock {
  target: HTMLElement;
  prev: string;
}

export function useDrag(
  draggingType: DraggingTypes,
  { onInit, onDragStart, onDrag, onMouseUp }: DragListeners,
  { delayTouchStart }: DragOptions = {}
) {
  const { dnd } = useCalendarStore();
  const { initDrag, setDragging, reset } = dnd;

  const dndSliceRef = useLatest(dnd);

  // 「拖拽进行中」用 ref 而非 state 跟踪：handlePointerUp 的守卫需要同步读到最新值，
  // 用 state 会读到旧闭包值，导致快速点击时 pointerup 被守卫挡掉。
  const isStartedRef = useRef(false);

  // 只跟踪首个落下的主指针，忽略多指并发
  const activePointerIdRef = useRef<number | null>(null);
  // 拖拽期被 setPointerCapture 的目标，结束时释放
  const captureTargetRef = useRef<HTMLElement | null>(null);
  // 拖拽期临时锁定滚动改写的 touch-action，结束时还原
  const touchActionLockRef = useRef<TouchActionLock | null>(null);

  // 触控长按等待态
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<PendingDrag | null>(null);
  // 长按期间持续更新的最近指针坐标（激活时用其作为初始落点）
  const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerMoveRef = useRef<MouseEventListener | null>(null);
  const handlePointerUpRef = useRef<MouseEventListener | null>(null);
  const handlePointerCancelRef = useRef<MouseEventListener | null>(null);

  // 全局监听器用稳定的包装函数注册，包装函数转发到最新的 ref 处理器，
  // 这样 add/removeEventListener 引用一致，且始终调用到最新逻辑。
  const wrappedMoveRef = useRef((e: globalThis.PointerEvent) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handlePointerMoveRef.current?.(e as any)
  );
  const wrappedUpRef = useRef((e: globalThis.PointerEvent) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handlePointerUpRef.current?.(e as any)
  );
  const wrappedCancelRef = useRef((e: globalThis.PointerEvent) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handlePointerCancelRef.current?.(e as any)
  );

  const attachListeners = useCallback(() => {
    document.addEventListener('pointermove', wrappedMoveRef.current);
    document.addEventListener('pointerup', wrappedUpRef.current);
    document.addEventListener('pointercancel', wrappedCancelRef.current);
  }, []);

  const detachListeners = useCallback(() => {
    document.removeEventListener('pointermove', wrappedMoveRef.current);
    document.removeEventListener('pointerup', wrappedUpRef.current);
    document.removeEventListener('pointercancel', wrappedCancelRef.current);
  }, []);

  // 锁定 / 解锁滚动 + 指针捕获，集中管理便于结束时彻底还原
  const lockGesture = useCallback((target: HTMLElement | null, pointerId: number | null) => {
    if (isNil(target)) return;

    if (!isNil(pointerId) && typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(pointerId);
        captureTargetRef.current = target;
      } catch {
        // 某些环境（jsdom / 指针已失效）不支持，静默降级——document 监听仍可兜底
      }
    }

    // 动态把目标 touch-action 锁为 none，拖拽期不被浏览器接管为滚动；结束后还原
    touchActionLockRef.current = { target, prev: target.style.touchAction };
    target.style.touchAction = 'none';
  }, []);

  const releaseGesture = useCallback(() => {
    const captureTarget = captureTargetRef.current;
    const pointerId = activePointerIdRef.current;
    if (
      !isNil(captureTarget) &&
      !isNil(pointerId) &&
      typeof captureTarget.releasePointerCapture === 'function'
    ) {
      try {
        captureTarget.releasePointerCapture(pointerId);
      } catch {
        // 捕获可能已随元素卸载失效，忽略
      }
    }
    captureTargetRef.current = null;

    const lock = touchActionLockRef.current;
    if (!isNil(lock)) {
      lock.target.style.touchAction = lock.prev;
      touchActionLockRef.current = null;
    }
  }, []);

  // 清理触控长按等待态（未激活时调用：判定为滚动 / 提前抬起 / 取消）
  const cancelLongPress = useCallback(() => {
    if (!isNil(longPressTimerRef.current)) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pendingRef.current = null;
    activePointerIdRef.current = null;
    detachListeners();
  }, [detachListeners]);

  // 进入拖拽（鼠标即时 / 触控长按激活共用）
  const beginDrag = useCallback(
    (e: MouseEvent, target: HTMLElement | null, pointerId: number | null) => {
      isStartedRef.current = true;
      activePointerIdRef.current = pointerId;
      lockGesture(target, pointerId);

      initDrag({
        draggingItemType: draggingType,
        initX: e.clientX,
        initY: e.clientY,
      });
      onInit?.(e, dndSliceRef.current);
    },
    [draggingType, initDrag, lockGesture, onInit, dndSliceRef]
  );

  // 指针按下
  const handlePointerDown = useCallback<MouseEventListener>(
    (e) => {
      // 只处理可发起拖拽的主指针（鼠标左键 / 触控 / 笔）
      if (!isPressablePointer(e)) return;

      // 已在拖拽或长按等待中，忽略后续指针（多指并发兜底）
      if (isStartedRef.current || !isNil(pendingRef.current)) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pe = e as any as { pointerId?: number; pointerType?: string };
      const pointerId = isNil(pe.pointerId) ? null : pe.pointerId;
      const isTouchLike = !isNil(pe.pointerType) && pe.pointerType !== 'mouse';
      const target = e.currentTarget as HTMLElement;

      // 同步挂载全局监听器，而不是等 useEffect（passive，paint 后才执行）。
      // 否则极快的点击/拖拽其 pointerup 会先于监听器注册而丢失，表现为「完全没反应」。
      attachListeners();

      lastPointRef.current = { x: e.clientX, y: e.clientY };

      // 触控 + 配置了长按：进入等待态，不立即捕获/不阻止滚动，长按到达才激活
      if (isTouchLike && !isNil(delayTouchStart)) {
        activePointerIdRef.current = pointerId;
        pendingRef.current = { pointerId, target, startX: e.clientX, startY: e.clientY };

        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          const pending = pendingRef.current;
          if (isNil(pending)) return;
          pendingRef.current = null;

          // 以最近坐标作为初始落点（长按期间手指可能有容差内微动）
          const { x, y } = lastPointRef.current;
          const synthetic = {
            clientX: x,
            clientY: y,
            pointerId: pending.pointerId,
            pointerType: 'touch',
            button: 0,
            buttons: 1,
            currentTarget: pending.target,
            target: pending.target,
            preventDefault() {},
            stopPropagation() {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any as MouseEvent;

          beginDrag(synthetic, pending.target, pending.pointerId);
        }, delayTouchStart);

        return;
      }

      // 鼠标 / 笔 / 无长按配置的触控：即时进入拖拽
      e.preventDefault();
      beginDrag(e, target, pointerId);
    },
    [attachListeners, beginDrag, delayTouchStart]
  );

  /**
   * 指针移动事件处理函数
   */
  const handlePointerMove = useCallback<MouseEventListener>(
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pointerId = (e as any).pointerId as number | undefined;
      // 只响应被跟踪的指针
      if (
        !isNil(activePointerIdRef.current) &&
        !isNil(pointerId) &&
        pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      // 触控长按等待态：判断是「滚动」还是「继续等待长按」
      const pending = pendingRef.current;
      if (!isNil(pending)) {
        lastPointRef.current = { x: e.clientX, y: e.clientY };
        // 长按到达前若指针移动超过容差，判定为滚动手势，放弃本次长按创建
        // （不锁定滚动，让浏览器继续接管原生滚动）
        if (
          Math.abs(e.clientX - pending.startX) > LONG_PRESS_MOVE_TOLERANCE ||
          Math.abs(e.clientY - pending.startY) > LONG_PRESS_MOVE_TOLERANCE
        ) {
          cancelLongPress();
        }
        return;
      }

      if (!isStartedRef.current) return;

      // 兜底自恢复：拖拽进行中若主键（左键 / 触控按压）已不再按下，说明 pointerup 丢失
      // （窗口外释放 / 失焦 / 被导航打断等）。此时立即按"结束拖拽"清理，
      // 否则 dnd 会卡在 DRAGGING：卡片半透明、且后续无法再拖拽/resize，只能刷新。
      if ((e.buttons & 1) === 0) {
        handlePointerUpRef.current?.(e);
        return;
      }

      const { initX, initY, draggingState } = dndSliceRef.current;

      // 检查指针是否移动了足够距离
      if (!isNil(initX) && !isNil(initY) && !isMouseMoved(initX, initY, e.clientX, e.clientY)) {
        return;
      }

      if (draggingState <= DraggingState.INIT) {
        setDragging({
          x: e.clientX,
          y: e.clientY,
        });
        onDragStart?.(e, dndSliceRef.current);
        return;
      }

      setDragging({
        x: e.clientX,
        y: e.clientY,
      });
      onDrag?.(e, dndSliceRef.current);
    },
    [onDragStart, onDrag, setDragging, cancelLongPress, dndSliceRef]
  );

  /**
   * 指针释放事件处理函数
   */
  const handlePointerUp = useCallback<MouseEventListener>(
    (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pointerId = (e as any).pointerId as number | undefined;
      if (
        !isNil(activePointerIdRef.current) &&
        !isNil(pointerId) &&
        pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      // 长按未激活就抬起：判定为轻点（tap），不创建，清理等待态
      if (!isNil(pendingRef.current)) {
        cancelLongPress();
        return;
      }

      e.stopPropagation();

      if (isStartedRef.current) {
        isStartedRef.current = false;
        releaseGesture();
        activePointerIdRef.current = null;
        detachListeners();
        onMouseUp?.(e, dndSliceRef.current);
        reset();
      }
    },
    [cancelLongPress, releaseGesture, detachListeners, onMouseUp, reset, dndSliceRef]
  );

  /**
   * 指针取消事件处理函数（系统中断 / 手势被接管）
   * 已激活的拖拽按「结束」兜底处理；长按等待态直接放弃。
   */
  const handlePointerCancel = useCallback<MouseEventListener>(
    (e) => {
      if (!isNil(pendingRef.current)) {
        cancelLongPress();
        return;
      }
      handlePointerUpRef.current?.(e);
    },
    [cancelLongPress]
  );

  useEffect(() => {
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerUpRef.current = handlePointerUp;
    handlePointerCancelRef.current = handlePointerCancel;
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  // 卸载时兜底清理：避免拖拽 / 长按进行中组件被卸载导致监听器或计时器泄漏
  useEffect(
    () => () => {
      if (!isNil(longPressTimerRef.current)) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      releaseGesture();
      detachListeners();
    },
    [detachListeners, releaseGesture]
  );

  return handlePointerDown;
}
