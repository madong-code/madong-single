# 故障排查

## 开发控制台出现 ERR_ABORTED

### 现象

首次进入懒加载页面时，浏览器控制台出现 Element Plus CSS 或 Vite 预构建模块的 `net::ERR_ABORTED`，Vite 同时输出：

```text
new dependencies optimized
optimized dependencies changed. reloading
```

### 原因

`unplugin-element-plus` 会为 `El*` 命名导入追加深层样式入口。若懒加载页面中的样式没有在初始扫描阶段进入预构建，Vite 会重新优化依赖并刷新页面，旧页面尚未完成的请求会被浏览器中止。

### 当前处理

`vite.config.ts` 的 `ELEMENT_PLUS_STYLE_DEPS` 明确列出项目使用的 Element Plus 样式入口，并传给 `optimizeDeps.include`。

新增 Element Plus 组件后，如果再次出现同类日志：

1. 确认组件对应的样式目录名称。
2. 将 `element-plus/es/components/<name>/style/css` 加入预构建清单。
3. 停止重复的 Vite 进程。
4. 删除 `node_modules/.vite` 后重新执行 `pnpm dev`。

不要使用无法展开为实际入口的通配字符串代替明确依赖。

## 启动阶段发生全量刷新

Nitro 会生成 `tooling/mock/.nitro/types/tsconfig.json`。该目录已通过 `server.watch.ignored` 排除，避免 Vite 将生成文件识别为应用 TypeScript 配置变更。

修改 Mock 源码不会受此规则影响。

## Mock 请求返回 HTML

确认 Vite 代理保持 `/api` 原路径转发：

```ts
proxy: {
  '/api': {
    changeOrigin: true,
    target: 'http://localhost:5321',
    ws: true,
  },
}
```

不要对 `/api` 执行 rewrite，否则 Nitro Mock 可能命中兜底页面。

## Mock 端口被占用

默认 Mock 端口为 `5321`。启动失败时检查是否存在旧开发进程：

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 5321, 5777 }
```

关闭旧进程后只保留一个 `pnpm dev` 实例，避免多个 Vite 进程共享 `node_modules/.vite`。

## 测试无法解析源码别名

`#` 别名必须在以下文件中保持一致：

- `tsconfig.json`
- `vite.config.ts`
- `vitest.config.ts`

目标均应为根目录 `src`。

## 表单组件未注册

Vben Form 使用的 Element Plus 组件需要在 `src/adapter/component/index.ts` 注册。Textarea 使用 `ElInput` 并设置：

```ts
{
  type: 'textarea',
}
```

新增 Schema 组件时，应同时补充组件加载、样式加载、组件映射和 TypeScript Props 类型。
