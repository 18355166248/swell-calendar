import { Day, isWeekend, WEEK_DAYS } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { FormattedTimeString } from '@/types/datetime.type';
import { CommonGridColumn, GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { ClientMousePosition } from '@/types/mouse.type';
import { HourDivision } from '@/types/options.type';
import { limit, ratio } from '@/utils/math';
import { findLastIndex, isNil, range } from 'lodash-es';

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
  console.log('🚀 ~ getIndexFromPosition ~ arrayLength:', arrayLength);
  console.log('🚀 ~ getIndexFromPosition ~ maxRange:', maxRange);
  console.log('🚀 ~ getIndexFromPosition ~ currentPosition:', currentPosition);
  console.log(ratio(maxRange, arrayLength, currentPosition));

  const calculatedIndex = Math.floor(ratio(maxRange, arrayLength, currentPosition));
  console.log('🚀 ~ getIndexFromPosition ~ calculatedIndex:', calculatedIndex);

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
