import { describe, expect, it } from 'vitest';

import type { EventObject } from 'swell-calendar';

import {
  calEventToInput,
  currentWeekStartDayIndex,
  engineEventToCreateInput,
  engineEventToDraft,
  inputToDraft,
  recurrenceInstanceToEditableCalEvent,
  rebaseEventsToCurrentWeek,
  toCalendarEvents,
} from './calendarData';
import type { CalEvent } from './data';
import { resources } from './data';
import { formatEventTimeLabel, pickEventMeta, type NewEventInput } from './overlays';

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

  it('更新路径：优先保留引擎侧 recurrence 结果，支持截断旧系列', () => {
    const raw: CalEvent = {
      id: 'repeat',
      res: 'r1',
      day: 0,
      start: 9,
      end: 10,
      title: '重复',
      cat: 'seafoam',
      recurrence: { frequency: 'weekly' },
    };
    const until = new Date(2025, 2, 23, 23, 59, 59, 999);

    const draft = engineEventToDraft(
      engineEvent({
        id: 'repeat',
        start: new Date(2025, 2, 17, 9, 0),
        end: new Date(2025, 2, 17, 10, 0),
        recurrence: { frequency: 'weekly', until },
        raw,
      })
    );

    expect(draft.recurrence?.until).toBe(until.getTime());
  });

  it('更新路径：recurringExceptions 日期与 overrides 时间归一化为时间戳，避免落库后失效', () => {
    const raw: CalEvent = {
      id: 'repeat',
      res: 'r1',
      day: 0,
      start: 9,
      end: 10,
      title: '重复',
      cat: 'seafoam',
      recurrence: { frequency: 'daily' },
    };
    const occurrence = new Date(2025, 2, 18, 9, 0);
    const overrideStart = new Date(2025, 2, 18, 11, 0);
    const overrideEnd = new Date(2025, 2, 18, 12, 0);

    const draft = engineEventToDraft(
      engineEvent({
        id: 'repeat',
        start: new Date(2025, 2, 17, 9, 0),
        end: new Date(2025, 2, 17, 10, 0),
        raw,
        recurringExceptions: [
          {
            date: occurrence,
            overrides: {
              title: '仅此次',
              start: overrideStart,
              end: overrideEnd,
            },
          },
        ],
      })
    );

    expect(draft.recurringExceptions?.[0]?.date).toBe(occurrence.getTime());
    expect(draft.recurringExceptions?.[0]?.overrides?.start).toBe(overrideStart.getTime());
    expect(draft.recurringExceptions?.[0]?.overrides?.end).toBe(overrideEnd.getTime());
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

describe('rebaseEventsToCurrentWeek · 种子锚定到当前周（修复首屏空日历）', () => {
  const seed: CalEvent[] = [
    { id: 'a', res: 'r1', day: 0, start: 9, end: 10, title: '周一', cat: 'seafoam' },
    { id: 'b', res: 'r1', day: 2, endDay: 3, start: 14, end: 10, title: '跨天', cat: 'orange' },
  ];

  it('currentWeekStartDayIndex：传入某周三 → 指向当周周一的偏移', () => {
    // 2025-03-19 是周三；当周周一 = 2025-03-17 = BASE_DATE = day 0
    expect(currentWeekStartDayIndex(new Date(2025, 2, 19))).toBe(0);
    // 下一周三 2025-03-26 → 当周周一 2025-03-24 = BASE + 7
    expect(currentWeekStartDayIndex(new Date(2025, 2, 26))).toBe(7);
  });

  it('currentWeekStartDayIndex：周日归到本周周一（startDayOfWeek=1）', () => {
    // 2025-03-23 是周日，所属周一仍是 2025-03-17 = day 0
    expect(currentWeekStartDayIndex(new Date(2025, 2, 23))).toBe(0);
  });

  it('把周内索引整体平移到当前周，day/endDay 同步偏移，其余字段不变', () => {
    const now = new Date(2025, 2, 26); // 偏移 +7
    const out = rebaseEventsToCurrentWeek(seed, now);
    expect(out[0].day).toBe(7);
    expect(out[0].endDay).toBeUndefined(); // 原本没有 endDay 不应凭空加上
    expect(out[1].day).toBe(9);
    expect(out[1].endDay).toBe(10);
    // 业务字段原样保留
    expect(out[1].title).toBe('跨天');
    expect(out[1].start).toBe(14);
  });

  it('偏移为 0 时原样返回（同一周引用稳定）', () => {
    const now = new Date(2025, 2, 17); // BASE 周 → 偏移 0
    expect(rebaseEventsToCurrentWeek(seed, now)).toBe(seed);
  });
});

describe('+N 更多浮层取数 · pickEventMeta / formatEventTimeLabel', () => {
  it('pickEventMeta：优先 meta.pickMeta，回退 raw', () => {
    expect(
      pickEventMeta({
        meta: { pickMeta: { who: '甲', loc: '会议室A' } },
        raw: { who: '乙', loc: '会议室B' },
      } as never)
    ).toEqual({ who: '甲', loc: '会议室A' });
  });

  it('pickEventMeta：无 pickMeta 时取 raw', () => {
    expect(pickEventMeta({ raw: { who: '乙', loc: '会议室B' } } as never)).toEqual({
      who: '乙',
      loc: '会议室B',
    });
  });

  it('pickEventMeta：两者皆无返回 undefined 字段', () => {
    expect(pickEventMeta({} as never)).toEqual({ who: undefined, loc: undefined });
  });

  it('formatEventTimeLabel：全天事件 → 「全天」', () => {
    expect(formatEventTimeLabel({ allDay: true } as never)).toBe('全天');
  });

  it('formatEventTimeLabel：定时事件 → 起止时间区间（分钟补零）', () => {
    expect(
      formatEventTimeLabel({
        allDay: false,
        start: new Date(2025, 2, 17, 9, 5),
        end: new Date(2025, 2, 17, 10, 30),
      } as never)
    ).toBe('9:05 - 10:30');
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

describe('回归：重复实例编辑回填', () => {
  it('实例编辑态保留父事件 weekly 规则，避免表单显示为不重复', () => {
    const parent: CalEvent = {
      id: 'weekly-parent',
      res: 'r1',
      day: 0,
      start: 9,
      end: 10,
      title: '每周例会',
      cat: 'seafoam',
      recurrence: { frequency: 'weekly' },
    };
    const instance = engineEvent({
      id: 'weekly-parent-2025-03-24',
      title: '每周例会',
      resourceId: 'r1',
      start: new Date(2025, 2, 24, 9, 0),
      end: new Date(2025, 2, 24, 10, 0),
      recurrenceParentId: 'weekly-parent',
      recurrenceOccurrenceDate: new Date(2025, 2, 24, 9, 0),
    });

    const editable = recurrenceInstanceToEditableCalEvent(parent, instance);
    const input = calEventToInput(editable);

    expect(input.date).toBe('2025-03-24');
    expect(input.recurrence).toBe('weekly');
  });

  it('inputToDraft 支持 daily / weekly / biweekly / none 相互切换', () => {
    const base: CalEvent = {
      id: 'weekly-parent',
      res: 'r1',
      day: 0,
      start: 9,
      end: 10,
      title: '每周例会',
      cat: 'seafoam',
      recurrence: { frequency: 'weekly' },
      recurringExceptions: [{ date: new Date(2025, 2, 24), overrides: { title: '单次' } }],
    };
    const baseInput: NewEventInput = {
      title: '切换重复',
      res: 'r1',
      date: '2025-03-17',
      endDate: '2025-03-17',
      start: '09:00',
      end: '10:00',
      cat: 'seafoam',
    };

    expect(inputToDraft({ ...baseInput, recurrence: 'daily' }, base).recurrence).toEqual({
      frequency: 'daily',
    });
    expect(inputToDraft({ ...baseInput, recurrence: 'biweekly' }, base).recurrence).toEqual({
      frequency: 'weekly',
      interval: 2,
    });
    expect(inputToDraft({ ...baseInput, recurrence: 'none' }, base).recurrence).toBeUndefined();
    expect(
      inputToDraft({ ...baseInput, recurrence: 'daily' }, base).recurringExceptions
    ).toBeUndefined();

    const unchanged = inputToDraft({ ...baseInput, recurrence: 'weekly' }, base);
    expect(unchanged.recurrence).toEqual({ frequency: 'weekly' });
    expect(unchanged.recurringExceptions).toEqual(base.recurringExceptions);
  });
});
