# 弹层全屏能力分析与兼容说明

验证入口：`/system/user` 页面的「用户新增」弹窗（`formDialog.dialogType: 'drawer'`）。

本文回答三个问题：扩展前当前有无该功能、扩展时要注意什么、能否兼容早期版本。

## 1. 现状：当前有无这个功能

**结论：测试页所用的抽屉在扩展前没有全屏功能，但项目内其它弹层已有实现。**

用户新增的调用链：

```
views/system/user/schemas/index.tsx (formDialog)
  -> components/crud/crud.vue (getFormDialogOptions)
  -> components/crud/components/dialog/dialog.vue (useVbenDrawer)
  -> core/ui/popup/drawer (DrawerApi + drawer.vue)
  -> core/ui/primitives/ui/sheet (reka-ui DialogContent 自研 Sheet)
```

扩展前的全屏能力分布：

| 弹层体系 | 底层实现 | 扩展前 | 扩展后 |
| --- | --- | --- | --- |
| `core/ui/popup/modal` | reka-ui `DialogContent` | 已有 `fullscreen` / `fullscreenButton`，默认 `false` / `true` | 不改动 |
| `core/ui/popup/drawer` | reka-ui `DialogContent` + Sheet | **完全没有** | 补齐，core 默认关闭 |
| `components/crud` 表单弹窗 | 上述 Modal / Drawer | 只有 Modal 分支接了 `fullscreenButton` | Drawer 分支默认开启 |
| `components/dialog` | Element Plus `ElDialog` / `ElDrawer` | header 内置全屏按钮，但 `fullscreen` 是死字段 | 保持外观，补齐可编程控制 |

关键缺口：`fullscreenButton` 的类型定义（`components/crud/components/types.ts`）和 CRUD 配置透传（`crud.vue`）其实早已存在，但 `components/crud/components/dialog/dialog.vue` 只把它传给 `useVbenModal`，`useVbenDrawer` 分支漏接；底层 `drawer.ts` / `drawer-api.ts` / `drawer.vue` 也没有任何全屏字段。国际化键 `components.crud.action.fullscreen`（中/英）已存在但零引用。

另需注意，项目里还有 `core/ui/primitives/components/full-screen` 与顶栏 `VbenFullScreen`，那是浏览器级全屏（`@vueuse/core useFullscreen`），与弹层全屏不是同一件事。

## 2. 扩展要注意什么

