# MaDong Admin（Vue Vben Admin Element Plus）

基于 Vue Vben Admin `v5.7.0` 重构、面向 **MaDong 5.1+ 后端** 适配的后台前端。

- **后端适配**：接口契约与 `adminapi` 对齐（响应信封、分页、错误码、权限码、SSE），可直接对接 MaDong 5.1+ 的 Webman 后端。
- **可独立运行**：内置 Nitro Mock 服务（`tooling/mock`），无后端也能完整演示登录、菜单、CRUD、字典、代码生成等全部页面；切换到真实后端只需改一个环境变量。
- **组件与大仓共用**：`src/components`、`src/adapter`、`src/core` 等与 `madong-multi-vue` 大仓版本保持同一套组件与封装，升级/移植成本低。

运行时源码已从原 `apps`、`packages` 工作区合并到根目录 `src`，可独立更新的授权软件包放入 `lib`，构建与部署配置归入 `build`，Mock 和工程工具归入 `tooling`。

## 技术栈

- Vue 3 / Vite 8 / TypeScript / Pinia / Vue Router
- Element Plus / Tailwind CSS 4 / VXE Table / Vitest

## 快速开始

要求 Node.js `22.18+` 或 `24+`、pnpm `10+`。

```bash
pnpm install
pnpm dev
```

开发地址为 `http://localhost:5500`，路由为 hash 模式（路径带 `#`）。

### 接口模式切换

由 `.env.development` 的 `VITE_NITRO_MOCK` 控制，改后需重启 `pnpm dev`：

```bash
VITE_NITRO_MOCK=true   # 独立运行：接口走本地 Nitro Mock（端口 5320）
VITE_NITRO_MOCK=false  # 对接后端：接口代理到真实后端（http://127.0.0.1:8500/adminapi）
```

- **Mock 模式**测试账号：`admin / 123456`（Nitro Mock 独立启动，详见 `tooling/mock/README.md`）
- **真实后端**测试账号：以 MaDong 后台初始化的管理员为准

### 关键配置（`.env.development`）

| 变量 | 说明 |
|---|---|
| `VITE_NITRO_MOCK` | `true` 独立运行 / `false` 对接真实后端 |
| `VITE_ROUTER_HISTORY` | `hash` 带 `#`（推荐，免服务端回退配置）/ `history` 无 `#` |
| `VITE_GLOB_API_URL` | 接口前缀，固定 `/adminapi` |

## 目录结构

```text
.
├─ build/                  # Vite 构建配置和部署脚本
├─ lib/                    # 本地授权软件包
├─ public/                 # 静态资源
├─ tooling/mock/           # Nitro Mock 服务（独立运行的接口实现）
└─ src/
   ├─ adapter/             # Element Plus 组件、表单和表格适配
   ├─ api/                 # 应用接口
   ├─ core/                # Vben 框架内核（access/layouts/request/shared/ui 等）
   ├─ components/          # 项目级通用组件
   ├─ layouts/             # 应用布局装配
   ├─ locales/             # 应用语言包
   ├─ plugin/              # 插件前端源码（workflow 等，与后端 download 包对应）
   ├─ router/              # 应用路由
   ├─ store/               # 应用状态
   └─ views/               # 页面
```

## 常用命令

```bash
pnpm dev        # 开发
pnpm build      # 生产构建，输出 dist/，按 .env.production 生成 dist.zip
pnpm preview    # 预览构建产物
pnpm typecheck  # 类型检查
pnpm lint       # 代码规范检查
pnpm test:unit  # 单元测试
```

## 项目文档

- [文档索引](./docs/README.md)
- [架构设计](./docs/architecture.md)
- [Mock 服务说明](./tooling/mock/README.md)

## 来源

本项目基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) `v5.7.0`，遵循原项目 MIT License。
