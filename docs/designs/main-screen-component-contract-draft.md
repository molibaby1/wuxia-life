# 主界面组件契约草案

## 目标

给前端实现提供稳定的主界面组件接口草案，降低设计文档到组件实现之间的翻译成本。

## 组件清单

- `TopStatusBar`
- `CurrentEventCard`
- `LifeSummaryCard`
- `CoreStatsGrid`
- `FullStatsDrawer`
- `StatsTabSection`

## `TopStatusBar`

```ts
type TopStatusBarProps = {
  name: string;
  ageLabel: string;
  dateLabel: string;
  stageTags: string[];
  resources: Array<{ key: string; label: string; value: number | string }>;
  onSave?: () => void;
};
```

约束：

- `stageTags.length <= 2`
- `resources.length <= 3`

## `CurrentEventCard`

```ts
type CurrentEventCardProps = {
  title: string;
  body: string;
  primaryActionLabel: string;
  secondaryActions: Array<{ key: string; label: string; onPress?: () => void }>;
  onPrimaryAction?: () => void;
};
```

约束：

- `primaryActionLabel` 固定推荐为 `继续`
- `secondaryActions.length <= 2`

## `LifeSummaryCard`

```ts
type LifeSummaryCardProps = {
  routeSummary: string;
  riskSummary: string;
  tendencySummary: string;
};
```

约束：

- 三项均为单行摘要

## `CoreStatsGrid`

```ts
type CoreStatsGridProps = {
  items: Array<{ key: string; label: string; value: number | string }>;
  footerActionLabel?: string;
  onFooterAction?: () => void;
};
```

约束：

- `items.length === 6`

## `FullStatsDrawer`

```ts
type FullStatsDrawerProps = {
  open: boolean;
  activeTab: string;
  tabs: Array<{
    key: string;
    label: string;
    items: Array<{
      key: string;
      label: string;
      value: number | string;
      desc?: string;
    }>;
  }>;
  onClose?: () => void;
  onTabChange?: (tabKey: string) => void;
};
```

## `StatsTabSection`

```ts
type StatsTabSectionProps = {
  label: string;
  items: Array<{
    key: string;
    label: string;
    value: number | string;
    desc?: string;
  }>;
};
```

## 统一约束

- 首页摘要组件不得接收长说明文本
- 完整属性组件允许描述字段，但一项最多一句
- 组件名、字段名优先复用字段字典中的命名
