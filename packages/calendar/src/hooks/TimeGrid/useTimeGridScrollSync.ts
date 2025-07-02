import { DndState, DraggingState } from '@/types/dnd.type';
import { useTransientUpdatesCalendar } from '../common/useTransientUpdatesCalendar';
import { isNil } from 'lodash-es';
import { DraggingTypes } from '@/types/drag.type';

function isTimeGridDraggingType(type: DraggingTypes | null) {
  return /^gridSelection\/timeGrid/.test(type ?? '');
}

/**
 * 滚动同步
 * @param scrollArea 滚动区域
 * @param rowCount 行数
 */
function useTimeGridScrollSync(scrollArea: HTMLDivElement | null, rowCount: number) {
  useTransientUpdatesCalendar<DndState>(
    (state) => state.dnd,
    ({ y, draggingState, draggingItemType }) => {
      if (
        isNil(scrollArea) ||
        isNil(rowCount) ||
        !isTimeGridDraggingType(draggingItemType) ||
        draggingState !== DraggingState.DRAGGING ||
        isNil(y)
      )
        return;

      // offsetTop 当前元素相对于其 offsetParent 元素的顶部内边距的距离
      // offsetHeight 滚动区域可见高度
      // scrollTop 滚动区域滚动位置
      // scrollHeight 滚动区域总高度
      const { offsetTop, offsetHeight, scrollHeight } = scrollArea;
      // 设置最小滚动边界为一行的高度, 确保滚动足够敏感
      const scrollBoundary = Math.floor(scrollHeight / rowCount);

      // 计算布局的总高度（滚动区域顶部位置 + 可见高度）
      const layoutHeight = offsetHeight + offsetTop;

      // 向上滚动
      if (y < offsetTop + scrollBoundary) {
        // 鼠标Y坐标 < 滚动区域顶部 + 一行高度
        // console.log('向上滚动');
        // 计算需要滚动的距离 (计算鼠标超出边界的距离)
        const scrollDistance = y - (offsetTop + scrollBoundary);
        scrollArea.scrollTop = Math.max(0, scrollArea.scrollTop + scrollDistance);
      } else if (y > layoutHeight - scrollBoundary) {
        // 鼠标Y坐标 > 滚动区域底部 - 一行高度
        // console.log('向下滚动');
        // 计算需要滚动的距离 (计算鼠标超出边界的距离)
        const scrollDistance = y - (layoutHeight - scrollBoundary);
        // 更新滚动位置，确保不会超出最大滚动范围
        scrollArea.scrollTop = Math.min(scrollHeight, scrollArea.scrollTop + scrollDistance);
      }
    }
  );
}

export default useTimeGridScrollSync;
