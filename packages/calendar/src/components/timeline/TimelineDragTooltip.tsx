import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';

interface TimelineDragTooltipProps {
  text: string;
  x: number;
  y: number;
}

/** Timeline 拖拽/创建过程中跟随光标的日期范围提示（复用 scheduler tooltip 样式）。 */
export function TimelineDragTooltip({ text, x, y }: TimelineDragTooltipProps) {
  const theme = useThemeStore((s) => s.timeline.tooltip);

  return (
    <div
      className={cls('scheduler-drag-time-tooltip')}
      style={{
        left: x + 12,
        top: y + 12,
        background: theme.backgroundColor,
        color: theme.color,
        border: theme.border,
      }}
    >
      {text}
    </div>
  );
}
