// ===== 事件数据 hook =====（P6）
// 托管异步数据源的加载状态与事件列表，把 loading / ready / error 三态和 CRUD 操作
// 暴露给 App。组件层不再直接碰 localStorage，也不再持有叠加层细节。

import { useCallback, useEffect, useRef, useState } from 'react';

import type { CalEvent } from './data';
import type { CalendarDataSource, EventDraft } from './dataSource';

export type DataStatus = 'loading' | 'ready' | 'error';

export interface UseCalendarData {
  events: CalEvent[];
  status: DataStatus;
  error: string | null;
  reload: () => void;
  createEvent: (draft: EventDraft) => Promise<void>;
  updateEvent: (id: string, patch: EventDraft) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export function useCalendarData(source: CalendarDataSource): UseCalendarData {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [status, setStatus] = useState<DataStatus>('loading');
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
        setError(e instanceof Error ? e.message : '数据加载失败');
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
        setError(e instanceof Error ? e.message : '操作失败');
        setStatus('error');
      }
    },
    [refresh]
  );

  const createEvent = useCallback(
    (draft: EventDraft) => mutate(() => source.create(draft)),
    [mutate, source]
  );
  const updateEvent = useCallback(
    (id: string, patch: EventDraft) => mutate(() => source.update(id, patch)),
    [mutate, source]
  );
  const deleteEvent = useCallback(
    (id: string) => mutate(() => source.remove(id)),
    [mutate, source]
  );

  return { events, status, error, reload, createEvent, updateEvent, deleteEvent };
}
