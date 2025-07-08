import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { compare } from '@/time/datetime';

/**
 * 比较两个布尔值的升序排列
 * @param a 第一个布尔值
 * @param b 第二个布尔值
 * @returns 如果 a < b 返回 -1，如果 a > b 返回 1，如果相等返回 0
 * 注意：true 被视为小于 false，所以 true 会排在 false 前面
 */
function compareBooleansASC(a: boolean, b: boolean) {
  if (a !== b) {
    return a ? -1 : 1; // true 排在 false 前面
  }

  return 0;
}

/**
 * 比较两个数字的升序排列
 * @param a 第一个数字
 * @param b 第二个数字
 * @returns 返回 a - b 的结果，用于升序排序
 */
function compareNumbersASC(a: any, b: any) {
  return Number(a) - Number(b);
}

/**
 * 比较两个字符串的升序排列
 * @param _a 第一个值（会被转换为字符串）
 * @param _b 第二个值（会被转换为字符串）
 * @returns 如果 a > b 返回 1，如果 a < b 返回 -1，如果相等返回 0
 */
function compareStringsASC(_a: any, _b: any) {
  const a = String(_a);
  const b = String(_b);

  if (a === b) {
    return 0;
  }

  return a > b ? 1 : -1;
}

/**
 * 比较两个日历事件的升序排列
 * 排序规则：
 * 1. 全天事件排在非全天事件前面
 * 2. 开始时间早的事件排在前面
 * 3. 持续时间长的事件排在前面
 * 4. 最后按事件ID排序
 *
 * @param a 第一个事件（EventModel 或 EventUIModel）
 * @param b 第二个事件（EventModel 或 EventUIModel）
 * @returns 比较结果，用于排序
 */
function compareEventsASC(a: EventModel | EventUIModel, b: EventModel | EventUIModel) {
  // 获取实际的事件模型
  const modelA = a instanceof EventUIModel ? a.model : a;
  const modelB = b instanceof EventUIModel ? b.model : b;

  // 首先比较是否为全天事件（全天事件优先）
  const alldayCompare = compareBooleansASC(
    modelA.isAllday || modelA.hasMultiDates,
    modelB.isAllday || modelB.hasMultiDates
  );

  if (alldayCompare) {
    return alldayCompare;
  }

  // 然后比较开始时间
  const startsCompare = compare(a.getStarts(), b.getStarts());

  if (startsCompare) {
    return startsCompare;
  }

  // 最后比较持续时间（持续时间长的排在前面）
  const durationA = a.duration();
  const durationB = b.duration();

  if (durationA < durationB) {
    return 1;
  }
  if (durationA > durationB) {
    return -1;
  }

  // 如果所有条件都相同，按事件ID排序
  return modelA.cid() - modelB.cid();
}

/**
 * 二分查找算法
 * 在已排序的数组中查找指定元素
 *
 * @param arr 要搜索的数组
 * @param search 要查找的值
 * @param fn 可选：从数组元素中提取比较值的函数
 * @param compareFn 可选：自定义比较函数，默认使用字符串比较
 * @returns 如果找到元素，返回其索引；如果未找到，返回插入位置的负值（使用 ~ 操作符可得到正确的插入位置）
 */
export function bsearch(
  arr: any[],
  search: any,
  fn?: (item: any) => any,
  compareFn?: (item: any, searchArg: any) => number
) {
  let minIndex = 0;
  let maxIndex = arr.length - 1;
  let currentIndex;
  let value;
  let comp;

  // 如果没有提供比较函数，使用默认的字符串比较
  compareFn = compareFn || compareStringsASC;

  while (minIndex <= maxIndex) {
    // 计算中间索引，使用位运算进行向下取整
    currentIndex = ((minIndex + maxIndex) / 2) | 0; // Math.floor
    // 获取当前元素的值（如果提供了提取函数则使用它）
    value = fn ? fn(arr[currentIndex]) : arr[currentIndex];
    // 比较当前值与搜索值
    comp = compareFn(value, search);

    if (comp < 0) {
      // 当前值小于搜索值，在右半部分继续搜索
      minIndex = currentIndex + 1;
    } else if (comp > 0) {
      // 当前值大于搜索值，在左半部分继续搜索
      maxIndex = currentIndex - 1;
    } else {
      // 找到匹配的元素
      return currentIndex;
    }
  }

  // 未找到元素，返回插入位置的负值
  return ~maxIndex;
}

/**
 * 导出比较函数集合
 */
export default {
  bsearch,
  compare: {
    event: {
      asc: compareEventsASC, // 事件升序比较
    },
    num: {
      asc: compareNumbersASC, // 数字升序比较
    },
  },
};

/**
 * 获取数组的第一个元素
 * @param array 目标数组
 * @returns 数组的第一个元素，如果数组为空则返回 undefined
 */
export function first<T>(array: Array<T>) {
  return array[0];
}

/**
 * 获取数组的最后一个元素
 * @param array 目标数组
 * @returns 数组的最后一个元素，如果数组为空则返回 undefined
 */
export function last<T>(array: Array<T>) {
  return array[array.length - 1];
}

/**
 * 从数组末尾开始查找满足条件的最后一个元素的索引
 * @param array 要搜索的数组
 * @param predicate 判断条件函数
 * @returns 找到的元素索引，如果未找到返回 -1
 */
export function findLastIndex<T>(array: T[], predicate: (value: T) => boolean): number {
  // 从数组末尾开始向前遍历
  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (predicate(array[i])) {
      return i;
    }
  }

  return -1;
}

/**
 * 创建一个填充了指定值的数组
 * @param length 数组长度
 * @param value 要填充的值
 * @returns 填充后的数组
 * 注意：如果 value 是数组，会创建其副本而不是引用
 */
export function fill<T>(length: number, value: T): T[] {
  if (length > 0) {
    return Array.from<T, T>({ length }, () => {
      if (Array.isArray(value)) {
        // 如果值是数组，返回其副本以避免引用问题
        return value.slice() as unknown as T;
      }

      return value;
    });
  }

  return [];
}
