<script lang="ts" setup>
import { RotateCw } from '#/core/design/icons/base';

const emit = defineEmits(['refresh']);

const handleRefresh = () => {
  emit('refresh');
};
</script>

<template>
  <div
    class="flex-center h-full cursor-pointer border-l border-border px-2 text-lg font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
    @click="handleRefresh"
  >
    <RotateCw class="size-4" />
  </div>
</template>
