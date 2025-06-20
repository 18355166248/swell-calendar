import { cls } from '@/helpers/css';
import { CalendarViewType } from '@/types/components/common.type';
import { TemplateMonthDayName, TemplateName, TemplateWeekDayName } from '@/types/template.type';
import { Template } from '../Template';

interface DayNameProps {
  dayName: TemplateWeekDayName | TemplateMonthDayName;
  type: CalendarViewType;
}

function DayName({ dayName, type }: DayNameProps) {
  const { day } = dayName;

  const templateType = `${type}DayName` as TemplateName;

  return (
    <div className={cls('day-name')}>
      <Template template={templateType} param={dayName} />
    </div>
  );
}

export default DayName;
