import { isNil } from 'lodash-es';
import { useCallback, useEffect, useRef } from 'react';

import { LONG_PRESS_DELAY } from '@/constants/mouse.const';
import { triggerHapticFeedback } from '@/utils/haptics';

/**
 * 移动端编辑按压状态
 */
export interface MobileEditPressState {
  pointerId: number | null;
  startX: number;
  startY: number;
  moved: boolean;
  activated: boolean;
  source: 'pointer' | 'touch';
}

const MOBILE_EDIT_LONG_PRESS_MOVE_TOLERANCE = 18;

/**
 * 移动端「长按进入编辑态」手势 hook。
 * - 短按：触发 onClick
 * - 长按（超过 LONG_PRESS_DELAY 且无移动）：进入编辑态
 * - 移动超过容差：视为滚动，放弃长按
 */
export function useMobileEditPress(args: {
  canEnterMobileEdit: boolean;
  setEditingEventId: (id: string | null) => void;
  eventId: string;
  onClick: () => void;
}) {
  const { canEnterMobileEdit, setEditingEventId, eventId, onClick } = args;

  const editLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEditPressRef = useRef<MobileEditPressState | null>(null);
  const detachEditPressListenersRef = useRef<(() => void) | null>(null);
  // 长按进入编辑态与拖拽必须是两段手势：当前手指未释放前不允许 move/resize。
  const suppressDragUntilReleaseRef = useRef(false);

  const clearPendingMobileEditPress = useCallback(() => {
    if (!isNil(editLongPressTimerRef.current)) {
      clearTimeout(editLongPressTimerRef.current);
      editLongPressTimerRef.current = null;
    }
    pendingEditPressRef.current = null;
    detachEditPressListenersRef.current?.();
    detachEditPressListenersRef.current = null;
  }, []);

  // 组件卸载时清理
  useEffect(
    () => () => {
      clearPendingMobileEditPress();
      suppressDragUntilReleaseRef.current = false;
    },
    [clearPendingMobileEditPress]
  );

  const beginMobileEditPress = useCallback(
    ({
      pointerId,
      startX,
      startY,
      source,
    }: {
      pointerId: number | null;
      startX: number;
      startY: number;
      source: MobileEditPressState['source'];
    }) => {
      clearPendingMobileEditPress();

      pendingEditPressRef.current = {
        pointerId,
        startX,
        startY,
        moved: false,
        activated: false,
        source,
      };

      editLongPressTimerRef.current = setTimeout(() => {
        const pending = pendingEditPressRef.current;
        if (isNil(pending) || pending.moved || !canEnterMobileEdit) return;
        pending.activated = true;
        suppressDragUntilReleaseRef.current = true;
        // 长按成立、进入编辑态时给一次轻触觉反馈（仅支持 Vibration API 的平台生效）
        triggerHapticFeedback();
        setEditingEventId(eventId);
      }, LONG_PRESS_DELAY);

      const cancelPendingAsMove = (clientX: number, clientY: number, eventPointerId?: number) => {
        const pending = pendingEditPressRef.current;
        if (isNil(pending)) return;
        if (
          !isNil(pending.pointerId) &&
          !isNil(eventPointerId) &&
          eventPointerId !== pending.pointerId
        )
          return;

        if (
          Math.abs(clientX - pending.startX) > MOBILE_EDIT_LONG_PRESS_MOVE_TOLERANCE ||
          Math.abs(clientY - pending.startY) > MOBILE_EDIT_LONG_PRESS_MOVE_TOLERANCE
        ) {
          pending.moved = true;
          clearPendingMobileEditPress();
        }
      };

      const finishPendingMobileEditPress = (eventPointerId?: number) => {
        const pending = pendingEditPressRef.current;
        if (isNil(pending)) return;
        if (
          !isNil(pending.pointerId) &&
          !isNil(eventPointerId) &&
          eventPointerId !== pending.pointerId
        )
          return;

        const shouldOpen = !pending.moved && !pending.activated;
        clearPendingMobileEditPress();
        suppressDragUntilReleaseRef.current = false;

        if (shouldOpen) {
          onClick();
        }
      };

      const handleDocumentMove = (event: globalThis.PointerEvent) => {
        cancelPendingAsMove(event.clientX, event.clientY, event.pointerId);
      };

      const handleDocumentUp = (event: globalThis.PointerEvent) => {
        finishPendingMobileEditPress(event.pointerId);
      };

      const handleDocumentTouchMove = (event: globalThis.TouchEvent) => {
        const touch = event.touches[0] ?? event.changedTouches[0];
        if (isNil(touch)) return;
        cancelPendingAsMove(touch.clientX, touch.clientY);
      };

      const handleDocumentTouchEnd = () => {
        finishPendingMobileEditPress();
      };

      const handleDocumentTouchCancel = () => {
        const pending = pendingEditPressRef.current;
        if (!isNil(pending) && !pending.moved) {
          triggerHapticFeedback();
          setEditingEventId(eventId);
        }
        clearPendingMobileEditPress();
        suppressDragUntilReleaseRef.current = false;
      };

      document.addEventListener('pointermove', handleDocumentMove);
      document.addEventListener('pointerup', handleDocumentUp);
      document.addEventListener('touchmove', handleDocumentTouchMove);
      document.addEventListener('touchend', handleDocumentTouchEnd);
      document.addEventListener('touchcancel', handleDocumentTouchCancel);
      detachEditPressListenersRef.current = () => {
        document.removeEventListener('pointermove', handleDocumentMove);
        document.removeEventListener('pointerup', handleDocumentUp);
        document.removeEventListener('touchmove', handleDocumentTouchMove);
        document.removeEventListener('touchend', handleDocumentTouchEnd);
        document.removeEventListener('touchcancel', handleDocumentTouchCancel);
      };
    },
    [canEnterMobileEdit, clearPendingMobileEditPress, onClick, eventId, setEditingEventId]
  );

  return {
    pendingEditPressRef,
    suppressDragUntilReleaseRef,
    beginMobileEditPress,
    clearPendingMobileEditPress,
  };
}
