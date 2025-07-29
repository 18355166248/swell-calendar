import { cls } from '@/helpers/css';
import { CalendarViewType } from '@/types/components/common.type';
import { TemplateMonthDayName, TemplateName, TemplateWeekDayName } from '@/types/template.type';
import { Template } from '../Template';

interface DayNameProps {
  dayName: TemplateWeekDayName | TemplateMonthDayName;
  type: CalendarViewType;
  style?: React.CSSProperties;
}

function DayName({ dayName, type, style }: DayNameProps) {
  const templateType = `${type}DayName` as TemplateName;

  return (
    <div className={cls('day-name')} style={style}>
      <Template template={templateType} param={dayName} />
    </div>
  );
}

export default DayName;
