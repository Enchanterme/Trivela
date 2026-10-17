import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getPreferredTheme,
  getStoredTheme,
  persistTheme,
  subscribeToSystemTheme,
} from './theme';

function mockMatchMedia(prefersLight) {
  const listeners = new Set();
  const query = {
    matches: prefersLight,
    addEventListener: (_event, fn) => listeners.add(fn),
    removeEventListener: (_event, fn) => listeners.delete(fn),
  };
  window.matchMedia = vi.fn(() => query);
  return {
    emit: (matches) => {
      query.matches = matches;
      listeners.forEach((fn) => fn({ matches }));
    },
    listeners,
  };
}

describe('theme persistence and system detection', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the OS preference when nothing is stored', () => {
    mockMatchMedia(true);
    expect(getStoredTheme()).toBeNull();
    expect(getPreferredTheme()).toBe('light');

    mockMatchMedia(false);
    expect(getPreferredTheme()).toBe('dark');
  });

  it('prefers a stored choice over the OS preference', () => {
    mockMatchMedia(true);
    persistTheme('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(getPreferredTheme()).toBe('dark');
  });

  it('ignores invalid stored values', () => {
    mockMatchMedia(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(getStoredTheme()).toBeNull();
    persistTheme('purple');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('purple');
  });

  it('survives unavailable storage', () => {
    mockMatchMedia(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(getPreferredTheme()).toBe('light');
    expect(() => persistTheme('dark')).not.toThrow();
  });

  it('notifies on OS preference changes and stops after unsubscribe', () => {
    const media = mockMatchMedia(false);
    const onChange = vi.fn();
    const unsubscribe = subscribeToSystemTheme(onChange);

    media.emit(true);
    expect(onChange).toHaveBeenLastCalledWith('light');
    media.emit(false);
    expect(onChange).toHaveBeenLastCalledWith('dark');

    unsubscribe();
    expect(media.listeners.size).toBe(0);
  });

  it('applyTheme sets the data attribute and color scheme', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
