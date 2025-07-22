import { GridPosition, GridPositionFinder } from '@/types/grid.type';
import { useTransientUpdatesCalendar } from '../common/useTransientUpdatesCalendar';
import { isNil } from 'lodash-es';
import { useCallback, useState } from 'react';

/**
 * 自定义Hook：获取当前指针在网格中的位置
 *
 * 这个Hook用于跟踪鼠标指针在日历网格中的当前位置，主要用于拖拽事件时
 * 实时更新事件在网格中的位置信息
 *
 * @param gridPositionFinder - 网格位置查找器函数，用于将鼠标坐标转换为网格位置
 * @returns [当前网格位置, 清除网格位置的函数]
 */
export function useCurrentPointerPositionInGrid(
  gridPositionFinder: GridPositionFinder
): [GridPosition | null, () => void] {
  // 存储当前指针在网格中的位置状态
  const [currentGridPos, setCurrentGridPos] = useState<GridPosition | null>(null);

  // 使用瞬态更新Hook监听拖拽状态变化
  // 当拖拽状态中的x、y坐标发生变化时，更新网格位置
  useTransientUpdatesCalendar(
    (state) => state.dnd, // 订阅拖拽状态
    ({ x, y }) => {
      // 确保x和y坐标都不为空
      if (!isNil(x) && !isNil(y)) {
        // 使用网格位置查找器将鼠标坐标转换为网格位置
        const gridPos = gridPositionFinder({
          clientX: x,
          clientY: y,
        });
        // 如果成功获取到网格位置，则更新状态
        if (!isNil(gridPos)) {
          setCurrentGridPos(gridPos);
        }
      }
    }
  );

  // 清除当前网格位置的函数
  // 使用useCallback优化性能，避免不必要的重新渲染
  const clearCurrentGridPos = useCallback(() => {
    setCurrentGridPos(null);
  }, []);

  // 返回当前网格位置和清除函数
  return [currentGridPos, clearCurrentGridPos];
}
