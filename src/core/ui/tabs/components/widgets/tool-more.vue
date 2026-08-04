<script lang="ts" setup>
import type { DropdownMenuProps } from '#/core/ui/primitives';

import { LayoutGrid } from '#/core/design/icons/base';
import { VbenDropdownMenu } from '#/core/ui/primitives';

defineProps<DropdownMenuProps>();
</script>

<template>
  <VbenDropdownMenu :menus="menus" :modal="false">
    <div
      class="flex-center h-full cursor-pointer border-l border-border px-2 text-lg font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LayoutGrid class="size-4" />
    </div>
  </VbenDropdownMenu>
</template>
