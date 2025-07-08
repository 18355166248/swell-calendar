import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventModel } from './eventModel';
import { collidesWith } from '@/helpers/event';
import { pick } from 'lodash-es';

/**
 * 事件UI属性键名数组
 * 用于从EventUIModel实例中提取UI属性
 */
const eventUIPropsKey: (keyof EventUIProps)[] = [
  'top',
  'left',
  'width',
  'height',
  'exceedLeft',
  'exceedRight',
  'croppedStart',
  'croppedEnd',
  'collapse',
];

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
  /**
   * 重复事件组中所有事件的排序列表
   * @type {EventUIModel[]}
   */
  duplicateEvents: EventUIModel[] = [];
  /**
   * 当前事件在重复事件组中的索引
   * @type {number}
   */
  duplicateEventIndex = -1;
  /**
   * 重复事件组的开始时间
   * 取所有重复事件中最早的开始时间和前往时间
   * @type {DayjsTZDate}
   */
  duplicateStarts?: DayjsTZDate;
  /**
   * 重复事件组的结束时间
   * 取所有重复事件中最晚的结束时间和返回时间
   * @type {DayjsTZDate}
   */
  duplicateEnds?: DayjsTZDate;
  /**
   * 重复事件在组中的水平位置
   * 例如：calc(50% - 24px), calc(50%), ...
   * @type {string}
   */
  duplicateLeft = '';
  /**
   * 重复事件在组中的宽度
   * 例如：calc(50% - 24px), 9px, ...
   * @type {string}
   */
  duplicateWidth = '';

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

  /**
   * 获取渲染用的开始时间
   * @returns {TZDate} 开始时间
   */
  getStarts() {
    return this.model.getStarts();
  }

  /**
   * 获取渲染用的结束时间
   * @returns {TZDate} 结束时间
   */
  getEnds() {
    return this.model.getEnds();
  }

  /**
   * 获取事件持续时间
   * @returns {number} 事件持续时间（毫秒）
   */
  duration() {
    return this.model.duration();
  }
  /**
   * 重写valueOf方法，用于事件排序
   * @returns {EventModel} 事件数据模型
   */
  valueOf(): EventModel {
    return this.model;
  }

  /**
   * 获取所有UI属性
   * @returns {EventUIProps} UI属性对象
   */
  getUIProps(): EventUIProps {
    return pick(this, ...eventUIPropsKey);
  }
  /**
   * 设置UI属性
   * @param {Partial<EventUIProps>} props - 要设置的UI属性
   */
  setUIProps(props: Partial<EventUIProps>) {
    Object.assign(this, props);
  }
  /**
   * 检查当前事件是否与指定事件冲突
   * @param {EventModel | EventUIModel} uiModel - 要检查的事件
   * @param {boolean} usingTravelTime - 是否考虑行程时间
   * @returns {boolean} 是否冲突
   */
  collidesWith(uiModel: EventModel | EventUIModel, usingTravelTime = true) {
    const infos: {
      start: DayjsTZDate;
      end: DayjsTZDate;
      goingDuration: number;
      comingDuration: number;
    }[] = [];

    // 收集两个事件的时间信息
    [this, uiModel].forEach((event) => {
      const isDuplicateEvent = event instanceof EventUIModel && event.duplicateEvents.length > 0;

      if (isDuplicateEvent) {
        // 如果是重复事件，使用重复事件组的时间范围
        infos.push({
          start: event.duplicateStarts as DayjsTZDate,
          end: event.duplicateEnds as DayjsTZDate,
          goingDuration: 0,
          comingDuration: 0,
        });
      } else {
        // 普通事件使用自身的时间范围
        infos.push({
          start: event.getStarts(),
          end: event.getEnds(),
          goingDuration: event.valueOf().goingDuration,
          comingDuration: event.valueOf().comingDuration,
        });
      }
    });

    const [thisInfo, targetInfo] = infos;

    // 调用冲突检测函数
    return collidesWith({
      start: thisInfo.start.getTime(),
      end: thisInfo.end.getTime(),
      targetStart: targetInfo.start.getTime(),
      targetEnd: targetInfo.end.getTime(),
      goingDuration: thisInfo.goingDuration,
      comingDuration: thisInfo.comingDuration,
      targetGoingDuration: targetInfo.goingDuration,
      targetComingDuration: targetInfo.comingDuration,
      usingTravelTime, // 日网格不使用行程时间，时间网格使用行程时间
    });
  }

  clone() {
    // 获取当前UI属性
    const eventUIModelProps = this.getUIProps();
    const clonedEventUIModel = new EventUIModel(this.model);
    clonedEventUIModel.setUIProps(eventUIModelProps);

    return clonedEventUIModel;
  }
}
