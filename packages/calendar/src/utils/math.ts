/**
 * 限制数值在指定范围内
 * @param value 需要限制的数值
 * @param minArr 最小值数组，取数组中的最大值作为下限
 * @param maxArr 最大值数组，取数组中的最小值作为上限
 * @returns 限制后的数值
 *
 * 示例：
 * limit(5, [1, 2, 3], [7, 8, 9]) // 返回 5 (在3-7范围内)
 * limit(1, [2, 3, 4], [6, 7, 8]) // 返回 4 (被最小值4限制)
 * limit(10, [1, 2, 3], [6, 7, 8]) // 返回 6 (被最大值6限制)
 */
export function limit(value: number, minArr: number[], maxArr: number[]) {
  // 取 value 和 minArr 中所有值的最大值作为下限
  const v = Math.max(value, ...minArr);

  // 取上一步结果和 maxArr 中所有值的最小值作为上限
  return Math.min(v, ...maxArr);
}

/**
 * 比例计算函数
 * 根据比例关系 a : b = y : x 计算 x 的值
 *
 * 数学公式：x = (b * y) / a
 *
 * @param a 比例中的第一个数
 * @param b 比例中的第二个数
 * @param y 已知的第三个值
 * @returns 计算得出的第四个值 x
 *
 * 示例：
 * ratio(2, 4, 6) // 返回 12 (2:4 = 6:12)
 * ratio(10, 5, 20) // 返回 10 (10:5 = 20:10)
 */
export function ratio(a: number, b: number, y: number) {
  return (b * y) / a;
}

/**
 * 判断数值是否在指定范围内（包含边界值）
 * @param value 要检查的数值
 * @param min 范围的最小值
 * @param max 范围的最大值
 * @returns 如果数值在范围内返回 true，否则返回 false
 *
 * 示例：
 * isBetween(5, 1, 10) // 返回 true
 * isBetween(1, 1, 10) // 返回 true (包含边界)
 * isBetween(10, 1, 10) // 返回 true (包含边界)
 * isBetween(0, 1, 10) // 返回 false
 * isBetween(11, 1, 10) // 返回 false
 */
export function isBetween(value: number, min: number, max: number) {
  return min <= value && value <= max;
}
