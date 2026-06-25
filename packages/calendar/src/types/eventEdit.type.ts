export interface EventEditSlice {
  eventEdit: {
    /** 当前处于移动端编辑态的事件 id。触控长按进入，切换事件时覆盖前一个。 */
    editingEventId: string | null;
    setEditingEventId: (id: string | null) => void;
  };
}
