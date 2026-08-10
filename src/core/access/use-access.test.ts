import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccessStore } from '#/core/stores';

import { useAccess } from './use-access';

describe('useAccess', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(undefined));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('grants every permission when a configured super code is present', () => {
    const accessStore = useAccessStore();
    accessStore.setSuperCodes(['*', 'admin']);
    accessStore.setAccessCodes(['*']);

    expect(useAccess().hasAccessByCodes(['system:user:create'])).toBe(true);
  });

  it('still checks ordinary permission codes exactly', () => {
    const accessStore = useAccessStore();
    accessStore.setSuperCodes(['*', 'admin']);
    accessStore.setAccessCodes(['system:user:read']);

    const { hasAccessByCodes } = useAccess();
    expect(hasAccessByCodes(['system:user:read'])).toBe(true);
    expect(hasAccessByCodes(['system:user:create'])).toBe(false);
  });
});
