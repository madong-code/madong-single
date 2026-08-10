# 迁移说明

## 迁移基线

- 上游项目：Vue Vben Admin
- 基线版本：`v5.7.0`
- 当前形态：Element Plus 单应用仓库

## 主要变化

| 原结构                  | 当前结构                       |
| ----------------------- | ------------------------------ |
| `apps/web-ele/src`      | 根目录 `src`                   |
| 框架运行时 `packages/*` | 按职责合并到 `src/core`        |
| 本地授权软件包          | 根目录 `lib/*`                 |
| 应用级公共组件          | `src/components`               |
| Element Plus 适配       | `src/adapter`                  |
| `scripts/deploy`        | `build/deploy`                 |
| Vite 工程配置           | `build/vite`                   |
| Mock 和工程工具         | `tooling/*`                    |
| 独立文档站点            | 根目录 `docs` 下的静态工程文档 |

## 保留的兼容约定

- 保留 `src/adapter/component`、`src/adapter/form.ts` 和 `src/adapter/vxe-table.ts`。
- 保留 `#/*` 源码别名，并统一指向 `src/*`。
- 保留 Vben 表单、弹窗、抽屉、布局和偏好设置的既有调用方式。
- Mock 继续由开发命令自动启动，并通过 `/api` 代理访问。

## 移除的内容

- 多应用目录和 Playground。
- Ant Design、Naive UI 等非 Element Plus 适配代码和依赖。
- 运行时 `workspace:*` 依赖。
- `@vben/*`、`@vben-core/*` 运行时源码导入。
- Turbo 多应用任务编排和独立 VitePress 文档应用。

## 迁移后的维护原则

1. 页面和业务状态放在应用层。
2. 可跨项目复用的 Vben 框架能力放入 `src/core`。
3. 项目公共组件放入 `src/components`。
4. Element Plus 的组件差异在 `src/adapter` 处理。
5. 授权包只保存发布内容，加载和主题适配放入 `src/core/plugins`。
6. 新工程配置放入 `build` 或 `tooling`，避免增加根目录杂项。
7. `src/core` 保持 11 个能力域，不增加额外一级抽象。

## 变更检查

涉及目录或依赖调整时，至少执行：

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
```

还应检查：

- `src/core` 是否出现反向应用依赖。
- 是否重新引入 Ant Design 或旧 Vben 包导入。
- TypeScript、Vite 和 Vitest 的 `#/*`、`#lib/*` 别名是否一致。
- 根 `package.json` 是否直接声明新增 npm 运行时依赖。
- `lib/*` 是否混入应用加载、主题或框架适配代码。
- `lib/*` 是否误放 `package.json`，或被声明为根项目的 `file:` 依赖。
- Visual Form 升级后，构建日志中的 Element Plus UMD 依赖扫描是否通过。
