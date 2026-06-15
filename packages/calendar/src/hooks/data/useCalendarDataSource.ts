// 宿主侧数据装配 hook：托管异步数据源的加载状态与事件列表。
// 把 loading / ready / error 三态和 CRUD 操作暴露给宿主，宿主无需重写
// StrictMode 守卫与 mutation 静默重拉等样板。引擎本体仍只消费 EventObject props，
// 该 hook 不做领域类型 → EventObject 的转换（由宿主负责）。

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CalendarDataSource } from '@/types/dataSource.type';

export type CalendarDataStatus = 'loading' | 'ready' | 'error';

export interface UseCalendarDataSourceResult<TEvent, TDraft> {
  events: TEvent[];
  status: CalendarDataStatus;
  error: string | null;
  reload: () => void;
  createEvent: (draft: TDraft) => Promise<void>;
  updateEvent: (id: string, patch: TDraft) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export function useCalendarDataSource<TEvent, TDraft>(
  source: CalendarDataSource<TEvent, TDraft>
): UseCalendarDataSourceResult<TEvent, TDraft> {
  const [events, setEvents] = useState<TEvent[]>([]);
  const [status, setStatus] = useState<CalendarDataStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  // StrictMode 下 effect 会跑两次；用 ref 防止已卸载实例覆盖状态。
  const aliveRef = useRef(true);

  const refresh = useCallback(
    async (withSpinner: boolean) => {
      if (withSpinner) setStatus('loading');
      try {
        const next = await source.list();
        if (!aliveRef.current) return;
        setEvents(next);
        setStatus('ready');
        setError(null);
      } catch (e) {
        if (!aliveRef.current) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Failed to load calendar data');
      }
    },
    [source]
  );

  useEffect(() => {
    aliveRef.current = true;
    refresh(true);
    return () => {
      aliveRef.current = false;
    };
  }, [refresh]);

  const reload = useCallback(() => {
    refresh(true);
  }, [refresh]);

  // mutation 后静默重拉列表（不闪 loading），失败回报 error 但保留当前事件。
  const mutate = useCallback(
    async (op: () => Promise<unknown>) => {
      try {
        await op();
        await refresh(false);
      } catch (e) {
        if (!aliveRef.current) return;
        setError(e instanceof Error ? e.message : 'Calendar data operation failed');
        setStatus('error');
      }
    },
    [refresh]
  );

  const createEvent = useCallback(
    (draft: TDraft) => mutate(() => source.create(draft)),
    [mutate, source]
  );
  const updateEvent = useCallback(
    (id: string, patch: TDraft) => mutate(() => source.update(id, patch)),
    [mutate, source]
  );
  const deleteEvent = useCallback(
    (id: string) => mutate(() => source.remove(id)),
    [mutate, source]
  );

  return { events, status, error, reload, createEvent, updateEvent, deleteEvent };
}
