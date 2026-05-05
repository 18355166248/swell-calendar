import { cls } from '@/helpers/css';
import { ResourceInfo } from '@/types/options.type';

interface ResourceListProps {
  resources: ResourceInfo[];
  rowHeight: number;
}

export function ResourceList({ resources, rowHeight }: ResourceListProps) {
  return (
    <div className={cls('timeline-resource-list')}>
      {resources.map((resource) => (
        <div
          key={resource.id}
          className={cls('timeline-resource-item')}
          style={{ height: rowHeight }}
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
