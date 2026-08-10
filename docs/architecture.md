# 架构设计

## 设计目标

本项目是基于 Vue Vben Admin `v5.7.0` 重构的 Element Plus 单应用版本。根目录 `src` 是唯一运行时应用，不再保留 `apps/*`、`playground/*` 或框架运行时 `packages/*`。

核心约束：

- UI 组件库仅使用 Element Plus。
- Vben 框架能力统一收敛到 `src/core`。
- 项目级公共组件放入 `src/components`。
- 本地授权软件包只放入根目录 `lib/*`，应用接入逻辑放入 `src/core/plugins/*`。
- npm 运行时依赖直接声明在根 `package.json`，`lib/*` 授权产物不伪装成本地 npm 包。
- 源码统一通过 `#/*` 访问 `src/*`。
- 构建和部署配置归入 `build`，工程工具归入 `tooling`。

## 目录结构

```text
.
├─ build/                  # Vite 构建配置和部署脚本
├─ docs/                   # 项目工程文档
├─ lib/                    # 可独立替换或升级的本地授权软件包
├─ public/                 # 静态资源
├─ tooling/                # Mock、Lint、TSConfig 和工程工具
└─ src/
   ├─ adapter/             # Element Plus 表单、组件和表格适配
   ├─ api/                 # 应用接口
   ├─ components/          # 项目级公共组件
   ├─ core/                # Vben 框架内核
   ├─ layouts/             # 应用布局装配
   ├─ locales/             # 应用语言包
   ├─ router/              # 应用路由
   ├─ store/               # 应用状态
   └─ views/               # 页面
```

## Core 能力域

`src/core` 固定维护 11 个一级能力域：

| 目录          | 职责                                      |
| ------------- | ----------------------------------------- |
| `access`      | 权限判断、指令和访问控制                  |
| `composables` | 框架级组合式函数                          |
| `design`      | 设计资源、图标和全局样式                  |
| `layouts`     | 框架布局、导航和布局部件                  |
| `locales`     | 框架国际化能力                            |
| `plugins`     | Visual Form、ECharts、Tiptap 等第三方集成 |
| `preferences` | 主题及偏好设置                            |
| `request`     | 请求客户端和拦截器                        |
| `shared`      | 缓存、类型、常量、帮助函数和底层工具      |
| `stores`      | 框架级状态                                |
| `ui`          | 框架级 UI 能力                            |

新增框架能力应归入现有能力域，不再增加中间分组或新的一级目录。

## 依赖边界

允许的依赖方向：

```text
views / layouts / router / store / api / components
                         ↓
                      src/core
                         ↓
        Vue、通用依赖和 lib 授权软件包
```

约束：

- 应用层可以依赖 `src/core`。
- `src/core` 不得反向依赖 `src/api`、`src/components`、`src/router` 或 `src/views`。
- `src/components` 只承载项目级公共组件，不存放 Vben 框架封装。
- `src/adapter` 保持原 `web-ele` 模板的调用方式，负责应用和 Element Plus 之间的适配。
- `lib/*` 只保存软件包自身内容，不放应用生命周期、主题覆盖或框架适配代码。
- `lib/*` 不放 `package.json`，仅由 `src/core/plugins/*` 通过 `#lib/*` 资源别名加载。

## 导入约定

TypeScript、Vite 和 Vitest 中的 `#/*` 指向根 `src/*`，`#lib/*` 仅指向授权产物：

```ts
import { preferences } from '#/core/preferences';
import { useVbenForm } from '#/adapter/form';
import visualFormUmdUrl from '#lib/visual-form/designer.umd.js?url';
```

运行时源码不使用 `@/`、`@vben/*` 或 `@vben-core/*`。业务源码只使用 `#/*`； `#lib/*` 仅允许在 `src/core/plugins/*` 的授权产物接入层使用。
