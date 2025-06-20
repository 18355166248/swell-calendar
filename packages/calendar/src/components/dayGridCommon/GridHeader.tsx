import { DEFAULT_DAY_NAME_MARGIN_LEFT } from '@/constants/style.const';
import { cls } from '@/helpers/css';
import { CalendarViewType } from '@/types/components/common.type';
import { CellStyle } from '@/types/datetime.type';
import { TemplateMonthDayName, TemplateWeekDayName } from '@/types/template.type';
import DayName from './DayName';

type TemplateDayNames = (TemplateWeekDayName | TemplateMonthDayName)[];

interface GridHeaderProps {
  dayNames: TemplateDayNames;
  marginLeft?: string;
  type: CalendarViewType;
  rowStyleInfo: CellStyle[];
}

function GridHeader({
  dayNames,
  marginLeft = DEFAULT_DAY_NAME_MARGIN_LEFT,
  type = 'month',
  rowStyleInfo,
}: GridHeaderProps) {
  return (
    <div className={cls('day-names')}>
      <div className={cls('day-names-container')} style={{ marginLeft }}>
        {dayNames.map((dayName) => (
          <DayName key={dayName.day} dayName={dayName} type={type} />
        ))}
      </div>
    </div>
  );
}

export default GridHeader;