1. **尺寸覆盖链**：宽度全程靠 Tailwind class 传递，没有 `width` / `size` prop，也没有 CSS 变量。链路是业务 `w-[50%]` → CRUD 默认 `w-[60%]` → `dialogClass` → `drawer.vue` 的 `cn('flex w-130 flex-col', drawerClass, ...)` → `SheetContent.vue` 的 `cn('z-popup', sheetVariants({ side }), props.class)`。全屏类必须同时压过 `w-130`、业务宽度，以及 `sheet.ts` 中 `inset-y-0 right-0 w-3/4` 等方向定位类。`cn()` 内含 tailwind-merge，**类的先后顺序与 important 变体决定胜负**，所以全屏类必须作为 `cn()` 的最后一个参数，并使用 `!` 后缀（`inset-0!`、`w-full!`、`max-h-none!` 等）。这也是不改 `sheet.ts` 全局变体、只在 `drawer.vue` 局部覆盖的原因：全局变体会影响所有 Sheet 使用方。
2. **状态优先级**：`core/composables/use-priority-value.ts` 的取值顺序是 `slots > attrs > props > state`。若把 `fullscreen` 作为静态 prop 从 CRUD 传入，`setState` 驱动的切换会被锁死；因此全屏状态只走 `DrawerApi.setState`，不作为静态 prop 传递。另外 `usePriorityValues` 遍历 `Object.keys(props)`，**新增字段必须在 `drawer.vue` 的解构里显式列出**，否则静默失效且无类型错误。
3. **移动端与方向**：`drawer.vue` 原本就对 `isMobile` 及 `placement` 为 `top` / `bottom` 施加 `w-full!` 与 `max-h-screen`。新增的 `shouldFullscreen` 不能与之冲突，且 `top` / `bottom` 方向还需额外处理高度。全屏按钮在移动端隐藏（`hidden sm:block`），因为此时抽屉本已铺满宽度。
4. **头部布局与按钮对齐**：全屏按钮应放进 `SheetHeader` 右侧的 `flex-center` 容器，与关闭按钮同处一行、同尺寸（`size-8`），由 flex 自动对齐；仅在 `header: false` 的兜底分支才使用绝对定位（`absolute top-3 right-3`）。**切勿照抄 Modal 的 `absolute top-3 right-10`**：Drawer 的关闭按钮位于 header flex 内（`px-4 py-3`、32px 图标），与 Modal 的 `DialogContent` 内置关闭按钮几何不同，硬编码数值会造成水平重叠约 8px、垂直错开 4px。该问题曾在 `/system/user` 与 `/system/menu` 同时复现（两页共用同一 Drawer 组件），修复后两个按钮均为 `32×32`、`y=12` 垂直对齐。**视觉样式必须以 close 按钮为基准**：`rounded-full` 圆形、`opacity-80`、`display:flex` 图标居中；尤其不要用 `hidden sm:block` 覆盖 `VbenIconButton` 的 `inline-flex`，否则图标不再居中、方形 hover 底也会与 close 的圆形底不一致（应写 `hidden sm:inline-flex`）。**图标字号不能与 close 相同**：lucide `Expand`/`Shrink` 图形占 viewBox 约 18/24，`X` 只占 12/24，同为 `size-4` 时全屏图标视觉大 50%；应按视觉宽度反推取 `size-3`（12px，视觉 9px）匹配 close 的 `size-4`（16px，视觉 8px）。Modal 的 `size-3.5` 对应其 24px 按钮，Drawer 不必照抄。框间距取 `mr-0.5` + `ml-0.5` 共 4px，紧凑且不过大。`core/layouts/widgets/preferences/preferences-drawer.vue` 是唯一使用 `#extra` 的抽屉，core 默认关闭全屏按钮，不会出现图标重叠。
5. **锁定态**：提交中（`submitting`）按钮禁用，避免与 `pointerDownOutside` / `escapeKeyDown` 的锁定期行为打架。
6. **弹窗层级**：`FormDialogConfig` 早已定义 `class` 与 `zIndex`，但 `crud.vue` 的 `getFormDialogOptions()` 未透传，且 `zIndex` 只给了 Modal。本次补齐透传，同时必须在 `FormDialog` 的 `formOptions` 解构中排除这两个字段，否则会流入 `useVbenForm` 产生未知 prop。嵌套场景（如 `views/system/dict/dict-item-wrap.vue` 的抽屉内再开弹窗）是重点验证对象。
7. **状态生命周期**：Modal 的 `open()` 不重置 `fullscreen`，旧版 `components/dialog` 的 `open()` 明确重置为 `false`。两套语义不一致，本次**有意保留**，避免改变 19 个旧调用点的既有体验；`destroyOnClose` / `forceMount` 也会影响重开后的状态。
8. **国际化与图标**：`core/ui/popup` 使用 `useSimpleLocale()`，无法解析业务层 `src/lang/*/components/crud.json` 的键，所以按钮照抄 Modal 只放图标（`Expand` / `Shrink`），不新增文案键。旧版继续用 iconify `ri:fullscreen-line` / `ri:fullscreen-exit-line`，视觉差异属于两套 UI 体系的既有差异。
9. **旧版兼容面**：`MyDialogProps.fullscreen` 原本是死字段（`setState` 合并进 `dialogPropsRef` 后从未被读取），`useDialog` 只转发 4 个方法；`withDefaults` 中已有注释说明 Boolean prop 未传时 Vue 解析为 `false` 而非 `undefined`，因此新增的 `fullscreenButton` **必须在 `withDefaults` 显式声明 `true`**，否则默认开启失效。`components/dialog/dialog.vue` 没有对外暴露 `<slot name="header">`，所以内置 header 不会被业务覆盖；后续若新增该 outlet，需为全屏按钮做兜底。

## 3. 能否兼容早期版本

**可以，且现有页面与调用方无需任何修改。**

依据项目已有的兼容惯例：

- 新增字段全部是**可选** prop / state，配合 `DrawerApi.defaultState` 与 `withDefaults` 兜底，缺字段的旧调用自动落到默认值。
- `crud.vue` 的 `mergedCrudSchema` 用 `??` 映射一组 `@deprecated` 旧扁平字段；`components/crud/components/dialog/dialog.vue` 的 `show()` 专为兼容旧版 `dialog-form`；`components/dialog/use-dialog.ts` 明确以稳定 API 隔离底层重构。
- `setDefaultDrawerProps()` 是现成的全局无侵入默认值注入点（当前项目内无调用点），必要时可整体切换默认值而不改任何业务代码。
- barrel 导出（`index.ts`）保持不变，`core/` 未反向依赖业务层，别名仍为 `#/*`。

### 默认策略矩阵

| 层 | `fullscreenButton` 默认 | `fullscreen` 默认 | 效果 |
| --- | --- | --- | --- |
| core `DrawerApi` | `false` | `false` | 5 个独立业务抽屉零外观变化（第 6 个调用点是 CRUD 自身） |
| CRUD `FormDialog` 抽屉 | `options.fullscreenButton !== false` | `false` | 7 个 drawer schema 零改动即可全屏 |
| 旧版 `components/dialog` | `true` | `false` | 19 个调用点保持原有全屏按钮 |
| Vben `Modal` | `true`（未改动） | `false`（未改动） | 不受影响 |

### 两套 API 语义对照

