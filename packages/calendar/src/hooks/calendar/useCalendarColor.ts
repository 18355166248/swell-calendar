import { useCalendarById } from '@/hooks/calendar/useCalendarById';
import { EventModel } from '@/model/eventModel';
import { CalendarColor } from '@/types/calendar.type';
import { useMemo } from 'react';

export function useCalendarColor(model?: EventModel): CalendarColor {
  const calendar = useCalendarById(model?.calendarId ?? null);

  return useMemo(
    () => ({
      color: calendar?.color,
      borderColor: calendar?.borderColor,
      backgroundColor: calendar?.backgroundColor,
      dragBackgroundColor: calendar?.dragBackgroundColor,
    }),
    [calendar]
  );
}
