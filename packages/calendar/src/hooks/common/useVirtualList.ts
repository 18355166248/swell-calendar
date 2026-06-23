import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

export interface UseVirtualListOptions {
  count: number;
  estimateSize: (index: number) => number;
  enabled?: boolean;
  overscan?: number;
  resetKey?: unknown;
}

export interface UseVirtualListResult {
  scrollRef: RefObject<HTMLDivElement>;
  scrollTop: number;
  viewportHeight: number;
  totalSize: number;
  range: { start: number; end: number };
  virtualItems: VirtualItem[];
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  onScroll: () => void;
  getIndexAtOffset: (offset: number) => number;
  measureElement: (index: number, element: HTMLElement | null) => void;
  scrollToIndex: (index: number) => void;
  resetMeasurements: () => void;
}

function findVirtualIndex(offsets: number[], scrollTop: number): number {
  let low = 0;
  let high = Math.max(0, offsets.length - 2);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (offsets[mid + 1] <= scrollTop) {
      low = mid + 1;
    } else if (offsets[mid] > scrollTop) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  return Math.max(0, Math.min(offsets.length - 2, low));
}

export function useVirtualList({
  count,
  estimateSize,
  enabled = true,
  overscan = 6,
  resetKey,
}: UseVirtualListOptions): UseVirtualListResult {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const measuredSizesRef = useRef<Record<number, number>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [measureVersion, setMeasureVersion] = useState(0);

  const resetMeasurements = useCallback(() => {
    measuredSizesRef.current = {};
    setMeasureVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    resetMeasurements();
  }, [count, resetKey, resetMeasurements]);

  useEffect(() => {
    if (!enabled) return;
    const scroller = scrollRef.current;
    if (!scroller) return;

    const updateViewportHeight = () => setViewportHeight(scroller.clientHeight);
    updateViewportHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [enabled]);

  const itemSizes = useMemo(
    () =>
      Array.from({ length: count }, (_, index) =>
        enabled ? measuredSizesRef.current[index] ?? estimateSize(index) : estimateSize(index)
      ),
    // measureVersion 作为 ref 更新的信号触发 useMemo 重算
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, enabled, estimateSize, measureVersion]
  );

  const itemOffsets = useMemo(() => {
    const offsets = [0];
    for (const size of itemSizes) {
      offsets.push(offsets[offsets.length - 1] + size);
    }
    return offsets;
  }, [itemSizes]);

  const totalSize = itemOffsets[count] ?? 0;
  const getIndexAtOffset = useCallback(
    (offset: number) => findVirtualIndex(itemOffsets, offset),
    [itemOffsets]
  );

  const range = useMemo(() => {
    if (!enabled) {
      return { start: 0, end: count };
    }

    const first = findVirtualIndex(itemOffsets, scrollTop);
    const last = findVirtualIndex(itemOffsets, scrollTop + viewportHeight);
    return {
      start: Math.max(0, first - overscan),
      end: Math.min(count, last + overscan + 1),
    };
  }, [count, enabled, itemOffsets, overscan, scrollTop, viewportHeight]);

  const virtualItems = useMemo(
    () =>
      Array.from({ length: range.end - range.start }, (_, offset) => {
        const index = range.start + offset;
        return {
          index,
          start: itemOffsets[index] ?? 0,
          size: itemSizes[index] ?? 0,
        };
      }),
    [itemOffsets, itemSizes, range]
  );

  const onScroll = useCallback(() => {
    if (!enabled) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    setScrollTop(scroller.scrollTop);
  }, [enabled]);

  const measureElement = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (!enabled || !element) return;

      const size = element.offsetHeight;
      if (size <= 0) return;

      if (Math.abs((measuredSizesRef.current[index] ?? 0) - size) > 1) {
        measuredSizesRef.current[index] = size;
        setMeasureVersion((prev) => prev + 1);
      }
    },
    [enabled]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const scroller = scrollRef.current;
      if (!scroller) return;

      const nextScrollTop = itemOffsets[Math.max(0, Math.min(count - 1, index))] ?? 0;
      scroller.scrollTop = nextScrollTop;
      setScrollTop(nextScrollTop);
    },
    [count, itemOffsets]
  );

  return {
    scrollRef,
    scrollTop,
    viewportHeight,
    totalSize,
    range,
    virtualItems,
    topSpacerHeight: itemOffsets[range.start] ?? 0,
    bottomSpacerHeight: totalSize - (itemOffsets[range.end] ?? totalSize),
    onScroll,
    getIndexAtOffset,
    measureElement,
    scrollToIndex,
    resetMeasurements,
  };
}
