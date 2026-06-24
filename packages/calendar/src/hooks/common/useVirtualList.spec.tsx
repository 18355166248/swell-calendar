import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useVirtualList, type UseVirtualListResult } from './useVirtualList';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

// 可控的假 rAF：把回调入队，由 flushRaf 手动触发，用于断言「同一帧内多次 onScroll 只调度一次更新」。
let rafCallbacks: { id: number; cb: FrameRequestCallback }[] = [];
let nextRafId = 0;
const cancelSpy = vi.fn();
let realRaf: typeof requestAnimationFrame;
let realCancel: typeof cancelAnimationFrame;

function flushRaf() {
  const pending = rafCallbacks;
  rafCallbacks = [];
  for (const { cb } of pending) {
    cb(0);
  }
}

function Harness({
  onHandle,
}: {
  onHandle: (result: UseVirtualListResult, renderCount: number) => void;
}) {
  const result = useVirtualList({
    count: 100,
    estimateSize: () => 50,
    enabled: true,
    overscan: 2,
  });
  // 每次渲染上报当前 hook 句柄与渲染序号，供测试观察状态更新次数。
  onHandle(result, 0);
  return <div ref={result.scrollRef} />;
}

describe('useVirtualList onScroll rAF 合并', () => {
  let container: HTMLDivElement;
  let root: Root;
  let handle: UseVirtualListResult;
  let renders: number;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    rafCallbacks = [];
    nextRafId = 0;
    cancelSpy.mockClear();
    realRaf = globalThis.requestAnimationFrame;
    realCancel = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      const id = ++nextRafId;
      rafCallbacks.push({ id, cb });
      return id;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      cancelSpy(id);
      rafCallbacks = rafCallbacks.filter((entry) => entry.id !== id);
    }) as typeof cancelAnimationFrame;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    renders = 0;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.requestAnimationFrame = realRaf;
    globalThis.cancelAnimationFrame = realCancel;
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  function mount() {
    act(() => {
      root.render(
        <Harness
          onHandle={(result) => {
            handle = result;
            renders += 1;
          }}
        />
      );
    });
  }

  // jsdom 默认不支持设置 scrollTop，这里用可控变量挂到 scroller 上，模拟真实滚动位置。
  function stubScrollTop(value: { current: number }) {
    Object.defineProperty(handle.scrollRef.current!, 'scrollTop', {
      configurable: true,
      get: () => value.current,
    });
  }

  it('同一帧内多次 onScroll 只调度一次 rAF，且不立即触发状态更新', () => {
    mount();
    const scrollTop = { current: 0 };
    stubScrollTop(scrollTop);

    const rendersBefore = renders;
    act(() => {
      handle.onScroll();
      handle.onScroll();
      handle.onScroll();
    });

    // 三次 onScroll 只入队一个 rAF；rAF 未 flush 前不应有状态更新。
    expect(rafCallbacks).toHaveLength(1);
    expect(renders).toBe(rendersBefore);
    expect(handle.scrollTop).toBe(0);
  });

  it('rAF flush 后读取最新 scrollTop 并只更新一次', () => {
    mount();
    const scrollTop = { current: 0 };
    stubScrollTop(scrollTop);

    act(() => {
      handle.onScroll();
      handle.onScroll();
    });
    const rendersBeforeFlush = renders;

    // 帧内位置继续变化，flush 时应取到终值 640 而非中间值。
    scrollTop.current = 640;
    act(() => {
      flushRaf();
    });

    expect(handle.scrollTop).toBe(640);
    // 合并为一次状态更新（只触发一次重渲染）。
    expect(renders).toBe(rendersBeforeFlush + 1);
  });

  it('flush 后再次 onScroll 会重新调度新的 rAF', () => {
    mount();
    const scrollTop = { current: 0 };
    stubScrollTop(scrollTop);

    act(() => {
      handle.onScroll();
    });
    expect(rafCallbacks).toHaveLength(1);

    scrollTop.current = 120;
    act(() => {
      flushRaf();
    });
    expect(handle.scrollTop).toBe(120);

    // 上一帧的调度已消费，新的滚动应能再次调度。
    scrollTop.current = 300;
    act(() => {
      handle.onScroll();
    });
    expect(rafCallbacks).toHaveLength(1);

    act(() => {
      flushRaf();
    });
    expect(handle.scrollTop).toBe(300);
  });

  it('卸载时取消挂起的 rAF，避免回调在卸载后写状态', () => {
    mount();
    const scrollTop = { current: 0 };
    stubScrollTop(scrollTop);

    act(() => {
      handle.onScroll();
    });
    const pendingId = rafCallbacks[0]?.id;
    expect(pendingId).toBeGreaterThan(0);

    act(() => {
      root.unmount();
    });

    expect(cancelSpy).toHaveBeenCalledWith(pendingId);
  });
});
