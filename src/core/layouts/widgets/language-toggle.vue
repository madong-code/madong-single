<script setup lang="ts">
import type { SupportedLanguagesType } from '#/core/locales';

import { Languages } from '#/core/design/icons';
import { loadLocaleMessages } from '#/core/locales';
import { preferences, updatePreferences } from '#/core/preferences';
import { SUPPORT_LANGUAGES } from '#/core/shared/constants';
import { VbenDropdownRadioMenu, VbenIconButton } from '#/core/ui/primitives';

defineOptions({
  name: 'LanguageToggle',
});

async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
}
</script>

<template>
  <div>
    <VbenDropdownRadioMenu
      :menus="SUPPORT_LANGUAGES"
      :model-value="preferences.app.locale"
      @update:model-value="handleUpdate"
    >
      <VbenIconButton class="hover:animate-[shrink_0.3s_ease-in-out]">
        <Languages class="size-4 text-foreground" />
      </VbenIconButton>
    </VbenDropdownRadioMenu>
  </div>
</template>