| 能力 | core Vben Drawer | 旧版 `components/dialog` |
| --- | --- | --- |
| 状态字段 | `fullscreen`（`DrawerState`） | `fullscreen`（`MyDialogProps`） |
| 按钮开关 | `fullscreenButton`，默认 `false` | `fullscreenButton`，默认 `true` |
| 读取 / 设置 | `drawerApi.useStore()` / `drawerApi.setState({ fullscreen })` | `getState()` / `setState({ fullscreen })` |
| 命令式切换 | `setState((prev) => ({ ...prev, fullscreen: !prev.fullscreen }))` | `toggleFullscreen()` |
| 全屏实现 | important 尺寸类覆盖 Sheet 定位 | `ElDialog :fullscreen`；`ElDrawer` 用 `size=100%` |
| 打开时重置 | 否（与 Modal 一致） | 是（保留既有体验） |

字段名与「可外部读写」语义已统一；底层实现与生命周期差异是有意保留的，不属于缺陷。

## 4. 验证与回归清单

### `/system/user` 验证步骤

1. 打开 `/system/user`，点击「用户新增」，确认抽屉右上角出现全屏按钮。
2. 点击放大：内容铺满可视区域，两列表单（`grid-cols-2`）与滚动条不错位；再次点击还原为 `w-[50%]`。
3. 分别验证「编辑」与「查看」：查看模式 `footer: false` 与全屏需共存，提交 / 取消 / 关闭均正常。
4. 在浏览器开发者工具确认计算样式：全屏时 `width` 与 `inset` 生效，且业务的 `w-[50%]`、`w-130`、`sheetVariants` 的 `inset-y-0 right-0 w-3/4` 均已被覆盖。

### 回归清单

**P0（改动直接命中）**

- `/system/user` 新增 / 编辑 / 查看。
- CRUD Modal 分支（其余 `formDialog` 页面）全屏按钮行为不变，4 处显式 `fullscreenButton: false` 的 Modal 页面不受影响。
- 旧版 `components/dialog` 的 19 个弹窗：内置全屏按钮仍在、`setState({ fullscreen })` 能驱动全屏、`toggleFullscreen()` 可用、4 个传 `fullscreen: false` 的插件市场弹窗初始不全屏。

**P1（高优先）**

- 其余 6 个 drawer CRUD 页面：`/web/menu`、`/system/menu`、`/system/recycle`、`/ops/crontab`、`/content/message/template`、`/app/plugin/develop`。
- 8 个 `useDialog({ dialogType: 'drawer' })` 页面，特别是 `footer: false` 与 `direction: 'rtl'` 的用例。
- `header: false` 的记事本抽屉、自定义 `#title` 的消息中心抽屉、使用 `#extra` 且窄宽度 `sm:max-w-sm` 的偏好设置抽屉（确认无图标重叠、无 `checkProps` 新增 `console.warn`）。
- 抽屉内再开弹窗的嵌套层级（`views/system/dict/dict-item-wrap.vue`），验证 `zIndex` 透传。

### 自动验证命令

在 `template/admin/` 下执行：

```
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

单元测试 `src/core/ui/popup/drawer/__tests__/drawer-api.test.ts` 已覆盖新的默认值与 `setState` 切换行为。

### 本次自动验证结果

- 弹层 API 单测 24 项全通过（drawer 13 + modal 11）。全量 `pnpm test:unit` 另有 `preferences.test.ts` 的 1 项失败，错误位于 `preferences/base/preferences.ts` 的自定义配置校验，与本次改动无关，属预存在问题。
- `pnpm build` 成功（8941 模块，14.22s）。`pnpm typecheck` 中与本次改动相关的错误为 0，剩余 12 项为仓库预存在问题（如 `protectId` 返回联合类型赋值、`grid.updateData` 参数签名、未使用变量等）。
- 本次改动的 12 个文件全部通过 `oxfmt --check` 与 ESLint；`oxlint` 仅剩 `crud.vue:321` 一处预存在的非空断言告警。全项目 `pnpm lint` 因另外 24 个预存在的格式问题在 `oxfmt --check` 阶段失败，未对这些无关文件做格式化。
- 已核对生产构建 CSS 生成了全部 8 个全屏 important 工具类，并用真实 `tailwind-merge` 模拟 `drawer.vue` 与 `SheetContent.vue` 的两次 `cn()` 合并，确认 `!important` 声明能压过业务 `w-[50%]`、`w-130` 与 `sheetVariants` 的 `inset-y-0 right-0 w-3/4`。
- 已在 IDE 内置浏览器与自动化浏览器完成联调（开发服务器 `5500`、真实后端 `8500`、`admin/123456`）：`/#/system/user` 与 `/#/system/menu` 的新增抽屉，右上角全屏与关闭按钮的计算样式完全一致：`32×32`、`y=12` 垂直对齐、`border-radius` 为圆形、`display:flex` + `align-items/justify-content: center`、`opacity 0.8`、默认透明背景且 hover 同为圆形浅灰底（`rgb(244,244,245)`），框间距 4px；图标视觉宽度 9px（全屏 `size-3`）对 8px（close 的 `size-4`），`Expand` 与 `Shrink` 一致；点击全屏后抽屉从 `x=631, width=631` 变为 `x=0, width=1262` 铺满视口，再次点击还原为原尺寸。编辑与查看与新增共用同一 `FormDialog` 及同一 `drawerApi` 实例，布局一致，仍建议按上面的 P0 清单人工复核。
