<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Bell, FileText, TerminalSquare } from 'lucide-vue-next';

import { useWatermark } from '#/core/composables';
import { BookOpenText, CircleHelp, SvgGiteeIcon } from '#/core/design/icons';
import { BasicLayout, LockScreen, UserDropdown } from '#/core/layouts';
import { preferences, usePreferences } from '#/core/preferences';
import { openWindow } from '#/core/shared';
import {
  LOGIN_PATH,
} from '#/core/shared/constants';
import { useAccessStore, useUserStore } from '#/core/stores';
import { AuthenticationLoginExpiredModal } from '#/core/ui/common';
import { $t } from '#/locales';
import { useAuthStore, useNotifyStore, useTerminalStore } from '#/store';
import { WEB_LINKS } from '#/utils/constants/links';
import { buildAppUrl, buildStaticUrl } from '#/utils/url';
import LoginForm from '#/views/_core/authentication/login.vue';
import MessageDrawer from '#/views/content/message/notify/components/message-drawer.vue';
import NotepadDrawer from '#/views/content/notepad/components/notepad-drawer.vue';
import TerminalDialog from '#/views/devtools/terminal/index.vue';

const notifyStore = useNotifyStore();
const terminalStore = useTerminalStore();
const messageDrawerRef = ref<InstanceType<typeof MessageDrawer> | null>(null);
const notepadDrawerRef = ref<InstanceType<typeof NotepadDrawer> | null>(null);

function openMessageDrawer() {
  messageDrawerRef.value?.open();
}

function openNotepadDrawer() {
  notepadDrawerRef.value?.open();
}

function openTerminalDialog() {
  terminalStore.toggle(true);
}

/** 是否显示终端按钮：超级管理员 */
const showTerminalButton = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return info?.is_super === 1;
});

onMounted(() => {
  notifyStore.initPush();
});

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
  {
    handler: () => {
      openWindow(WEB_LINKS.DOCS, {
        target: '_blank',
      });
    },
    icon: BookOpenText,
    text: $t('ui.widgets.document'),
  },
  {
    handler: () => {
      openWindow(WEB_LINKS.GITEE, {
        target: '_blank',
      });
    },
    icon: SvgGiteeIcon,
    text: 'Gitee',
  },
  {
    handler: () => {
      openWindow(WEB_LINKS.ASK, {
        target: '_blank',
      });
    },
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
]);

const avatar = computed(() => {
  const src = userStore.userInfo?.avatar;
  // 头像可能是站点相对路径（/upload/...），云存储模式下需补全 CDN 域名，否则会打到前端站点域名而 404
  return src ? buildStaticUrl(src) : preferences.app.defaultAvatar;
});

// 后端返回 snake_case 字段（real_name/user_name），此处做 camelCase 兼容兜底
const userInfo = computed(() => userStore.userInfo as null | Record<string, any>);
const displayName = computed(
  () =>
    userInfo.value?.realName ||
    userInfo.value?.real_name ||
    userInfo.value?.username ||
    userInfo.value?.user_name ||
    '',
);
const userTag = computed(
  () => userInfo.value?.username || userInfo.value?.user_name || '',
);
const userEmail = computed(() => userInfo.value?.email || '');

async function handleLogout() {
  try {
    await authStore.logout(false);
  } catch {
    // 忽略错误
  }
  // 强制跳转到登录页（兜底，防止 authStore.logout 内部导航失败）
  // 经 buildAppUrl 拼上部署 base（如 /admin/），避免子目录部署下 404
  window.location.replace(buildAppUrl(LOGIN_PATH));
}

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content: content || displayName.value,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="displayName"
        :description="userEmail"
        :tag-text="userTag"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <div
        class="relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent hover:shadow-md mr-1"
        @click="openMessageDrawer"
      >
        <Bell class="size-[18px] text-foreground" />
        <span
          v-if="notifyStore.unreadCount.total > 0"
          class="absolute right-0 top-0 flex size-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
        >
          {{
            notifyStore.unreadCount.total > 99
              ? '99+'
              : notifyStore.unreadCount.total
          }}
        </span>
      </div>
      <MessageDrawer ref="messageDrawerRef" />
    </template>
    <!-- 命令终端按钮（仅超级管理员显示，排在记事本之后、暗黑开关之前） -->
    <template #header-right-118>
      <div
        v-if="showTerminalButton"
        class="hidden size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent hover:shadow-md md:flex mr-1"
        title="命令终端"
        @click="openTerminalDialog"
      >
        <TerminalSquare class="size-[18px] text-foreground" />
      </div>
      <!-- 终端弹窗仅超级管理员挂载，避免无权限时仍发起 commands/config 请求 -->
      <TerminalDialog v-if="showTerminalButton" />
    </template>

    <!-- 记事本按钮（排在设置之后、终端之前，移动端隐藏） -->
    <template #header-right-115>
      <div
        class="hidden size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent hover:shadow-md md:flex mr-1"
        title="记事本"
        @click="openNotepadDrawer"
      >
        <FileText class="size-[18px] text-foreground" />
      </div>
      <NotepadDrawer ref="notepadDrawerRef" />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
