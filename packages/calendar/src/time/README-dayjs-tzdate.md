# DayjsTZDate - 基于 Dayjs 的时区感知日期类

## 概述

`DayjsTZDate` 是一个全新的、基于 [dayjs](https://day.js.org/) 的时区感知日期类，提供了与原生 `Date` 兼容的 API，同时支持时区处理和不可变操作。

## 特性

- ✨ **不可变操作** - 所有修改操作返回新实例，避免意外的副作用
- 🌍 **时区感知** - 支持 IANA 时区名称和数字偏移量
- 🔗 **链式调用** - 支持方法链式调用，让代码更加优雅
- 🛡️ **类型安全** - 完整的 TypeScript 类型支持
- 📦 **轻量级** - 基于 dayjs，比 moment.js 更小
- 🔄 **向后兼容** - 与原生 Date API 兼容

## 安装依赖

```bash
npm install dayjs
# 可选：如果需要时区支持
npm install dayjs-plugin-timezone
```

## 基本使用

### 创建实例

```typescript
import DayjsTZDate from './dayjs-tzdate';

// 无参数 - 当前时间
const now = new DayjsTZDate();

// 从时间戳
const fromTimestamp = new DayjsTZDate(1672531200000);

// 从原生 Date 对象
const fromDate = new DayjsTZDate(new Date());

// 从字符串
const fromString = new DayjsTZDate('2023-01-01T12:00:00Z');

// 从年月日时分秒毫秒
const fromComponents = new DayjsTZDate(2023, 0, 1, 12, 30, 45, 123);

// 从另一个 DayjsTZDate 实例
const copied = new DayjsTZDate(existing);
```

### 获取时间组件

```typescript
const date = new DayjsTZDate(2023, 5, 15, 14, 30, 45, 123);

console.log(date.getFullYear());    // 2023
console.log(date.getMonth());       // 5 (0-based)
console.log(date.getDate());        // 15
console.log(date.getHours());       // 14
console.log(date.getMinutes());     // 30
console.log(date.getSeconds());     // 45
console.log(date.getMilliseconds());// 123
console.log(date.getDay());         // 星期几 (0=周日)
console.log(date.getTime());        // 时间戳
```

### 设置时间（不可变）

```typescript
const original = new DayjsTZDate(2023, 0, 1, 12, 0, 0);

// 设置小时，返回新实例
const newTime = original.setHours(15, 30, 45, 500);
console.log(original.getHours()); // 12 (原实例不变)
console.log(newTime.getHours());  // 15 (新实例)

// 设置年月日
const newDate = original.setFullYear(2024, 5, 15);

// 设置月份
const newMonth = original.setMonth(5, 15);

// 设置日期
const newDay = original.setDate(15);
```

### 时间添加操作

```typescript
const base = new DayjsTZDate(2023, 0, 1, 12, 0, 0);

const addedYear = base.addFullYear(1);    // 添加1年
const addedMonth = base.addMonth(3);      // 添加3个月
const addedDays = base.addDate(15);       // 添加15天
const addedHours = base.addHours(5);      // 添加5小时
const addedMinutes = base.addMinutes(30); // 添加30分钟
const addedSeconds = base.addSeconds(45); // 添加45秒
const addedMs = base.addMilliseconds(500);// 添加500毫秒
```

### 链式调用

```typescript
const result = new DayjsTZDate(2023, 0, 1)
  .addFullYear(1)           // 2024年
  .addMonth(2)              // 3月
  .addDate(10)              // 11日
  .setHours(18, 30, 0)      // 18:30:00
  .addMinutes(15);          // 18:45:00

console.log(result.toString());
```

### 时区操作

```typescript
const utc = new DayjsTZDate(2023, 0, 1, 12, 0, 0);

// 设置为东八区 (UTC+8)
const beijing = utc.tz(-480); // -480分钟 = UTC+8
console.log(beijing.getTimezoneOffset()); // -480

// 设置为本地时区
const local = beijing.tz('Local');

// 使用 IANA 时区名称（需要时区插件）
const ny = utc.tz('America/New_York');

// 转换为本地时区
const toLocal = beijing.local();
```

### 批量设置

```typescript
const date = new DayjsTZDate();

// 一次性设置年月日时分秒毫秒
const batch = date.setWithRaw(2025, 11, 25, 20, 30, 45, 999);
```

### 与原生 Date 互操作

```typescript
const tzDate = new DayjsTZDate(2023, 5, 15, 14, 30);

// 转为原生 Date
const nativeDate = tzDate.toDate();

// 获取时间戳
const timestamp = tzDate.valueOf(); // 或 tzDate.getTime()

// 字符串表示
const str = tzDate.toString();
```

## API 对比

### 与原生 Date 的差异

| 操作 | 原生 Date | DayjsTZDate |
|------|-----------|-------------|
| 修改操作 | 直接修改实例 | 返回新实例（不可变） |
| 时区支持 | 仅本地时区 | 支持任意时区 |
| 链式调用 | 不支持 | 支持 |
| 类型安全 | 基本 | 完整的 TypeScript 支持 |

### setHours 方法对比

```typescript
// 原生 Date (可变)
const nativeDate = new Date(2023, 0, 1, 12, 0, 0);
nativeDate.setHours(15, 30, 45, 500); // 直接修改实例
console.log(nativeDate.getHours()); // 15

// DayjsTZDate (不可变)
const tzDate = new DayjsTZDate(2023, 0, 1, 12, 0, 0);
const newTzDate = tzDate.setHours(15, 30, 45, 500); // 返回新实例
console.log(tzDate.getHours());    // 12 (原实例不变)
console.log(newTzDate.getHours()); // 15 (新实例)
```

## 实际使用场景

### 日程管理

```typescript
// 创建一个会议
const meetingStart = new DayjsTZDate(2023, 5, 15, 9, 0, 0);
const meetingEnd = meetingStart.addHours(2);

console.log(`会议时间: ${meetingStart.getHours()}:${meetingStart.getMinutes().toString().padStart(2, '0')} - ${meetingEnd.getHours()}:${meetingEnd.getMinutes().toString().padStart(2, '0')}`);

// 安排下周同一时间的会议
const nextWeekMeeting = meetingStart.addDate(7);
```

### 时区转换

```typescript
// 全球团队会议时间同步
const utcMeeting = new DayjsTZDate(2023, 5, 15, 14, 0, 0); // UTC 14:00

const beijingTime = utcMeeting.tz(-480);     // UTC+8: 22:00
const newYorkTime = utcMeeting.tz(-240);     // UTC-4: 10:00
const londonTime = utcMeeting.tz(0);         // UTC+0: 14:00
```

### 日期计算

```typescript
// 计算月末
const monthStart = new DayjsTZDate(2023, 5, 1);
const monthEnd = monthStart.addMonth(1).addDate(-1);

// 计算工作日
const today = new DayjsTZDate();
const nextWorkday = today.getDay() === 5 ? today.addDate(3) : today.addDate(1);
```

## 性能注意事项

由于采用了不可变设计，每次操作都会创建新实例。在性能敏感的场景中，请注意：

1. **避免深度链式调用** - 如果需要大量连续操作，考虑使用 `setWithRaw` 方法
2. **缓存计算结果** - 对于复杂的日期计算，考虑缓存结果
3. **选择合适的操作** - 对于简单操作，原生 Date 可能更高效

## 类型定义

完整的类型定义在 `dayjs-tzdate.types.ts` 中，包括：

- `DayjsTZDateInterface` - 核心接口
- `DayjsTZDateMethods` - 方法定义
- `TimezoneValue` - 时区值类型
- `DayjsTZDateConstructorArgs` - 构造函数参数类型

## 依赖要求

- `dayjs` - 核心库
- `dayjs/plugin/utc` - UTC 支持
- `dayjs/plugin/timezone` - 时区支持
- `dayjs/plugin/customParseFormat` - 自定义解析格式

## 注意事项

1. **时区插件配置** - 如需使用 IANA 时区名称，确保正确配置 dayjs 时区插件
2. **月份从0开始** - 与原生 Date 保持一致，月份是 0-based
3. **不可变特性** - 所有修改操作都返回新实例
4. **TypeScript 支持** - 建议在 TypeScript 环境中使用以获得最佳体验

## 测试

运行测试：

```bash
npm test dayjs-tzdate.spec.ts
```

## 迁移指南

从原生 Date 迁移到 DayjsTZDate：

1. 将所有 `new Date()` 替换为 `new DayjsTZDate()`
2. 更新所有修改操作以使用返回值
3. 利用链式调用简化代码
4. 考虑时区处理需求

这个实现提供了更安全、更强大的日期处理能力，特别适合需要时区支持和不可变操作的现代应用程序。
