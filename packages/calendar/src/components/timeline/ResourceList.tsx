import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import { ResourceInfo } from '@/types/options.type';

interface ResourceListProps {
  resources: ResourceInfo[];
  /** 与 resources 一一对应的行高（由车道数推导，需与网格行高对齐） */
  rowHeights: number[];
}

export function ResourceList({ resources, rowHeights }: ResourceListProps) {
  const listTheme = useThemeStore((s) => s.timeline.resourceList);
  const itemTheme = useThemeStore((s) => s.timeline.resourceItem);

  return (
    <div
      className={cls('timeline-resource-list')}
      style={{ borderRight: listTheme.borderRight, background: listTheme.backgroundColor }}
    >
      {resources.map((resource, index) => (
        <div
          key={resource.id}
          className={cls('timeline-resource-item')}
          style={{ height: rowHeights[index], borderBottom: itemTheme.borderBottom }}
        >
          <span
            className={cls('timeline-resource-dot')}
            style={{ backgroundColor: resource.backgroundColor || resource.color || '#3b82f6' }}
          />
          <span className={cls('timeline-resource-name')} style={{ color: itemTheme.nameColor }}>
            {resource.name}
          </span>
        </div>
      ))}
    </div>
  );
}
