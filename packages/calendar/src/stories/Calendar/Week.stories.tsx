// 导入 Storybook 相关的类型定义
import type { Meta, StoryObj } from '@storybook/react-vite';
// 导入周视图组件
import { Week } from '@/components/view/Week';
// 导入布局包装器组件
import { Wrapper } from './Layout/Wrapper';
// 导入创建随机事件的工具函数
import { createRandomEvents } from './utils/randomEvents';
// 导入时区日期处理库
import DayjsTZDate from '@/time/dayjs-tzdate';
// 导入事件模型类
import { EventModel } from '@/model/eventModel';
// 导入日期常量
import { Day } from '@/time/datetime';

// 定义 Storybook 元数据配置
const meta = {
  title: 'Calendar/Week', // Storybook 中的标题路径
  component: Wrapper, // 使用 Wrapper 作为主要组件
  parameters: {
    layout: 'fullscreen', // 使用全屏布局
  },
  tags: [], // 标签数组
  argTypes: {}, // 参数类型定义
  args: {
    events: [] as EventModel[], // 默认参数：空事件数组
  },
} satisfies Meta<typeof Week>;

/**
 * 创建时间网格事件数据
 * 生成从本周开始到结束的随机事件
 */
function createTimeGridEvents() {
  const today = new DayjsTZDate(); // 获取当前日期
  const start = today.addDate(-today.getDay()); // 计算本周开始日期（周日）
  const end = start.addDate(6); // 设置结束日期为开始日期的下一天

  // 创建随机事件并转换为 EventModel 实例
  return createRandomEvents(start, end, 40).map((event) => {
    return new EventModel(event);
  });
}

// 导出元数据配置
export default meta;
// 定义 Story 类型
type Story = StoryObj<typeof meta>;

/**
 * 主要故事：显示完整的周视图
 * 包含从周一到周日的所有日期
 */
export const Primary: Story = {
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        week: {
          startDayOfWeek: Day.MON, // 设置周开始日为周一
          workweek: false, // 显示完整周（包括周末）
        },
      }}
    >
      <Week />
    </Wrapper>
  ),
  args: {
    events: createTimeGridEvents(), // 使用生成的随机事件数据
  },
};

/**
 * 工作日故事：只显示工作日的周视图
 * 通常从周一到周五
 */
export const Workweek: Story = {
  render: (args) => (
    <Wrapper
      events={args.events}
      options={{
        week: {
          startDayOfWeek: Day.MON, // 设置周开始日为周一
          workweek: true, // 只显示工作日（隐藏周末）
        },
      }}
    >
      <Week />
    </Wrapper>
  ),
  args: {
    events: createTimeGridEvents(), // 使用生成的随机事件数据
  },
};
