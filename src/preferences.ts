import { defineOverridesPreferences } from '#/core/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    accessMode: 'backend',
    enableRefreshToken: true,
  },
  /**
   * 默认 Logo（后端无配置时使用本地文件）
   * public/logo.png 会被复制到构建输出根目录
   * sourceDark 不设置时自动回退到 source
   */
  logo: {
    source: '/logo.png',
  },
  /**
   * 默认主题模式：明亮（覆盖默认 dark）
   */
  theme: {
    mode: 'light',
  },
  /**
   * 页面切换过渡默认关闭：
   * 定制布局（content.vue 的 domCached 分支 + RouteView 分组容器）下，
   * <Transition mode="out-in"> 在 SPA 首次切换到懒加载页面时 enter 阶段
   * 会永久挂起（主内容区空白），表现为导航跳转对应的模块全部不可用。
   * 关闭过渡后路由切换为直接挂载，功能优先；如需动画需先修复过渡链路。
   */
  transition: {
    enable: false,
  },
});
