import { describe, expect, it } from 'vitest';

import { createCalendarStore } from '@/contexts/calendarStore';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { DraggingState } from '@/types/dnd.type';

/**
 * 创建测试用的事件 UI 模型
 */
function createTestEventUIModel(id = 'test-event') {
  return new EventUIModel(
    new EventModel({
      id,
      title: '测试事件',
      category: 'time',
      start: new DayjsTZDate('2026-05-07T10:00:00'),
      end: new DayjsTZDate('2026-05-07T11:00:00'),
    })
  );
}

describe('dnd.slice', () => {
  describe('初始状态', () => {
    it('初始化为 IDLE 状态，所有字段为 null', () => {
      const store = createCalendarStore();
      const { dnd } = store.getState();

      expect(dnd.draggingState).toBe(DraggingState.IDLE);
      expect(dnd.draggingItemType).toBeNull();
      expect(dnd.initX).toBeNull();
      expect(dnd.initY).toBeNull();
      expect(dnd.x).toBeNull();
      expect(dnd.y).toBeNull();
      expect(dnd.draggingEventUIModel).toBeNull();
    });
  });

  describe('initDrag', () => {
    it('IDLE → INIT 状态转换', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/123',
        initX: 100,
        initY: 200,
      });

      expect(store.getState().dnd.draggingState).toBe(DraggingState.INIT);
    });

    it('正确设置 initX、initY 和 draggingItemType', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/abc',
        initX: 320,
        initY: 480,
      });

      const { dnd } = store.getState();
      expect(dnd.draggingItemType).toBe('event/timeGrid/move/abc');
      expect(dnd.initX).toBe(320);
      expect(dnd.initY).toBe(480);
    });

    it('连续两次 initDrag 覆盖前一次的值', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/first',
        initX: 10,
        initY: 20,
      });

      // 第二次调用覆盖前一次
      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/second',
        initX: 30,
        initY: 40,
      });

      const { dnd } = store.getState();
      expect(dnd.draggingState).toBe(DraggingState.INIT);
      expect(dnd.draggingItemType).toBe('event/timeGrid/move/second');
      expect(dnd.initX).toBe(30);
      expect(dnd.initY).toBe(40);
    });
  });

  describe('setDragging', () => {
    it('INIT → DRAGGING 状态转换', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/456',
        initX: 50,
        initY: 60,
      });
      store.getState().dnd.setDragging({ x: 150, y: 250 });

      expect(store.getState().dnd.draggingState).toBe(DraggingState.DRAGGING);
    });

    it('多次调用更新 x、y 坐标', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/789',
        initX: 0,
        initY: 0,
      });
      store.getState().dnd.setDragging({ x: 100, y: 200 });
      store.getState().dnd.setDragging({ x: 110, y: 210 });

      const { dnd } = store.getState();
      expect(dnd.x).toBe(110);
      expect(dnd.y).toBe(210);
      expect(dnd.draggingState).toBe(DraggingState.DRAGGING);
    });

    it('可以覆盖额外字段', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/resize/999',
        initX: 0,
        initY: 0,
      });
      store.getState().dnd.setDragging({
        x: 200,
        y: 300,
        draggingItemType: 'event/timeGrid/move/000' as const,
      });

      const { dnd } = store.getState();
      expect(dnd.draggingItemType).toBe('event/timeGrid/move/000');
      expect(dnd.x).toBe(200);
      expect(dnd.y).toBe(300);
    });
  });

  describe('reset', () => {
    it('DRAGGING → IDLE，所有字段恢复默认值', () => {
      const store = createCalendarStore();

      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/r1',
        initX: 1,
        initY: 2,
      });
      store.getState().dnd.setDragging({ x: 3, y: 4 });
      store.getState().dnd.reset();

      const { dnd } = store.getState();
      expect(dnd.draggingState).toBe(DraggingState.IDLE);
      expect(dnd.draggingItemType).toBeNull();
      expect(dnd.initX).toBeNull();
      expect(dnd.initY).toBeNull();
      expect(dnd.x).toBeNull();
      expect(dnd.y).toBeNull();
      expect(dnd.draggingEventUIModel).toBeNull();
    });

    it('完整生命周期: IDLE → INIT → DRAGGING → IDLE', () => {
      const store = createCalendarStore();

      // IDLE
      expect(store.getState().dnd.draggingState).toBe(DraggingState.IDLE);

      // INIT
      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/lifecycle',
        initX: 100,
        initY: 200,
      });
      expect(store.getState().dnd.draggingState).toBe(DraggingState.INIT);

      // DRAGGING
      store.getState().dnd.setDragging({ x: 300, y: 400 });
      expect(store.getState().dnd.draggingState).toBe(DraggingState.DRAGGING);

      // IDLE
      store.getState().dnd.reset();
      expect(store.getState().dnd.draggingState).toBe(DraggingState.IDLE);
    });
  });

  describe('setDraggingEventUIModel', () => {
    it('设置 EventUIModel，存储的应该是克隆副本而非原引用', () => {
      const store = createCalendarStore();
      const uiModel = createTestEventUIModel('clone-test');

      store.getState().dnd.setDraggingEventUIModel(uiModel);

      const stored = store.getState().dnd.draggingEventUIModel;
      expect(stored).not.toBeNull();
      expect(stored).not.toBe(uiModel); // 不是同一个引用
      expect(stored?.cid()).toBe(uiModel.cid()); // 但 cid 相同
    });

    it('传入 null 清空 draggingEventUIModel', () => {
      const store = createCalendarStore();
      const uiModel = createTestEventUIModel('nullify');

      // 先设置
      store.getState().dnd.setDraggingEventUIModel(uiModel);
      expect(store.getState().dnd.draggingEventUIModel).not.toBeNull();

      // 再清空
      store.getState().dnd.setDraggingEventUIModel(null);
      expect(store.getState().dnd.draggingEventUIModel).toBeNull();
    });

    it('修改克隆副本不会影响原始 model', () => {
      const store = createCalendarStore();
      const uiModel = createTestEventUIModel('mutation-test');
      uiModel.setUIProps({ top: 10, left: 20, width: 30, height: 40 });

      store.getState().dnd.setDraggingEventUIModel(uiModel);

      // 修改存储的克隆副本
      const stored = store.getState().dnd.draggingEventUIModel;
      stored?.setUIProps({ top: 999, left: 888, width: 777, height: 666 });

      // 原始 model 的 UI props 不应被修改
      const originalProps = uiModel.getUIProps();
      expect(originalProps.top).toBe(10);
      expect(originalProps.left).toBe(20);
      expect(originalProps.width).toBe(30);
      expect(originalProps.height).toBe(40);
    });
  });
});
