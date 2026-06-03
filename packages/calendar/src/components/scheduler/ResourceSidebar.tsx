import { cls } from '@/helpers/css';
import { ResourceInfo } from '@/types/options.type';

interface ResourceSidebarProps {
  resources: ResourceInfo[];
  collapsedIds: string[];
  onToggleCollapse: (resourceId: string) => void;
  width: number | string;
}

/**
 * 资源侧边栏
 *
 * 显示资源层级结构，支持点击折叠/展开。
 */
export function ResourceSidebar({
  resources,
  collapsedIds,
  onToggleCollapse,
  width,
}: ResourceSidebarProps) {
  return (
    <div
      className={cls('resource-sidebar')}
      style={{
        width,
        minWidth: width,
        flexShrink: 0,
        borderRight: '1px solid #e8e8e8',
        overflow: 'hidden',
      }}
    >
      {resources.map((resource) => {
        const hasChildren = resource.children && resource.children.length > 0;
        const isCollapsed = collapsedIds.includes(resource.id);

        return (
          <div key={resource.id}>
            <div
              className={cls('resource-sidebar-item')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                height: 32,
                borderBottom: '1px solid #f0f0f0',
                cursor: hasChildren ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onClick={() => {
                if (hasChildren) {
                  onToggleCollapse(resource.id);
                }
              }}
            >
              {hasChildren ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    fontSize: 10,
                    transition: 'transform 0.15s',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  }}
                >
                  ▼
                </span>
              ) : (
                <span style={{ width: 14 }} />
              )}
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: resource.backgroundColor || resource.color || '#3b82f6',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
                title={resource.name}
              >
                {resource.name}
              </span>
              {hasChildren && (
                <span style={{ fontSize: 10, color: '#999' }}>{resource.children!.length}</span>
              )}
            </div>
            {/* 展开状态：显示子资源缩进 */}
            {hasChildren &&
              !isCollapsed &&
              resource.children!.map((child) => (
                <div
                  key={child.id}
                  className={cls('resource-sidebar-item resource-sidebar-item--child')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px 4px 24px',
                    fontSize: 11,
                    height: 28,
                    borderBottom: '1px solid #f5f5f5',
                    color: '#666',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: child.backgroundColor || child.color || '#94a3b8',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                    title={child.name}
                  >
                    {child.name}
                  </span>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
