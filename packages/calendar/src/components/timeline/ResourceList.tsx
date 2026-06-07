import { cls } from '@/helpers/css';
import { ResourceInfo } from '@/types/options.type';

interface ResourceListProps {
  resources: ResourceInfo[];
  /** 与 resources 一一对应的行高（由车道数推导，需与网格行高对齐） */
  rowHeights: number[];
}

export function ResourceList({ resources, rowHeights }: ResourceListProps) {
  return (
    <div className={cls('timeline-resource-list')}>
      {resources.map((resource, index) => (
        <div
          key={resource.id}
          className={cls('timeline-resource-item')}
          style={{ height: rowHeights[index] }}
        >
          <span
            className={cls('timeline-resource-dot')}
            style={{ backgroundColor: resource.backgroundColor || resource.color || '#3b82f6' }}
          />
          <span className={cls('timeline-resource-name')}>{resource.name}</span>
        </div>
      ))}
    </div>
  );
}
