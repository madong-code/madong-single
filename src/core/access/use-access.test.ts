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

    expect(useAccess().hasAccessByCodes(['system:admin:create'])).toBe(true);
  });

  it('still checks ordinary permission codes exactly', () => {
    const accessStore = useAccessStore();
    accessStore.setSuperCodes(['*', 'admin']);
    accessStore.setAccessCodes(['system:admin:read']);

    const { hasAccessByCodes } = useAccess();
    expect(hasAccessByCodes(['system:admin:read'])).toBe(true);
    expect(hasAccessByCodes(['system:admin:create'])).toBe(false);
  });
});
