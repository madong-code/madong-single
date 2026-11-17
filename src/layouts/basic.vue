<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '#/core/ui/common';
import { useWatermark } from '#/core/composables';
import { BookOpenText, CircleHelp, SvgGithubIcon } from '#/core/design/icons';
import { BasicLayout, LockScreen, UserDropdown } from '#/core/layouts';
import { preferences, usePreferences } from '#/core/preferences';
import { useAccessStore, useUserStore } from '#/core/stores';
import { openWindow } from '#/core/shared';

import { Bell, FileText, TerminalSquare } from 'lucide-vue-next';

import TenantSwitchModal from '#/components/tenant-switch/tenant-switch-modal.vue';
import { $t } from '#/locales';
import { useAuthStore, useNotifyStore, useTerminalStore } from '#/store';
import { WEB_LINKS } from '#/utils/constants/links';
import { buildStaticUrl } from '#/utils/url';
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

/** 是否显示终端按钮：非租户模式 + 超级管理员 */
const showTerminalButton = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  // 非租户模式（tenantId 为 null）且为平台超级管理员
  return accessStore.tenantId === null && info?.is_super === 1;
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

/** 当前选中的租户名称 */
const currentTenantName = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return info?.current_tenant?.name ?? '';
});

/** 租户切换弹窗 ref */
const tenantSwitchRef = ref<null | { open: () => void }>(null);

function handleSwitchTenant() {
  tenantSwitchRef.value?.open();
}

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
  // 切换租户菜单（仅平台级超管才有多租户访问权限）
  ...(accessStore.tenantId !== null &&
  (userStore.userInfo as null | Record<string, any>)?.is_platform_super
    ? [
        {
          handler: handleSwitchTenant,
          icon: 'lucide:building-2',
          text: `切换租户${currentTenantName.value ? `（${currentTenantName.value}）` : ''}`,
        },
      ]
    : []),
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
      openWindow(WEB_LINKS.GITHUB, {
        target: '_blank',
      });
    },
    icon: SvgGithubIcon,
    text: 'GitHub',
  },
  {
    handler: () => {
      openWindow(`${WEB_LINKS.GITHUB}/issues`, {
        target: '_blank',
      });
    },
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
]);

const avatar = computed(() => {
  const raw = userStore.userInfo?.avatar;
  // 头像存储的是资源 key（去域名的相对路径），必须经 buildStaticUrl 解析：
  // 公开空间拼 cdn_url、私有空间换签名直链，直接当同域路径会 404
  return raw ? buildStaticUrl(raw) : preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
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
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
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
        :text="userStore.userInfo?.realName"
        :description="
          userStore.userInfo?.email || userStore.userInfo?.username || ''
        "
        :tag-text="userStore.userInfo?.username || ''"
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
    <!-- 命令终端按钮（仅非租户模式 + 超级管理员显示） -->
    <template #header-right-60>
      <div
        v-if="showTerminalButton"
        class="hidden size-8 cursor-pointer items-center justify-center rounded-full transition-all hover:bg-accent hover:shadow-md md:flex mr-1"
        title="命令终端"
        @click="openTerminalDialog"
      >
        <TerminalSquare class="size-[18px] text-foreground" />
      </div>
      <TerminalDialog />
    </template>

    <!-- 记事本按钮（排在最后，移动端隐藏） -->
    <template #header-right-100>
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

  <!-- 租户切换弹窗（放在 BasicLayout 外面，弹窗 DOM 由 Vben Modal 管理） -->
  <TenantSwitchModal ref="tenantSwitchRef" />
</template>
