import { cls, toPercent } from '@/helpers/css';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { TimeGridData } from '@/types/grid.type';

interface DropPreviewShadowProps {
  preview: TimeGridDropPreview | null;
  timeGridData: TimeGridData;
}

const classNames = {
  shadow: cls('timegrid-drop-preview'),
};

function getPreviewColors(preview: TimeGridDropPreview) {
  if (preview.status === 'invalid' || preview.status === 'policy') {
    return {
      background: 'rgba(239, 68, 68, 0.14)',
      border: '1px dashed rgba(220, 38, 38, 0.85)',
      color: '#991b1b',
    };
  }

  if (preview.source === 'cross-instance') {
    return {
      background: 'rgba(16, 185, 129, 0.18)',
      border: '1px dashed rgba(5, 150, 105, 0.9)',
      color: '#065f46',
    };
  }

  return {
    background: 'rgba(59, 130, 246, 0.16)',
    border: '1px dashed rgba(37, 99, 235, 0.9)',
    color: '#1d4ed8',
  };
}

function getPreviewLabel(preview: TimeGridDropPreview) {
  if (preview.status === 'invalid') {
    return '不可放置';
  }

  if (preview.status === 'policy') {
    return '策略限制';
  }

  return preview.event?.title ?? '拖入到此';
}

function DropPreviewShadow({ preview, timeGridData }: DropPreviewShadowProps) {
  if (!preview) {
    return null;
  }

  const column = timeGridData.columns[preview.position.columnIndex];
  const row = timeGridData.rows[preview.position.rowIndex];

  if (!column || !row) {
    return null;
  }

  const colors = getPreviewColors(preview);

  return (
    <div
      className={classNames.shadow}
      data-testid="timegrid-drop-preview"
      style={{
        position: 'absolute',
        top: toPercent(row.top),
        left: toPercent(column.left),
        width: toPercent(column.width),
        height: toPercent(row.height),
        padding: '4px 6px',
        boxSizing: 'border-box',
        borderRadius: 4,
        background: colors.background,
        border: colors.border,
        color: colors.color,
        fontSize: 11,
        lineHeight: 1.2,
        pointerEvents: 'none',
        zIndex: 3,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {getPreviewLabel(preview)}
    </div>
  );
}

export default DropPreviewShadow;
