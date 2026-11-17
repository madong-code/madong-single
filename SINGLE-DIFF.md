# template/admin 架构与适配指南

> **核心立场：不管后端是标准单体还是 SaaS，都建议什么都不删。**
> 本模板已实现"后端驱动开关 + 前端条件接入"，单体后端不提供租户能力 → 前端自动静默租户路径，零成本兼容。
> 删减带来的收益（几个文件、几十 KB 体积）远小于风险（漏删 import、断依赖、未来想扩展还要加回来）。

---

## 一、模板架构全景

```
src/
├── api/              ← 14 个 API 模块，每个独立对应一组后端路由
│   ├── request.ts    ← 统一请求客户端（鉴权/拦截器/租户条件注入）
│   ├── auth/         ← 登录/注册/找回/切换租户/站点信息
│   ├── core/         ← 基础能力：auth/menu/user/tenant-list/switch-tenant
│   ├── system/       ← 系统管理：user/role/menu/dept/post/dict/files/config
│   ├── member/       ← 会员中心
│   ├── ops/          ← 运维：crontab/gateway/log/redis/server
│   ├── devtools/     ← 在线终端/语言
│   ├── content/      ← 消息/审核/便签
│   ├── web/          ← 站点配置/友情链接/前台菜单
│   ├── app/          ← 插件开发/市场/委派
│   └── ...
├── views/            ← 页面层，每个目录对应一个后端业务模块
│   ├── app/plugin/delegation/     ← SaaS 插件托管（后端没返回菜单时根本不注册路由）
│   ├── app/plugin/market/tenant/  ← 租户侧插件市场（同上）
│   ├── member/                    ← 会员中心
│   ├── system/ops/content/web...  ← 系统/运维/内容/站点
│   └── _core/                     ← 认证/个人中心/仪表盘/Fallback
├── store/            ← 业务 store（auth/notify/terminal/site-config）
├── core/stores/      ← 框架 store（access/menu-badge/tabbar/timezone）
├── core/             ← 框架核心（request/interceptor/layouts/plugins）
├── components/       ← 通用组件 + tenant-switch/tenant-searcher（有条件入口）
└── layouts/          ← 三套布局（Basic/Auth/Iframe）
```

---

## 二、为什么不用删

模板内置了三层机制，让 SaaS 路径在单体后端上**完全静默**：

### 2.1 请求层：`request.ts` 租户 header 条件注入

```ts
if (accessStore.tenantId &&
    !config.url?.startsWith('/tenant') &&
    !config.url?.startsWith('/subscription') &&
    ...
) {
  config.headers['X-Tenant-Id'] = String(accessStore.tenantId);
}
```

- `accessStore.tenantId` 默认是 `null`
- 单体后端不返回租户列表、不触发 `setTenantId`
- `tenantId` 永远是 `null` → `if (accessStore.tenantId)` 永远不成立 → header 永不发送
- **零配置生效，不用改 request.ts 一行代码**

### 2.2 登录页：TenantSearcher 条件渲染

```ts
const tenantEnabled = ref(false);

async function fetchTenantMode() {
  try {
    const modeData = await getTenantModeFlagApi();
    tenantEnabled.value = modeData.enabled ?? false;
  } catch {
    // 单体后端大概率没这个接口 → 404 → catch → tenantEnabled 保持 false
  }
}

if (tenantEnabled.value) {
  schemas.push({ component: TenantSearcher, fieldName: 'tenant_code' });
}
```

- 后端返回 `{ enabled: false }` 或 404 → `tenantEnabled = false`
- TenantSearcher 组件不渲染
- `handleLogin` 里提交前会 `delete params.tenant_code`
- **单体登录流程零感知**

### 2.3 菜单/路由：后端驱动，前端注册

前端路由 `src/router/routes/backend.ts` 的菜单/权限项全部来自后端菜单表，而不是硬编码：

```
后端 menus 表 → 返回 JSON → generateMenus() → 动态注册路由
```

- 单体后端的菜单表里不会有 `/tenant`、`/subscription`、`/plugin/delegation` 这些入口
- 前端拿到的菜单里没有这些 path → 路由根本不注册
- 即使 views 目录里存在这些 .vue 文件，也永远不会被 `router.push` 访问到
- **不会出现在侧边栏、不会出现 404、不会触发 import**

---

## 三、模块依赖关系

### 3.1 框架核心（绝对不动）

```
core/access/           权限控制：v-access 指令 + useAccess composable
core/layouts/          BasicLayout / AuthLayout / IframeLayout
core/request/          Axios 封装：统一鉴权/刷新/错误处理
core/stores/           Pinia：accessStore / userStore / menu-badge / tabbar
core/preferences/      主题/布局偏好（localStorage 持久化）
core/locales/          i18n 加载器
core/plugins/           echarts / tiptap / vxe-table / visual-form / wangeditor
core/ui/               业务组件库：vben-form / vben-layout / vben-menu / vben-tabs
core/shared/           工具函数 + 缓存适配器
```

### 3.2 API 层与后端路由对应

| API 目录 | 对应后端路由前缀 | 单体需要？ | 说明 |
|---|---|---|---|
| `auth` | `/adminapi/auth/*` | ✅ | 登录注册 |
| `core` | `/adminapi/auth/*` | ✅ | 用户/菜单/权限/tenant-list（tenant-list 后端没就不调用） |
| `system` | `/adminapi/system/*` | ✅ | 后台管理核心 |
| `ops/log` | `/adminapi/monitor/*` | ✅ | 登录/操作日志 |
| `ops/crontab` | `/adminapi/ops/*` | ✅ | 定时任务 |
| `member` | `/adminapi/member/*` | ⚠️ | 后端没实现 404 会报业务错误提示，但不崩 |
| `ops/gateway` | `/adminapi/ops/*` | ⚠️ | 同上 |
| `plugin/delegation` | — | ❌ | 只有 SaaS 会返回菜单入口 |
| `plugin/market/tenant` | — | ❌ | 同上 |

