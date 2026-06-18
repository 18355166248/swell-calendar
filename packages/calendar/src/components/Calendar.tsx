import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { CalendarApp } from '@/components/CalendarApp';
import { CalendarStoreContext, createCalendarStore } from '@/contexts/calendarStore';
import { createThemeStore, useThemeStore } from '@/contexts/themeStore';
import { CalendarInstance, EventCalendarProps } from '@/types/api.type';
import { CalendarInfo } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

function buildStoreOptions(
  options: Options | undefined,
  calendars: CalendarInfo[] | undefined
): Options {
  return {
    ...options,
    calendars: calendars ?? options?.calendars ?? [],
  };
}

function createCalendarInstance(store: CalendarStoreContext): CalendarInstance {
  return {
    getDate: () => store.getState().view.renderDate,
    setDate: (date) => store.getState().view.setDate(date),
    setView: (view) => store.getState().view.setView(view),
    navigate: (direction) => store.getState().view.navigate(direction),
    goToToday: () => store.getState().view.goToToday(),
    setEvents: (events: EventObject[]) => store.getState().calendar.setEvents(events),
    getEvents: () =>
      store
        .getState()
        .calendar.events.toArray()
        .map((event) => event.toEventObject()),
    externalDrop: (params) => {
      // resolver 由 scheduler 视图在 allowExternalDrop 开启时注册；
      // 未激活 / 未开启时为 null，直接拒绝。
      const resolver = store.getState().externalDrop.resolver;
      if (!resolver) {
        return { result: 'rejected' };
      }

      return resolver(params);
    },
  };
}

export const Calendar = forwardRef<CalendarInstance, EventCalendarProps>(function Calendar(
  { events = [], calendars, options, theme, callbacks, className, style },
  ref
) {
  const storeRef = useRef<CalendarStoreContext | null>(null);

  if (!storeRef.current) {
    storeRef.current = createCalendarStore(buildStoreOptions(options, calendars));
    storeRef.current.getState().calendar.setEvents(events);
  }

  const store = storeRef.current;

  useImperativeHandle(ref, () => createCalendarInstance(store), [store]);

  useEffect(() => {
    store.getState().options.setOptions(buildStoreOptions(options, calendars));
  }, [calendars, options, store]);

  useEffect(() => {
    store.getState().calendar.setEvents(events);
  }, [events, store]);

  useEffect(() => {
    if (options?.defaultView) {
      store.getState().view.setView(options.defaultView);
    }

    if (options?.initialDate) {
      store.getState().view.setDate(options.initialDate);
    }
  }, [options?.defaultView, options?.initialDate, store]);

  useEffect(() => {
    if (!theme) {
      return;
    }

    const nextThemeState = createThemeStore(theme).getState();
    useThemeStore.setState(nextThemeState);
  }, [theme]);

  useEffect(() => {
    if (!callbacks?.onPageChange) {
      return;
    }

    callbacks.onPageChange({
      view: store.getState().view.currentView,
      date: store.getState().view.renderDate,
    });

    return store.subscribe(
      (state) => [state.view.currentView, state.view.renderDate] as const,
      ([view, date]) => {
        callbacks.onPageChange?.({ view, date });
      }
    );
  }, [callbacks, store]);

  const appProps = useMemo(
    () => ({
      store,
      callbacks,
      className,
      style,
    }),
    [callbacks, className, store, style]
  );

  return <CalendarApp {...appProps} />;
});

export default Calendar;
