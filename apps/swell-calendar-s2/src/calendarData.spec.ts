import { describe, expect, it } from 'vitest';

import type { EventObject } from 'swell-calendar';

import {
  calEventToInput,
  engineEventToCreateInput,
  engineEventToDraft,
  inputToDraft,
  toCalendarEvents,
} from './calendarData';
import type { CalEvent } from './data';
import { resources } from './data';
import type { NewEventInput } from './overlays';

// BASE_DATE（calendarData 内部）= 2025-03-17（周一）= day 0。
// day 1 = 2025-03-18（周二），以此类推。
const DEFAULT_RES = resources[0].id;

/** 构造一个最小 EventObject（仅含转换关心的字段）。 */
function engineEvent(partial: Partial<EventObject>): EventObject {
  return { id: '', title: '', ...partial } as EventObject;
}

describe('toCalendarEvents · 跨天渲染', () => {
  it('单日事件（无 endDay）结束落在同一天', () => {
    const ev: CalEvent = {
      id: 'a',
      res: 'r1',
      day: 0,
      start: 9,
      end: 10.5,
      title: '单日',
      cat: 'seafoam',
    };
    const [out] = toCalendarEvents([ev]);
    expect(out.start).toEqual(new Date(2025, 2, 17, 9, 0));
    expect(out.end).toEqual(new Date(2025, 2, 17, 10, 30));
  });

  it('跨天事件（endDay > day）结束落在 endDay 当天', () => {
    const ev: CalEvent = {
      id: 'b',
      res: 'r1',
      day: 0,
      endDay: 1,
      start: 14,
      end: 10,
      title: '跨天',
      cat: 'orange',
    };
    const [out] = toCalendarEvents([ev]);
    // 开始：周一 14:00；结束：周二 10:00（不是塌回周一）
    expect(out.start).toEqual(new Date(2025, 2, 17, 14, 0));
    expect(out.end).toEqual(new Date(2025, 2, 18, 10, 0));
    // 关键回归：结束晚于开始
    expect((out.end as Date).getTime()).toBeGreaterThan((out.start as Date).getTime());
  });
});

describe('engineEventToDraft · 引擎事件 → 草稿', () => {
  it('新建路径：跨天拖拽产生 endDay > day，并默认首个资源', () => {
    const draft = engineEventToDraft(
      engineEvent({
        start: new Date(2025, 2, 17, 14, 0), // 周一 14:00
        end: new Date(2025, 2, 18, 10, 0), // 周二 10:00
      })
    );
    expect(draft.day).toBe(0);
    expect(draft.endDay).toBe(1);
    expect(draft.start).toBe(14);
    expect(draft.end).toBe(10);
    expect(draft.res).toBe(DEFAULT_RES); // day/week 无 resourceId → 兜底首个资源
  });

  it('新建路径：单日拖拽 endDay === day', () => {
    const draft = engineEventToDraft(
      engineEvent({
        start: new Date(2025, 2, 17, 9, 0),
        end: new Date(2025, 2, 17, 10, 0),
      })
    );
    expect(draft.day).toBe(0);
    expect(draft.endDay).toBe(0);
  });

  it('更新路径：基于 raw 合并，显式覆盖 endDay 防止旧值塌陷跨度', () => {
    const raw: CalEvent = {
      id: 'orig',
      res: 'r2',
      day: 0,
      endDay: 0, // 原本单日
      start: 9,
      end: 10,
      title: '原标题',
      cat: 'magenta',
      who: '张三',
      desc: '说明',
    };
    const draft = engineEventToDraft(
      engineEvent({
        id: 'orig',
        resourceId: 'r2',
        start: new Date(2025, 2, 17, 23, 0), // 周一 23:00
        end: new Date(2025, 2, 18, 1, 0), // 周二 01:00（拖成跨天）
        raw,
      })
    );
    // 业务字段保留
    expect(draft.title).toBe('原标题');
    expect(draft.who).toBe('张三');
    expect(draft.desc).toBe('说明');
    // 跨度被刷新为跨天
    expect(draft.day).toBe(0);
    expect(draft.endDay).toBe(1);
    expect(draft.start).toBe(23);
    expect(draft.end).toBe(1);
  });
});

describe('对话框输入 ↔ 草稿 · 跨天字段守恒', () => {
  it('inputToDraft：endDate 转成 endDay', () => {
    const input: NewEventInput = {
      title: '会议',
      res: 'r1',
      date: '2025-03-17',
      endDate: '2025-03-18',
      start: '14:00',
      end: '10:00',
      cat: 'seafoam',
    };
    const draft = inputToDraft(input);
    expect(draft.day).toBe(0);
    expect(draft.endDay).toBe(1);
    expect(draft.start).toBe(14);
    expect(draft.end).toBe(10);
  });

  it('inputToDraft：单日 date===endDate → endDay===day', () => {
    const input: NewEventInput = {
      title: '会议',
      res: 'r1',
      date: '2025-03-19',
      endDate: '2025-03-19',
      start: '09:00',
      end: '10:00',
      cat: 'seafoam',
    };
    const draft = inputToDraft(input);
    expect(draft.day).toBe(2);
    expect(draft.endDay).toBe(2);
  });

  it('calEventToInput：跨天 endDay 回填为 endDate', () => {
    const ev: CalEvent = {
      id: 'x',
      res: 'r1',
      day: 0,
      endDay: 2,
      start: 14,
      end: 9,
      title: 't',
      cat: 'green',
    };
    const input = calEventToInput(ev);
    expect(input.date).toBe('2025-03-17');
    expect(input.endDate).toBe('2025-03-19');
  });

  it('calEventToInput：无 endDay 时 endDate 默认等于 date', () => {
    const ev: CalEvent = {
      id: 'y',
      res: 'r1',
      day: 3,
      start: 9,
      end: 10,
      title: 't',
      cat: 'green',
    };
    const input = calEventToInput(ev);
    expect(input.endDate).toBe(input.date);
    expect(input.endDate).toBe('2025-03-20');
  });
});

describe('回归：跨天滑动新建全链路守恒（修复前会塌回起始天）', () => {
  it('引擎跨天事件 → 预填输入 → 草稿 → 渲染，结束日始终保持在第二天', () => {
    // 1) 引擎滑动新建：周一 14:00 → 周二 10:00
    const engine = engineEvent({
      start: new Date(2025, 2, 17, 14, 0),
      end: new Date(2025, 2, 18, 10, 0),
    });

    // 2) 弹窗预填
    const input = engineEventToCreateInput(engine);
    expect(input.date).toBe('2025-03-17');
    expect(input.endDate).toBe('2025-03-18'); // ← 修复点：不再丢失结束日
    expect(input.start).toBe('14:00');
    expect(input.end).toBe('10:00');

    // 3) 用户确认 → 落库草稿
    const draft = inputToDraft(input);
    const created: CalEvent = { ...draft, id: 'new' };
    expect(created.day).toBe(0);
    expect(created.endDay).toBe(1);

    // 4) 渲染回引擎事件：结束仍在周二，而非塌回周一
    const [rendered] = toCalendarEvents([created]);
    expect(rendered.end).toEqual(new Date(2025, 2, 18, 10, 0));
    expect((rendered.end as Date).getTime()).toBeGreaterThan((rendered.start as Date).getTime());
  });
});
