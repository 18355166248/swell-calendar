import {
  Day,
  getDateDifference,
  isWeekend,
  subtractDate,
  toEndOfMonth,
  toStartOfDay,
  toStartOfMonth,
  WEEK_DAYS,
} from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { FormattedTimeString } from '@/types/datetime.type';
import { CommonGridColumn, GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { ClientMousePosition } from '@/types/mouse.type';
import { HourDivision, MonthOptions, WeekOptions } from '@/types/options.type';
import { Panel } from '@/types/panel.type';
import { limit, ratio } from '@/utils/math';
import { findLastIndex, isNil, range } from 'lodash-es';
import { findByDateRange as findByDateRangeForWeek } from '@/controller/week.controller';
import { DayGridEventMatrix, EventModelMap, TimeGridEventMatrix } from '@/types/events.type';
import { EventUIModel } from '@/model/eventUIModel';
import { DEFAULT_VISIBLE_WEEKS } from '@/constants/grid.const';

/**
 * 创建时间网格数据，用于日历组件的时间轴显示
 *
 * 此函数根据给定的日期范围和时间配置，生成完整的网格布局数据：
 * - 列数据：包含每一天的日期、宽度比例和位置信息
 * - 行数据：包含每个时间段的位置、高度和时间范围
 *
 * @param datesOfWeek 一周的日期数组，通常为5天（工作日）或7天（全周）
 * @param options 网格配置选项
 * @param options.hourStart 开始小时 (0-23)，如：9 表示从上午9点开始
 * @param options.hourEnd 结束小时 (0-23)，如：18 表示到晚上6点结束
 * @param options.hourDivision 小时分割数，每小时细分的时间段数：
 *   - 1: 整点显示 (09:00, 10:00, 11:00...)
 *   - 2: 半小时显示 (09:00, 09:30, 10:00...)
 *   - 4: 15分钟显示 (09:00, 09:15, 09:30, 09:45...)
 * @param options.narrowWeekend 是否缩窄周末列宽度，当为true时周末列宽度为工作日的一半
 *
 * @returns TimeGridData 时间网格数据对象
 * @returns columns 列数据数组，每个元素包含：
 *   - date: 日期对象
 *   - width: 列宽度百分比
 *   - left: 列左边距百分比
 * @returns rows 行数据数组，每个元素包含：
 *   - top: 行顶部位置百分比
 *   - height: 行高度百分比
 *   - startTime: 时间段开始时间 (格式: "HH:mm")
 *   - endTime: 时间段结束时间 (格式: "HH:mm")
 *
 * @example
 * // 创建工作日9-18点，半小时分割的网格
 * const gridData = createTimeGridData(workdayDates, {
 *   hourStart: 9,
 *   hourEnd: 18,
 *   hourDivision: 2,
 *   narrowWeekend: false
 * });
 */
export function createTimeGridData(
  datesOfWeek: DayjsTZDate[],
  options: {
    hourStart: number;
    hourEnd: number;
    hourDivision: HourDivision;
    narrowWeekend?: boolean;
  }
): TimeGridData {
  // 获取列数据（包含日期、宽度、位置信息）
  const columns = getColumnsData(datesOfWeek, options.narrowWeekend ?? false);
  const { hourStart, hourEnd, hourDivision } = options;

  const isHalf = hourDivision === 2;
  // 计算总的时间段数（小时数 × 每小时的分割数）
  const steps = (hourEnd - hourStart) * hourDivision;
  // 计算每个时间段的基础高度百分比
  const baseHeight = 100 / steps;

  const timeMap = ['00', '15', '30', '45'];
  const timeMap1 = ['00', '30'];

  const resMap = isHalf ? timeMap1 : timeMap;

  // 生成行数据，每行代表一个时间段
  const rows = range(steps).map((step, index) => {
    const l = step % hourDivision;
    const isLast = l === hourDivision - 1;
    const hour = options.hourStart + Math.floor(step / hourDivision);
    // 格式化开始时间（如：09:00 或 09:30）
    const startTime = `${hour}:${resMap[l]}`.padStart(5, '0') as FormattedTimeString;
    // 格式化结束时间
    const endTime = `${hour + (isLast ? 1 : 0)}:${resMap[l + 1] ?? '00'}`.padStart(
      5,
      '0'
    ) as FormattedTimeString;

    return {
      top: baseHeight * index, // 顶部位置百分比
      height: baseHeight, // 高度百分比
      startTime, // 时间段开始时间
      endTime, // 时间段结束时间
    };
  });

  return {
    columns,
    rows,
  };
}

/**
 * 获取网格列数据
 * @param datesOfWeek 一周的日期数组（5天工作日或7天全周）
 * @param narrowWeekend 是否缩窄周末列宽度
 * @returns 列数据数组，包含每列的日期、宽度和左边距信息
 */
export function getColumnsData(
  datesOfWeek: DayjsTZDate[], // 5 or 7 dates
  narrowWeekend = false
): CommonGridColumn[] {
  const datesCount = datesOfWeek.length;
  // 判断是否应用周末缩窄：日期数大于5且启用了缩窄周末选项
  const shouldApplyNarrowWeekend = datesCount > 5 && narrowWeekend;

  // 计算默认列宽度百分比
  // 如果缩窄周末，则按 (总列数-1) 计算，为周末列预留空间
  const defaultWidthByColumns = shouldApplyNarrowWeekend
    ? 100 / (datesCount - 1)
    : 100 / datesCount;

  return (
    datesOfWeek
      .map((date) => {
        // 计算每列的实际宽度
        // 周末列宽度为默认宽度的一半，工作日为默认宽度
        const width =
          shouldApplyNarrowWeekend && isWeekend(date.getDay())
            ? defaultWidthByColumns / 2
            : defaultWidthByColumns;

        return {
          date,
          width,
        };
      })
      // 使用 reduce 累计计算每列的左边距位置
      .reduce<CommonGridColumn[]>((result, currentDateAndWidth, index) => {
        const prev = result[index - 1];

        result.push({
          ...currentDateAndWidth,
          // 第一列左边距为0，其他列基于前一列的位置和宽度计算
          left: index === 0 ? 0 : prev.left + prev.width,
        });

        return result;
      }, [])
  );
}

/**
 * 容器位置信息接口
 */
interface ContainerPosition {
  left: number; // 容器左边距
  top: number; // 容器上边距
  clientLeft: number; // 客户端左边距
  clientTop: number; // 客户端上边距
}

/**
 * 获取相对于容器的鼠标位置
 * @param clientX 鼠标客户端X坐标
 * @param clientY 鼠标客户端Y坐标
 * @param left 容器左边距
 * @param top 容器上边距
 * @param clientLeft 客户端左边距
 * @param clientTop 客户端上边距
 * @returns 相对位置坐标 [x, y]
 */
function getRelativeMousePosition(
  { clientX, clientY }: ClientMousePosition,
  { left, top, clientLeft, clientTop }: ContainerPosition
) {
  return [clientX - left - clientLeft, clientY - top - clientTop];
}

/**
 * 根据位置计算索引
 * @param arrayLength 数组长度
 * @param maxRange 最大范围
 * @param currentPosition 当前位置
 * @returns 计算得出的索引，限制在有效范围内
 */
function getIndexFromPosition(arrayLength: number, maxRange: number, currentPosition: number) {
  const calculatedIndex = Math.floor(ratio(maxRange, arrayLength, currentPosition));

  return limit(calculatedIndex, [0], [arrayLength - 1]);
}

/**
 * 创建网格位置查找器
 * 用于根据鼠标位置确定在日历网格中的行列索引
 *
 * @param rowsCount 网格行数
 * @param columnsCount 网格列数
 * @param container 容器DOM元素
 * @param narrowWeekend 是否缩窄周末显示
 * @param startDayOfWeek 一周开始的日期（0=周日，1=周一...）
 * @returns GridPositionFinder 网格位置查找函数
 */
export function createGridPositionFinder({
  rowsCount,
  columnsCount,
  container,
  narrowWeekend = false,
  startDayOfWeek = Day.SUN,
}: {
  rowsCount: number;
  columnsCount: number;
  container: HTMLElement | null;
  narrowWeekend?: boolean;
  startDayOfWeek?: number;
}): GridPositionFinder {
  if (isNil(container)) return () => null;

  // 生成从起始日期开始的连续天数范围，并转换为星期几（0-6）
  const dayRange = range(startDayOfWeek, startDayOfWeek + columnsCount).map(
    (day) => day % WEEK_DAYS
  );

  // 如果启用了周末缩窄，计算周末天数
  const narrowColumnCount = narrowWeekend ? dayRange.filter((day) => isWeekend(day)).length : 0;

  /**
   * 网格位置查找函数
   * @param mousePosition 鼠标位置
   * @returns 网格位置信息（行列索引）或null
   */
  return (mousePosition: ClientMousePosition) => {
    // 获取容器的位置和大小信息
    const {
      left: containerLeft,
      top: containerTop,
      width: containerWidth,
      height: containerHeight,
    } = container.getBoundingClientRect();

    // 计算鼠标相对于容器的位置
    const [left, top] = getRelativeMousePosition(mousePosition, {
      left: containerLeft,
      top: containerTop,
      clientLeft: container.clientLeft,
      clientTop: container.clientTop,
    });

    // 检查鼠标是否在容器范围内
    if (left < 0 || top < 0 || left > containerWidth || top > containerHeight) return null;

    // 计算单位宽度
    // 如果启用周末缩窄：总宽度除以(总列数 - 周末列数 + 1)
    // 否则：总宽度除以总列数
    const unitWidth = narrowWeekend
      ? containerWidth / (columnsCount - narrowColumnCount + 1)
      : containerWidth / columnsCount;

    // 计算每列的宽度列表
    // 如果启用周末缩窄且该天是周末，则宽度为单位宽度的一半
    const columnWidthList = dayRange.map((day) =>
      narrowWeekend && isWeekend(day) ? unitWidth / 2 : unitWidth
    );

    // 计算每列的左边距位置列表
    const columnLeftList: number[] = [];
    columnWidthList.forEach((_, index) => {
      if (index === 0) {
        columnLeftList.push(0);
      } else {
        // 后续列的左边距 = 前一列的左边距 + 前一列的宽度
        columnLeftList.push(columnLeftList[index - 1] + columnWidthList[index - 1]);
      }
    });

    // 查找鼠标位置对应的列索引
    // 找到最后一个左边距小于等于鼠标X位置的列
    const columnIndex = findLastIndex(columnLeftList, (columnLeft) => left >= columnLeft);

    return {
      // 列索引
      columnIndex,
      // 行索引
      rowIndex: getIndexFromPosition(rowsCount, containerHeight, top),
    };
  };
}

/**
 * 处理日网格事件模型，为每个事件计算位置和尺寸信息
 * 遍历三维事件矩阵，为每个事件UI模型添加宽度、左边距和顶部位置
 *
 * @param eventModels 日网格事件矩阵 - 三维数组结构，包含所有日期网格事件
 * @param row 日期数组 - 当前显示的日期行，用于计算事件位置
 * @param narrowWeekend 是否缩窄周末显示 - 影响事件宽度计算
 * @returns 处理后的扁平化事件UI模型数组
 */
function getDayGridEventModels(events: DayGridEventMatrix) {
  return [];
}

/**
 * 过滤有效的模型
 * 移除数组中的空值、null 或 undefined 元素
 *
 * @param models 事件UI模型数组
 * @returns 过滤后的有效模型数组
 */
const getModels = (models: EventUIModel[]) => models.filter((model) => !!model);

/**
 * 将三维矩阵扁平化为一维数组
 * 将嵌套的三维事件矩阵结构转换为扁平的一维数组
 * 结构：matrices[matrix][row][models] -> EventUIModel[]
 *
 * @param matrices 三维事件矩阵 - 包含多个二维矩阵，每个矩阵包含多行，每行包含多个事件模型
 * @returns 扁平化后的事件UI模型数组
 */
function flattenMatrix3d(matrices: DayGridEventMatrix): EventUIModel[] {
  // 使用 flatMap 进行两层扁平化：
  // 1. 第一层：将三维矩阵扁平化为二维数组
  // 2. 第二层：将二维数组扁平化为一维数组，同时过滤无效模型
  return matrices.flatMap((matrix) => matrix.flatMap((models) => getModels(models)));
}

/**
 * 获取时间网格事件模型
 * 从时间网格事件矩阵中提取唯一的事件UI模型
 * 由于时间网格中不同行可能包含相同的事件UI模型，需要去重处理
 *
 * @param eventMatrix 时间网格事件矩阵 - 按时间段组织的三维事件矩阵
 * @returns 去重后的唯一事件UI模型数组
 */
function getTimeGridEventModels(eventMatrix: TimeGridEventMatrix) {
  // 注意：不同行中有相同的UI模型，所以需要获取唯一的UI模型

  // 1. 获取事件矩阵的所有值（三维矩阵数组）
  // 2. 使用 reduce 将所有三维矩阵扁平化并合并为一个数组
  // 3. 使用 Set 进行去重（基于对象引用）
  // 4. 转换回数组格式
  return Array.from(
    new Set(
      Object.values(eventMatrix).reduce<EventUIModel[]>(
        (result, matrix3d) => result.concat(...flattenMatrix3d(matrix3d)),
        []
      )
    )
  );
}

/**
 * 获取周视图事件
 * 根据周选项和日期范围获取各种类型的事件，并按照面板类型进行分类处理
 * @param days 日期数组
 * @param calendar 日历数据
 * @param options 周视图选项
 * @returns 事件模型映射
 */
export function getWeekViewEvents(
  days: DayjsTZDate[],
  calendar: CalendarData,
  {
    narrowWeekend,
    hourStart,
    hourEnd,
    weekStartDate,
    weekEndDate,
  }: {
    narrowWeekend: boolean;
    hourStart: number;
    hourEnd: number;
    weekStartDate: DayjsTZDate;
    weekEndDate: DayjsTZDate;
  }
): EventModelMap {
  const panels: Panel[] = [
    {
      name: 'milestone', // 里程碑事件 - 在日期网格中显示
      type: 'daygrid', // 使用日期网格布局
      show: true, // 显示此面板
    },
    {
      name: 'task', // 任务事件 - 在日期网格中显示
      type: 'daygrid', // 使用日期网格布局
      show: true, // 显示此面板
    },
    {
      name: 'allday', // 全天事件 - 在日期网格中显示
      type: 'daygrid', // 使用日期网格布局
      show: true, // 显示此面板
    },
    {
      name: 'time', // 时间事件 - 在时间网格中显示
      type: 'timegrid', // 使用时间网格布局
      show: true, // 显示此面板
    },
  ];

  // 根据日期范围和面板配置查找事件
  const eventModels = findByDateRangeForWeek(calendar, {
    start: weekStartDate, // 周开始日期
    end: weekEndDate, // 周结束日期
    panels, // 面板配置，用于过滤事件类型
    options: {
      hourStart, // 时间网格开始小时
      hourEnd, // 时间网格结束小时
    },
  });

  return Object.keys(eventModels).reduce<EventModelMap>(
    (acc, cur) => {
      // 获取当前面板类型的事件数据
      const events = eventModels[cur as keyof EventModelMap];

      // 根据事件类型进行不同的处理：
      // - 如果是数组（daygrid类型）：使用 getDayGridEventModels 处理日期网格事件
      // - 如果不是数组（timegrid类型）：使用 getTimeGridEventModels 处理时间网格事件

      return {
        ...acc,
        [cur]: Array.isArray(events)
          ? getDayGridEventModels(events) // 处理日期网格事件
          : getTimeGridEventModels(events), // 处理时间网格事件
      };

      return acc;
    },
    {
      milestone: [], // 里程碑事件矩阵
      task: [], // 任务事件矩阵
      allday: [], // 全天事件矩阵
      time: [], // 时间事件矩阵（按日期分组）
    }
  );
}

/**
 * 获取指定日期所在周的日期数组
 *
 * 该函数根据给定的渲染日期和配置选项，计算并返回该周的所有日期。
 * 支持自定义一周的起始日和工作日模式，可以过滤掉周末日期。
 *
 * @param renderDate - 渲染的目标日期，用于确定要获取哪一周的日期
 * @param options - 配置选项
 * @param options.startDayOfWeek - 一周的起始日，默认为周日 (Day.SUN = 0)
 * @param options.workweek - 是否为工作日模式，true时只返回工作日（周一到周五）
 * @returns 返回该周的日期数组，每个元素为 DayjsTZDate 对象
 *
 * @example
 * // 获取以周一为起始日的工作周日期
 * getWeekDates(new DayjsTZDate('2024-01-15'), { startDayOfWeek: Day.MON, workweek: true })
 * // 返回: [周一, 周二, 周三, 周四, 周五] (5个工作日)
 *
 * @example
 * // 获取以周日为起始日的完整周日期
 * getWeekDates(new DayjsTZDate('2024-01-15'), { startDayOfWeek: Day.SUN, workweek: false })
 * // 返回: [周日, 周一, 周二, 周三, 周四, 周五, 周六] (7天)
 */
export function getWeekDates(
  renderDate: DayjsTZDate,
  { startDayOfWeek = Day.SUN, workweek }: WeekOptions
): DayjsTZDate[] {
  // 将渲染日期标准化到当天的开始时间（00:00:00）
  const now = toStartOfDay(renderDate);

  // 获取当前日期是周几（0=周日，1=周一，...，6=周六）
  const nowDay = now.getDay();

  // 计算需要向前偏移的天数，以对齐到指定的起始日
  // 例如：如果当前是周三(3)，起始日是周一(1)，则需要向前偏移2天
  const prevDateCount = nowDay - startDayOfWeek;

  // 生成一周的日期偏移数组
  // 根据偏移天数的正负情况，生成不同的范围：
  // - 如果 prevDateCount >= 0：从 -prevDateCount 到 (7 - prevDateCount)
  // - 如果 prevDateCount < 0：从 -(7 + prevDateCount) 到 -prevDateCount
  const weekDayList =
    prevDateCount >= 0
      ? range(-prevDateCount, WEEK_DAYS - prevDateCount)
      : range(-WEEK_DAYS - prevDateCount, -prevDateCount);

  // 将偏移数组转换为实际的日期数组
  return weekDayList.reduce<DayjsTZDate[]>((acc, day) => {
    // 根据偏移天数计算实际日期
    const date = now.addDate(day);

    // 如果是工作日模式且当前日期是周末，则跳过该日期
    if (workweek && isWeekend(date.getDay())) {
      return acc;
    }

    // 将日期添加到结果数组中
    acc.push(date);

    return acc;
  }, []);
}

/**
 * 创建月视图的日期矩阵
 *
 * 该函数根据给定的目标日期和配置选项，生成一个二维数组表示的月视图日期矩阵。
 * 矩阵的每一行代表一周，每一列代表一周中的某一天。
 * 支持自定义一周的起始日、工作日模式、可见周数等配置。
 *
 * @param renderTargetDate - 渲染的目标日期，用于确定要生成哪个月的日期矩阵
 * @param options - 月视图配置选项
 * @param options.workweek - 是否为工作日模式，true时只返回工作日（周一到周五），默认为false
 * @param options.visibleWeeksCount - 指定要显示的周数，0表示使用默认值，默认为0
 * @param options.startDayOfWeek - 一周的起始日，0表示周日，1表示周一，依此类推，默认为0
 * @param options.isAlways6Weeks - 是否始终显示6周（无论当月实际有多少周），默认为true
 * @returns 返回一个二维数组，每个子数组代表一周的日期，每个元素为TZDate对象
 *
 * @example
 * // 创建2024年1月的标准6周视图（以周日为起始日）
 * createDateMatrixOfMonth(new Date('2024-01-15'), {})
 *
 * @example
 * // 创建2024年1月的工作日视图（只显示周一到周五）
 * createDateMatrixOfMonth(new Date('2024-01-15'), { workweek: true })
 *
 * @example
 * // 创建2024年1月的4周视图（以周一为起始日）
 * createDateMatrixOfMonth(new Date('2024-01-15'), {
 *   visibleWeeksCount: 4,
 *   startDayOfWeek: 1
 * })
 */
export function createDateMatrixOfMonth(
  renderDate: DayjsTZDate,
  { workweek, visibleWeeksCount, startDayOfWeek, isAlways6Weeks }: Required<MonthOptions>
) {
  const targetDate = new DayjsTZDate(renderDate);

  // 如果配置了要显示的周数，则使用配置的周数
  const shouldApplyVisibleWeeksCount = visibleWeeksCount > 0;

  // 确定基准日期：
  // - 如果指定了可见周数，使用目标日期作为基准
  // - 否则使用目标日期所在月的第一天作为基准
  const baseDate = shouldApplyVisibleWeeksCount ? targetDate : toStartOfMonth(targetDate);

  // 计算矩阵中第一个日期（左上角的日期）
  // 这个日期需要确保矩阵的第一行包含指定起始日的完整一周
  const firstDateOfMatrix = subtractDate(
    baseDate,
    baseDate.getDay() - startDayOfWeek + (baseDate.getDay() - startDayOfWeek < 0 ? WEEK_DAYS : 0)
  );

  // 获取矩阵第一个日期是周几（0=周日，1=周一，...，6=周六）
  const dayOfFirstDateOfMatrix = firstDateOfMatrix.getDay();

  // 获取目标月份的总天数
  const totalDatesCountOfMonth = toEndOfMonth(targetDate).getDate();

  // 计算矩阵第一个日期与基准日期之间的天数差
  const initialDifference = getDateDifference(firstDateOfMatrix, baseDate);
  // 计算矩阵中需要包含的总天数
  // 包括目标月份的天数加上矩阵开始日期到月份开始日期的偏移天数
  const totalDatesOfMatrix = Math.abs(initialDifference) + totalDatesCountOfMonth;

  // 确定矩阵的总周数 (行数)
  let totalWeeksOfMatrix = DEFAULT_VISIBLE_WEEKS; // 默认为6周

  if (shouldApplyVisibleWeeksCount) {
    // 如果指定了可见周数，使用指定的周数
    totalWeeksOfMatrix = visibleWeeksCount;
  } else if (isAlways6Weeks === false) {
    // 如果不强制显示6周，则根据实际需要的天数计算周数
    // 向上取整确保有足够的行数容纳所有日期
    totalWeeksOfMatrix = Math.ceil(totalDatesOfMatrix / WEEK_DAYS);
  }

  // 生成日期矩阵
  // 外层map生成每一周，内层reduce生成每一周中的每一天
  return range(0, totalWeeksOfMatrix).map((weekIndex) => {
    return range(0, WEEK_DAYS).reduce((weekRow, dayOfWeek) => {
      // 计算从矩阵第一个日期开始的总步数（天数）
      const steps = weekIndex * WEEK_DAYS + dayOfWeek;
      // 计算当前日期是周几
      // 使用模运算确保结果在0-6范围内
      const currentDay = (steps + dayOfFirstDateOfMatrix) % WEEK_DAYS;

      // 判断是否应该包含当前日期：
      // - 如果不是工作日模式，包含所有日期
      // - 如果是工作日模式，只包含非周末的日期
      if (!workweek || (workweek && !isWeekend(currentDay))) {
        // 根据步数计算实际日期 第一个日期+步数
        weekRow.push(firstDateOfMatrix.addDate(steps));
      }

      return weekRow;
    }, [] as DayjsTZDate[]);
  });
}
