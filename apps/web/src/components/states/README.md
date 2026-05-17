# States — 三态组件

| 组件 | 场景 |
|---|---|
| `LoadingState` | 数据加载中 / 表单提交中 |
| `ErrorState` | 请求失败 / 网络错误 — 支持 `onRetry` 回调 |
| `EmptyState` | 列表为空 / 搜索无结果 — 支持 `icon` / `action` 插槽 |

跨 PRD 复用约束：命名锁（禁止改名）；只用 named export；统一从 `@/components/states` 导入。
