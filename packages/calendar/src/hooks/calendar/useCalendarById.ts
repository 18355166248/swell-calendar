import { useCalendarStore } from '@/contexts/calendarStore';

export function useCalendarById(calendarId: string | null) {
  return useCalendarStore((state) => state.calendar.calendars.find((cal) => cal.id === calendarId));
}
