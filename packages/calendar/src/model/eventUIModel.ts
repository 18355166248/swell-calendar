import { EventModel } from './eventModel';

/**
 * 事件UI属性接口
 * 定义了事件在界面渲染时需要的所有UI相关属性
 */
interface EventUIProps {
  top: number; // 事件在容器中的垂直位置（百分比）
  left: number; // 事件在容器中的水平位置（百分比或像素）
  width: number; // 事件的宽度（百分比或像素）
  height: number; // 事件的高度（像素）
  exceedLeft: boolean; // 事件实际开始时间是否早于渲染开始时间
  exceedRight: boolean; // 事件实际结束时间是否晚于渲染结束时间
  croppedStart: boolean; // 事件在列视图中是否被裁剪了开始部分
  croppedEnd: boolean; // 事件在列视图中是否被裁剪了结束部分
  collapse: boolean; // 是否为折叠状态（在重复事件组中）
}

export class EventUIModel implements EventUIProps {
  /** 关联的事件数据模型 */
  model: EventModel;
  /** 事件在容器中的垂直位置（百分比） */
  top = 0;
  /**
   * 事件在容器中的水平位置（百分比或像素）
   * 如果是重复事件，表示重复事件组的水平位置
   */
  left = 0;
  /**
   * 事件的宽度（百分比或像素）
   * 如果是重复事件，表示重复事件组的宽度
   */
  width = 0;

  /** 事件的高度（像素） */
  height = 0;

  constructor(model: EventModel) {
    this.model = model;
  }
  exceedLeft: boolean = false;
  exceedRight: boolean = false;
  croppedStart: boolean = false;
  croppedEnd: boolean = false;
  collapse: boolean = false;

  /**
   * 获取模型的唯一标识符
   * @returns {number} 唯一数字标识
   */
  cid() {
    return this.model.cid();
  }
}
