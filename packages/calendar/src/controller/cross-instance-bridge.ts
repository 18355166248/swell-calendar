import { EventObject } from '@/types/events.type';

/**
 * 跨实例拖拽数据
 *
 * 当源实例的内部拖拽在日历容器外部结束时，
 * 通过模块级 bridge 发布此数据给所有订阅者。
 */
export interface CrossInstanceDragData {
  /** 被拖拽事件的完整数据 */
  event: EventObject;
  /** 鼠标释放时的 clientX */
  cursorX: number;
  /** 鼠标释放时的 clientY */
  cursorY: number;
}

type CrossInstanceSubscriber = (data: CrossInstanceDragData) => void;

/**
 * 跨实例拖拽桥接器
 *
 * 模块级单例，所有同一页面内的 Calendar 实例共享此桥接器。
 * 源实例在拖拽结束于容器外部时调用 `publish`，
 * 目标实例通过 `subscribe` 接收跨实例拖拽数据。
 *
 * 设计说明：
 * - 不引入全局注册表或实例 ID
 * - 不依赖 window.postMessage 或 CustomEvent
 * - 仅在浏览器端使用，不处理 SSR
 */
const subscribers = new Set<CrossInstanceSubscriber>();

export const crossInstanceBridge = {
  /**
   * 订阅跨实例拖拽事件
   * @returns 取消订阅的函数
   */
  subscribe(cb: CrossInstanceSubscriber): () => void {
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  },

  /**
   * 发布跨实例拖拽事件
   * 所有已订阅的 Calendar 实例都会收到通知
   */
  publish(data: CrossInstanceDragData): void {
    subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch {
        // 订阅者异常不影响其他订阅者
      }
    });
  },
};
