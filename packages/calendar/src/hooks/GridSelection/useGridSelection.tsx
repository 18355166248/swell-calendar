import { GridPositionFinder } from '@/types/grid.type';
import { useDrag } from '../common/useDrag';

export function useGridSelection({
  gridPositionFinder,
}: {
  gridPositionFinder: GridPositionFinder;
}) {
  const onMouseDown = useDrag({
    onInit: (e) => {
      // 获取并记录初始网格位置
      const gridPosition = gridPositionFinder(e);
      console.log('🚀 ~ gridPosition:', gridPosition);
    },
  });

  return onMouseDown;
}
