import { Injectable, signal } from '@angular/core';
import { Settings } from '../types/all-types';

const DEFAULT_SETTINGS: Settings = {
  showCompleted: true,
  showDeadlineOnCopy: false,
  darkMode: false
};

type ElectronSettingsApi = {
  loadSettings: () => Promise<Settings | null>;
  saveSettings: (settings: Settings) => void;
};

declare global {
  interface Window {
    electronSettings?: ElectronSettingsApi;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private _settings = signal<Settings>(DEFAULT_SETTINGS);

  constructor() {
    this.fetchSettings();
  }

  get settings() {
    return this._settings;
  }

  async fetchSettings() {
    try {
      const electronSettings = await window.electronSettings?.loadSettings();

      if (electronSettings) {
        this._settings.set(electronSettings);
        return;
      }

    } catch (error) {
      throw error;
    } 
  }

  updateSettings(updater: (settings: Settings) => Settings): void {
    this._settings.update(settings => {
      const updatedSettings = updater(settings);
      window.electronSettings?.saveSettings(updatedSettings);
      return updatedSettings;
    });
  }

}
