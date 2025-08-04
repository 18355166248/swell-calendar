import { TemplateMonthGrid } from '@/types/template.type';
import { Template } from '../Template';
import { capitalize } from 'lodash-es';
import { CellBarType } from '@/constants/grid.const';
import { TemplateName } from '@/types/template.type';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { useCalendarStore } from '@/contexts/calendarStore';
import dayjs from 'dayjs';

interface CellHeaderProps {
  type: CellBarType;
  date: DayjsTZDate;
}

const CellHeader = ({ type, date }: CellHeaderProps) => {
  const { view } = useCalendarStore();
  const { renderDate } = view;
  const monthGridTemplate = `monthGrid${capitalize(type)}` as TemplateName;

  const ymd = date.format('YYYYMMDD');
  const todayYmd = dayjs().format('YYYYMMDD');

  const templateParams: TemplateMonthGrid = {
    date: date.format('YYYY-MM-DD'),
    day: date.getDate(),
    hiddenEventCount: 0,
    isOtherMonth: date.getMonth() === renderDate.getMonth(),
    isToday: ymd === todayYmd,
    month: date.getMonth(),
    ymd,
  };

  return (
    <div className={cls('day-grid-month-cell-header')}>
      <span className={cls('day-grid-month-cell-header-date')}>
        <Template template={monthGridTemplate} param={templateParams} />
      </span>
    </div>
  );
};

export default CellHeader;
