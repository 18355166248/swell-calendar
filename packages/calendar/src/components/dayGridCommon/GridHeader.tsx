import { DEFAULT_DAY_NAME_MARGIN_LEFT } from '@/constants/style.const';
import { CalendarViewType } from '@/types/components/common.type';
import { TemplateMonthDayName, TemplateWeekDayName } from '@/types/template.type';

type TemplateDayNames = (TemplateWeekDayName | TemplateMonthDayName)[];

interface GridHeaderProps {
  dayNames: TemplateDayNames;
  gridHeaderMarginLeft?: string;
  type: CalendarViewType;
}

function GridHeader({
  dayNames,
  gridHeaderMarginLeft = DEFAULT_DAY_NAME_MARGIN_LEFT,
  type = 'month',
}: GridHeaderProps) {
  return <div></div>;
}

export default GridHeader;
