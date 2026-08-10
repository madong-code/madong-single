# Vue Vben Admin Element Plus

基于 Vue Vben Admin `v5.7.0` 重构的 Element Plus 单应用版本。

运行时源码已从原 `apps`、`packages` 工作区合并到根目录 `src`，可独立更新的授权软件包放入 `lib`，构建与部署配置归入 `build`，Mock 和工程工具归入 `tooling`。

## 技术栈

- Vue 3
- Vite 8
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Tailwind CSS 4
- VXE Table
- Vitest

## 目录结构

```text
.
├─ build/                  # Vite 构建配置和部署脚本
├─ lib/                    # 本地授权软件包
├─ public/                 # 静态资源
├─ tooling/                # Mock、代码规范和工程工具
└─ src/
   ├─ adapter/             # Element Plus 组件、表单和表格适配
   ├─ api/                 # 应用接口
   ├─ core/                # Vben 框架内核
   │  ├─ access/           # 权限控制
   │  ├─ composables/      # 框架组合式函数
   │  ├─ design/           # 图标和全局样式
   │  ├─ layouts/          # 框架布局
   │  ├─ locales/          # 框架国际化
   │  ├─ plugins/          # ECharts、Tiptap、VXE 等第三方集成
   │  ├─ preferences/      # 框架偏好设置
   │  ├─ request/          # 请求客户端
   │  ├─ shared/           # 类型、常量和底层通用工具
   │  ├─ stores/           # 框架状态
   │  └─ ui/               # 框架 UI 组件
   ├─ layouts/             # 应用布局装配
   ├─ locales/             # 应用语言包
   ├─ router/              # 应用路由
   ├─ store/               # 应用状态
   └─ views/               # 页面
```

项目级通用组件放入 `src/components`。`src/adapter` 保持与原 `web-ele` 模板一致，Vben 框架封装归入 `src/core`。

## 依赖边界

- 应用层可以依赖 `src/core`。
- `src/core` 不得反向依赖 `src/api`、`src/components`、`src/router` 或 `src/views`。
- 应用根别名保持原模板约定：`#/*` 指向 `src/*`。
- 运行时源码不使用 `@/`、`@vben/*` 或 `@vben-core/*`。
- `lib/*` 只存放授权产物，不放 `package.json`；接入层通过 `#lib/*` 加载资源。
- 授权产物的加载、Element Plus 按需注册和主题适配放入 `src/core/plugins/*`。
- 工程工具包可以继续使用 `@vben/*` workspace 名称。

## 开发

要求 Node.js `22.18+` 或 `24+`、pnpm `10+`。

```bash
pnpm install
pnpm dev
```

开发地址为 `http://localhost:5777`。开发模式会同时启动本地 Nitro Mock，测试账号为 `vben / 123456`。

## 常用命令

```bash
pnpm typecheck
pnpm test:unit
pnpm lint
pnpm build
pnpm preview
```

生产构建输出到根目录 `dist`，并根据 `.env.production` 生成 `dist.zip`。

## 项目文档

- [文档索引](./docs/README.md)
- [架构设计](./docs/architecture.md)
- [迁移说明](./docs/migration.md)
- [开发指南](./docs/development.md)
- [故障排查](./docs/troubleshooting.md)

## 来源

本项目基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) `v5.7.0`，遵循原项目 MIT License。
