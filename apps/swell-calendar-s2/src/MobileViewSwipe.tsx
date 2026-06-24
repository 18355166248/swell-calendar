import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

// 横滑切日：与周条切周同一套「跟手 + 吸附」手感，作用在日/多日视图主体上。
const SWIPE_COMMIT_THRESHOLD = 56; // 提交切日的最小水平位移
const SWIPE_DIRECTION_SLOP = 12; // 判定为「横滑」而非纵向滚动的起始阈值
const SWIPE_SNAP_MS = 220; // 吸附 / 滑入动画时长，与 app.css 过渡一致
const SWIPE_JUMP_LOCK_MS = 24; // 换日瞬移（禁过渡）到滑入之间的锁定窗口

/**
 * 命中事件卡 / resize 手柄时不接管手势：交给引擎做 move/resize（M4）。
 * 命中后由引擎 setPointerCapture，本组件直接放行。
 */
function startsOnEngineEvent(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      '[class*="event-time"],[class*="month-event"],[class*="timeline-event"],[class*="resize-handle"]'
    )
  );
}

interface MobileViewSwipeProps {
  /** 右滑（回到前一天 / 前一窗口） */
  onPrev: () => void;
  /** 左滑（进入后一天 / 后一窗口） */
  onNext: () => void;
  children: ReactNode;
}

/**
 * 日 / 多日视图主体横滑切日。
 *
 * 手势仲裁交给浏览器：根 `touch-action: pan-y` 让纵向滑动走原生小时滚动
 * （内部 `.swell-calendar-time` 的 overflow-y），横向滑动则不被浏览器消费、
 * 由本组件接管为切日。命中事件卡 / 长按创建（M4）均不受影响：
 * - 事件卡：`startsOnEngineEvent` 直接放行，引擎做 move/resize。
 * - 长按创建：静止按压不产生横向位移，本组件不介入。
 */
export function MobileViewSwipe({ onPrev, onNext, children }: MobileViewSwipeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    width: number;
    decided: 'h' | 'v' | null;
  } | null>(null);
  // 用嵌套 setTimeout 串起「滑出 → 换日瞬移 → 滑入」三段；不用 rAF（无头/后台标签下不可靠）。
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const resetGesture = () => {
    gestureRef.current = null;
    setIsDragging(false);
    setIsSnapping(false);
    setIsJumping(false);
    setDragOffset(0);
  };

  /**
   * 提交切日：当前页滑出 → 换日（引擎重渲新日，单实例）→ 新页从反方向滑入。
   * dir = 1 左滑进入后一天；dir = -1 右滑回到前一天。用定时器分两段，确定性强。
   */
  const commit = (dir: 1 | -1, width: number) => {
    clearTimers();
    setIsDragging(false);
    setIsSnapping(true);
    setDragOffset(dir === 1 ? -width : width); // 当前页滑出

    timersRef.current.push(
      setTimeout(() => {
        // 换日 + 把新页瞬移到反方向屏外（禁用过渡），稍后再滑入
        setIsSnapping(false);
        setIsJumping(true);
        if (dir === 1) {
          onNext();
        } else {
          onPrev();
        }
        setDragOffset(dir === 1 ? width : -width);

        timersRef.current.push(
          setTimeout(() => {
            setIsJumping(false);
            setIsSnapping(true);
            setDragOffset(0); // 新页滑入居中
            timersRef.current.push(setTimeout(resetGesture, SWIPE_SNAP_MS));
          }, SWIPE_JUMP_LOCK_MS)
        );
      }, SWIPE_SNAP_MS)
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return; // 桌面/鼠标用箭头切，避免与引擎鼠标创建冲突
    if (gestureRef.current || isSnapping || isJumping) return;
    if (startsOnEngineEvent(event.target)) return;

    const width = rootRef.current?.clientWidth ?? 0;
    if (width <= 0) return;

    gestureRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width,
      decided: null,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (gesture.decided === null) {
      // 纵向占优 → 交还原生小时滚动，本次不接管
      if (Math.abs(deltaY) > SWIPE_DIRECTION_SLOP && Math.abs(deltaY) >= Math.abs(deltaX)) {
        gestureRef.current = null;
        return;
      }
      // 横向占优 → 接管为切日，捕获指针，启用跟手
      if (Math.abs(deltaX) > SWIPE_DIRECTION_SLOP) {
        gesture.decided = 'h';
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setIsDragging(true);
      } else {
        return;
      }
    }

    // 轻微阻尼，避免越界拖动过头
    setDragOffset(Math.max(-gesture.width, Math.min(gesture.width, deltaX)));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    gestureRef.current = null;

    if (gesture.decided !== 'h') {
      resetGesture();
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    if (Math.abs(deltaX) >= SWIPE_COMMIT_THRESHOLD) {
      commit(deltaX < 0 ? 1 : -1, gesture.width);
    } else {
      // 未过阈值：弹回原位
      clearTimers();
      setIsDragging(false);
      setIsSnapping(true);
      setDragOffset(0);
      timersRef.current.push(setTimeout(resetGesture, SWIPE_SNAP_MS));
    }
  };

  const handlePointerCancel = () => {
    if (!gestureRef.current) return;
    gestureRef.current = null;
    resetGesture();
  };

  return (
    <div
      ref={rootRef}
      className={
        'm-view-swipe' +
        (isDragging ? ' is-dragging' : '') +
        (isSnapping ? ' is-snapping' : '') +
        (isJumping ? ' is-jumping' : '')
      }
      style={{ '--swipe-x': `${dragOffset}px` } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {children}
    </div>
  );
}
