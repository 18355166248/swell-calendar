export interface HoverSlice {
  hover: {
    /** 当前悬浮的事件 id。用于跨天事件多段（按列拆分）联动高亮：
     *  悬浮任一段时，同一 id 的所有段一起加深。无悬浮为 null。 */
    hoveredEventId: string | null;
    setHoveredEventId: (id: string | null) => void;
  };
}
