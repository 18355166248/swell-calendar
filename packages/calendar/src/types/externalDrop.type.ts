import { ExternalDropPosition, ExternalDropResult } from './api.type';

type ExternalDropResolver = (
  params: ExternalDropPosition & { data?: unknown }
) => ExternalDropResult;

/**
 * externalDrop slice 类型定义
 *
 * 持有一个由 TimeGridView 在挂载时注册的 resolver 函数，供
 * `CalendarInstance.externalDrop()` 通过 store 调用。
 *
 * 不持有任何可序列化状态——`resolver` 是运行时函数引用，仅在视图
 * 渲染期有效，卸载时清空。
 */
export type ExternalDropSlice = {
  externalDrop: {
    /** 注册一个外部 drop resolver；卸载视图时传 null 清空 */
    setResolver: (resolver: ExternalDropResolver | null) => void;
    /** 当前已注册的 resolver；未注册时为 null */
    resolver: ExternalDropResolver | null;
  };
};
