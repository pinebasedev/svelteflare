import { browser } from '$app/environment';
import { setMode } from 'mode-watcher';

const LS_KEY = 'sf:prefs';

export type ColorMode = 'light' | 'dark' | 'system';

export type Preferences = {
  colorMode: ColorMode;
};

const createDefaultPrefs = (): Preferences => ({
  colorMode: 'system'
});

class SettingsManager {
  private static instance: SettingsManager;

  prefs = $state<Preferences>(createDefaultPrefs());

  private constructor() {
    if (browser) {
      this.loadFromLocalStorage();
      this.applyColorMode();
    }
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Preferences>;
      this.prefs = { ...this.prefs, ...parsed };
    } catch {
      /* empty */
    }
  }

  private saveToLocalStorage() {
    if (!browser) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.prefs));
    } catch {
      /* empty */
    }
  }

  private persist() {
    this.saveToLocalStorage();
  }

  private applyColorMode() {
    setMode(this.prefs.colorMode);
  }

  setColorMode(mode: ColorMode) {
    this.prefs = { ...this.prefs, colorMode: mode };
    this.applyColorMode();
    this.persist();
  }

  resetPrefs() {
    this.prefs = createDefaultPrefs();
    this.applyColorMode();
    if (!browser) return;
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* empty */
    }
  }
}

export const settings = SettingsManager.getInstance();
