# 开发指南

## 环境要求

- Node.js `22.18+` 或 `24+`
- pnpm `10+`

建议使用根目录 `.node-version` 和 `packageManager` 字段约束本地环境。

## 安装与启动

```bash
pnpm install
pnpm dev
```

默认服务：

| 服务       | 地址                        |
| ---------- | --------------------------- |
| 前端       | `http://localhost:5777`     |
| Nitro Mock | `http://localhost:5321/api` |

本地测试账号：

```text
账号：vben
密码：123456
```

## 常用命令

| 命令             | 用途                                |
| ---------------- | ----------------------------------- |
| `pnpm dev`       | 启动前端和 Nitro Mock               |
| `pnpm typecheck` | 执行 Vue 和 TypeScript 类型检查     |
| `pnpm test:unit` | 运行 Vitest 单元测试                |
| `pnpm lint`      | 执行格式、Oxlint、ESLint 和样式检查 |
| `pnpm build`     | 生产构建并生成压缩包                |
| `pnpm preview`   | 本地预览生产构建                    |

## 环境配置

根目录环境文件：

- `.env`：公共配置。
- `.env.development`：开发环境配置。
- `.env.production`：生产环境配置。
- `.env.analyze`：构建分析配置。

敏感信息应放入未提交的 `.env.local` 或 `.env.*.local`，不要写入已跟踪环境文件。

## Workspace 说明

当前仓库只有一个运行时应用。`pnpm-workspace.yaml` 仅用于维护 `build` 和 `tooling` 下的工程工具包，不代表多应用架构。

新增业务运行时依赖时：

1. 直接添加到根 `package.json`。
2. 不使用运行时 `workspace:*`。
3. 源码通过 `#/*` 导入项目模块。

## 提交前检查

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
git diff --check
```

生产构建会生成 `dist/` 和 `dist.zip`，两者均为交付产物，不应作为源码提交。
