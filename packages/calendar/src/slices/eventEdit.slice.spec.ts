import { describe, expect, it } from 'vitest';

import { createCalendarStore } from '@/contexts/calendarStore';

describe('event edit slice', () => {
  it('初始没有处于编辑态的事件', () => {
    const store = createCalendarStore();
    expect(store.getState().eventEdit.editingEventId).toBeNull();
  });

  it('setEditingEventId 设置、切换与清除当前编辑事件', () => {
    const store = createCalendarStore();

    store.getState().eventEdit.setEditingEventId('evt-1');
    expect(store.getState().eventEdit.editingEventId).toBe('evt-1');

    store.getState().eventEdit.setEditingEventId('evt-2');
    expect(store.getState().eventEdit.editingEventId).toBe('evt-2');

    store.getState().eventEdit.setEditingEventId(null);
    expect(store.getState().eventEdit.editingEventId).toBeNull();
  });
});
