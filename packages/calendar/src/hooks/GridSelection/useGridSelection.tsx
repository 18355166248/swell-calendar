import { GridPosition, GridPositionFinder } from '@/types/grid.type';
import { useDrag } from '../common/useDrag';
import { useState } from 'react';
import { isNil } from 'lodash-es';

export function useGridSelection({
  gridPositionFinder,
}: {
  gridPositionFinder: GridPositionFinder;
}) {
  const [initGridPosition, setInitGridPosition] = useState<GridPosition | null>(null);

  const onMouseDown = useDrag({
    onInit: (e) => {
      // 获取并记录初始网格位置
      const gridPosition = gridPositionFinder(e);
      console.log('🚀 ~ gridPosition:', gridPosition);
      if (!isNil(gridPosition)) {
        setInitGridPosition(gridPosition);
      }
    },
  });

  return onMouseDown;
}
