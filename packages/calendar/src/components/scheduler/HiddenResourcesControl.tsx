import { useEffect, useRef, useState } from 'react';

import { cls } from '@/helpers/css';
import { ResourceInfo } from '@/types/options.type';

interface HiddenResourcesControlProps {
  /** 当前被隐藏的资源列表 */
  hiddenResources: ResourceInfo[];
  /** 点击恢复某个资源显示 */
  onShow: (resourceId: string) => void;
  /** 控件宽度（对齐左侧 gutter） */
  width: number | string;
}

/**
 * 已隐藏资源恢复入口
 *
 * 资源列头显隐控件把资源隐藏后，其列会从头部消失。本控件挂在
 * scheduler 头部左侧 gutter，展示被隐藏资源数量并提供勾选恢复，
 * 填补「列头方案」无法在库内重新显示资源的缺口。恢复同样走受控回填。
 */
export function HiddenResourcesControl({
  hiddenResources,
  onShow,
  width,
}: HiddenResourcesControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (hiddenResources.length === 0) {
    return <div style={{ width, minWidth: width, flexShrink: 0 }} />;
  }

  return (
    <div
      ref={rootRef}
      className={cls('scheduler-hidden-resources')}
      style={{
        width,
        minWidth: width,
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <button
        type="button"
        className={cls('scheduler-hidden-resources-trigger')}
        title="显示已隐藏资源"
        onClick={() => setOpen((v) => !v)}
        style={{
          border: '1px solid #d0d0d0',
          borderRadius: 4,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 11,
          lineHeight: 1,
          padding: '2px 6px',
          color: '#555',
          whiteSpace: 'nowrap',
        }}
      >
        已隐藏 {hiddenResources.length}
      </button>
      {open ? (
        <div
          className={cls('scheduler-hidden-resources-menu')}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 10,
            minWidth: 160,
            maxHeight: 240,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '4px 0',
          }}
        >
          {hiddenResources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              className={cls('scheduler-hidden-resources-item')}
              onClick={() => onShow(resource.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                textAlign: 'left',
                padding: '4px 10px',
                color: '#333',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: resource.backgroundColor || resource.color || '#94a3b8',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={resource.name}
              >
                {resource.name}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
