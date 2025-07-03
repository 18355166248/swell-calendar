# Calendar Store 管理方式

## 问题背景

原来的实现存在以下问题：

1. **全局单例问题**：`useCalendarStore` 在模块加载时就创建了一个全局的 store 实例
2. **配置灵活性差**：无法为不同的日历实例提供不同的配置选项
3. **按需加载问题**：即使不使用日历组件，store 也会被创建

## 新的解决方案

### 1. CalendarStoreProvider

使用 `CalendarStoreProvider` 来管理 store 的生命周期：

```tsx
import { CalendarStoreProvider } from '@/contexts/calendarStore';
import { Day } from '@/components/view/Day';

function MyCalendar() {
  const options = {
    defaultView: 'day',
    week: {
      startDayOfWeek: 1, // 周一开始
      hourStart: 8,
      hourEnd: 20,
    },
    isReadOnly: false,
  };

  return (
    <CalendarStoreProvider options={options}>
      <Day />
    </CalendarStoreProvider>
  );
}
```

### 2. Calendar 组件

为了方便使用，提供了 `Calendar` 组件：

```tsx
import { Calendar } from '@/components/Calendar';

function App() {
  return (
    <Calendar
      options={{
        defaultView: 'day',
        week: {
          startDayOfWeek: 1,
          hourStart: 8,
          hourEnd: 20,
        },
      }}
      className="my-calendar"
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

### 3. 多个日历实例

现在可以轻松创建多个独立的日历实例：

```tsx
function MultipleCalendars() {
  return (
    <div>
      {/* 工作日历 */}
      <Calendar
        options={{
          defaultView: 'day',
          week: { workweek: true },
        }}
        style={{ height: '400px' }}
      />

      {/* 个人日历 */}
      <Calendar
        options={{
          defaultView: 'day',
          week: {
            startDayOfWeek: 0, // 周日开始
            hourStart: 0,
            hourEnd: 24,
          },
        }}
        style={{ height: '400px' }}
      />
    </div>
  );
}
```

## 优势

### 1. 按需加载
- Store 只在需要时才创建
- 减少不必要的内存占用
- 提高应用启动性能

### 2. 独立配置
- 每个日历实例可以有独立的配置
- 支持不同的视图、主题、选项等
- 更好的组件复用性

### 3. 更好的测试性
- 每个测试可以创建独立的 store 实例
- 避免测试间的状态污染
- 更容易进行单元测试

### 4. 向后兼容
- 保留了 `useCalendarStoreLegacy` 用于向后兼容
- 现有代码可以逐步迁移

## 迁移指南

### 从旧版本迁移

1. **替换导入**：
```tsx
// 旧版本
import { useCalendarStore } from '@/contexts/calendarStore';

// 新版本
import { CalendarStoreProvider, useCalendarStore } from '@/contexts/calendarStore';
```

2. **添加 Provider**：
```tsx
// 旧版本
function MyComponent() {
  const store = useCalendarStore();
  return <Day />;
}

// 新版本
function MyComponent() {
  return (
    <CalendarStoreProvider options={{}}>
      <Day />
    </CalendarStoreProvider>
  );
}
```

3. **使用 Calendar 组件**（推荐）：
```tsx
import { Calendar } from '@/components/Calendar';

function MyComponent() {
  return <Calendar options={{}} />;
}
```

## 注意事项

1. **Provider 必须包裹**：所有使用 `useCalendarStore` 的组件必须在 `CalendarStoreProvider` 内部
2. **配置不可变**：Provider 创建后，options 配置不可更改
3. **性能优化**：使用 `useRef` 确保 store 实例在组件重新渲染时不会重新创建