**即使 API 文件存在但后端没实现**：用户访问不到（因为菜单不返回）。退一万步，手动输 URL 进了页面，API 调 404 → 全局 error interceptor 弹 `ElMessage.error` → 用户看到友好提示 → 不崩。

### 3.3 Store 双层架构

```
core/stores/modules/   框架 store（通用）
├── access.ts          tenantId 类型是 null | int | string，默认 null
├── user.ts
├── tabbar.ts
├── timezone.ts

store/modules/         业务 store（admin 特有）
├── auth.ts            登录/登出/站点信息 + switchTenant 方法（tenantId=null 时永不走）
├── notify.ts          消息推送，频道名用 current_tenant（tenantId=null 时走默认）
├── site-config.ts
├── terminal.ts
├── dict.ts
```

---

## 四、洁癖友好兜底（真要删才看这节）

**强烈不推荐删减**。理由见第二节三层机制。
只有在"代码洁癖强制要求无冗余文件"的场景下，才考虑删以下内容（风险自负）：

### 4.1 可安全删除的 SaaS 专属目录

| 文件/目录 | 引用点 | 删除后 |
|---|---|---|
| `src/components/tenant-switch/` | `layouts/basic.vue#L15` | 需同步改 basic.vue（见下） |
| `src/components/tenant-searcher/` | `views/_core/authentication/login.vue#L10` | 需同步改 login.vue（见下） |
| `src/views/app/plugin/delegation/` | 后端菜单不返回 → 无路由注册 | 直接删，无感 |
| `src/views/app/plugin/market/components/tenant/` | 同上 | 直接删，无感 |
| `src/lang/*/plugin/delegation.json` | 文案引用 | 删完 grep 残留引用 |
| `src/lang/*/plugin/tenant.json` | 同上 | 同上 |

### 4.2 删除 tenant-switch 后 basic.vue 要改的 5 处

```diff
- import TenantSwitchModal from '#/components/tenant-switch/tenant-switch-modal.vue';
...
- const currentTenantName = computed(() => info?.current_tenant?.name ?? '');
- const tenantSwitchRef = ref<null | { open: () => void }>(null);
- function handleSwitchTenant() { tenantSwitchRef.value?.open(); }
...
- ...(accessStore.tenantId !== null && ... ? [{ handler: handleSwitchTenant, ... }] : []),
...
- return accessStore.tenantId === null && info?.is_super === 1;
+ return info?.is_super === 1;
...
- <TenantSwitchModal ref="tenantSwitchRef" />
```

### 4.3 删除 tenant-searcher 后 login.vue 要改的 1 处

```diff
- import TenantSearcher from '#/components/tenant-searcher/index.vue';
...
- async function fetchTenantMode() { ... }
- onMounted(() => { fetchTenantMode(); });
...
- if (tenantEnabled.value) { schemas.push({ component: TenantSearcher, ... }); }
```

### 4.4 可选删除（按需）

| 模块 | 路径 | 删完效果 |
|---|---|---|
| 会员中心 | `views/member/` + `api/member/` | 后端没实现就删，业务不用也可以删 |
| 网关 | `views/ops/gateway/` + `api/ops/gateway/` | 后端无网关删 |
| 在线终端 | `views/devtools/terminal/` | 生产环境建议删（有安全风险） |
| Redis/服务器运维 | `views/ops/redis/` + `views/ops/server/` | 业务用不到删 |

---

## 五、不管是单体还是 SaaS，都不要动的

| 文件 | 理由 |
|---|---|
| `request.ts` | 租户 header 是条件注入，tenantId=null 时自动跳过，单体和 SaaS 同一份代码 |
| `store/auth.ts` | switchTenant 方法存在但 tenantId=null 时永不被调用，零副作用 |
| `core/stores/modules/access.ts` | tenantId 字段类型 `null \| int \| string`，默认 null，不影响单体 |
| `layouts/basic.vue` | tenant-switch 是**硬 import**，必须删但删完组件本体才安全；条件逻辑本身保留 |
| `.env` 配置 | 单体后端没开租户 → `tenantEnabled=false` → 全部条件分支自动跳过 |
| package.json / pnpm-workspace.yaml | 依赖是框架级的（vue/pinia/element-plus），不区分单体/SaaS |

---

## 六、快速验证清单

如果你选择**什么都不删**，用以下步骤确认单体后端零依赖：

```bash
# 1. 启动前端 dev 服务
pnpm dev

# 2. 打开 F12 Console，确认没有 TenantSearcher / TenantSwitchModal import 报错
# 3. 登录页不出现租户搜索框 → ✅ getTenantModeFlagApi 404 → tenantEnabled=false
# 4. 侧边栏菜单里没有 tenant/plugin-delegation → ✅ 后端菜单表过滤
# 5. Network 面板，任意请求不带 X-Tenant-Id → ✅ tenantId=null 条件跳过
# 6. 路由里没有 /tenant /subscription → ✅ 后端菜单没返回，前端不注册
# 7. 手动在浏览器输 /tenant/account 404 而不是白屏 → ✅ 路由没注册，Vben Layout fallback 处理
```

全通 → 什么都不用改。