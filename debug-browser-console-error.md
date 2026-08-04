# Debug Session: browser-console-error

- **Status**: [OPEN]
- **Issue**: 浏览器控制台出现错误日志，预期应用启动和操作过程中无应用级 Console 错误。
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-browser-console-error.ndjson

## Reproduction Steps

1. 执行 `pnpm dev`。
2. 冷加载 `http://localhost:5777/demos/form`。
3. 冷加载 `http://localhost:5777/demos/element`。
4. 检查浏览器 Console、Network 与 Vite 终端。

## Hypotheses & Verification

| ID | Hypothesis | Likelihood | Effort | Evidence |
| --- | --- | --- | --- | --- |
| A | core 路径调整后存在运行时模块或资源解析失败 | High | Low | Rejected: 页面最终正常渲染，无 resolve/import 错误 |
| B | Mock/API 请求异常未被处理 | High | Low | Rejected: 未观察到 API 失败或 Axios/Fetch 错误 |
| C | Vue 组件属性、事件或注入不匹配 | Medium | Low | Rejected: Console 无 Vue warning 和组件栈 |
| D | Vite 依赖优化缓存或 HMR 异常 | Medium | Medium | Confirmed: 首次路由加载时依赖版本变化并中止旧请求 |
| E | 错误来自浏览器扩展而非应用 | Low | Low | Rejected: 错误来源全部是 localhost 资源 |

## Log Evidence

- Pre-fix: Vite 首次加载 `/demos/form` 后输出 `new dependencies optimized: element-plus/es/components/card/style/css` 和 `optimized dependencies changed. reloading`。
- Pre-fix: 依赖查询版本从 `5e1d8b34` 变为 `891f678c`，同时 Element Plus CSS 和预构建 CSS 模块出现 `net::ERR_ABORTED`。
- Post-fix log line 1: 25 个实际使用的 Element Plus 样式入口已作为明确的 `optimizeDeps.include` 条目上报。
- Post-fix: 从空 `node_modules/.vite` 和空 `tooling/mock/.nitro` 冷启动，未出现 `changed tsconfig file detected`、`new dependencies optimized` 或 `optimized dependencies changed. reloading`。
- Post-fix: `/demos/form` 与 `/demos/element` 均渲染成功，隔离浏览器标签 Console 为 `(none)`。

## Verification Conclusion

根因是开发态首次访问懒加载路由时发现新的 Element Plus 深层样式依赖，Vite 重新执行依赖优化并刷新页面，中止上一轮仍在加载的资源请求。通配 `optimizeDeps.include` 没有展开为明确入口，因此改为源码实际使用的 25 个样式入口；同时忽略 Nitro 生成目录的文件监听，避免生成 `tsconfig.json` 触发启动阶段全量刷新。Post-fix 运行时证据表明两类刷新均已消失，等待用户确认后清理调试插桩和会话文件。
