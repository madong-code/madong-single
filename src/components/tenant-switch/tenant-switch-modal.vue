<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '#/core/ui/common';
import { useAccessStore, useUserStore } from '#/core/stores';

import { ElOption, ElSelect } from 'element-plus';

import { getUserTenantListApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'TenantSwitchModal' });

const authStore = useAuthStore();
const accessStore = useAccessStore();
const userStore = useUserStore();

/** 当前租户名称 */
const currentTenantName = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return info?.current_tenant?.name ?? '';
});

const selectedTenantId = ref<number | string>('');
const tenantOptions = ref<{ id: number | string; name: string }[]>([]);

const [Modal, modalApi] = useVbenModal({
  title: '切换租户',
  draggable: true,
  destroyOnClose: true,
  closeOnClickModal: false,
  fullscreenButton: false,
  confirmText: '切换',
  async onConfirm() {
    if (!selectedTenantId.value) return;
    modalApi.lock();
    try {
      await authStore.switchTenant(selectedTenantId.value);
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const currentId = accessStore.tenantId;
    const list = await getUserTenantListApi();
    if (!list) {
      tenantOptions.value = [];
      return;
    }
    tenantOptions.value = list.filter(
      (t) => String(t.id) !== String(currentId),
    );
    selectedTenantId.value = tenantOptions.value[0]?.id ?? '';
  },
});

defineExpose({
  open: () => {
    modalApi.open();
  },
});
</script>

<template>
  <Modal class="w-[500px]">
    <div class="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
      当前租户：<span class="font-semibold">{{ currentTenantName }}</span>
    </div>
    <div class="mb-3 text-sm text-gray-500">请选择要切换的目标租户：</div>
    <ElSelect
      v-if="tenantOptions.length > 0"
      v-model="selectedTenantId"
      class="w-full"
      placeholder="请选择租户"
      :teleported="false"
      filterable
    >
      <ElOption
        v-for="item in tenantOptions"
        :key="String(item.id)"
        :label="item.name"
        :value="item.id"
      />
    </ElSelect>
    <div v-else class="py-4 text-center text-gray-400">无可切换的租户</div>
  </Modal>
</template>
