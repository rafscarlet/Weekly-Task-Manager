import { computed, effect, inject, Injectable } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly settingService = inject(SettingsService);

  private darkMode = computed(() => this.settingService.settings().darkMode);

  constructor() {
    console.log('ThemeService initialized. Current dark mode setting:', this.darkMode());
    effect(() => {
      this.darkMode();
      this.applyTheme();
    });
  } 

  applyTheme(): void {
    if (this.isDark()) {
      this.enableDark();
    } else {
      this.enableLight();
    }
  }

  private enableDark(): void {
    document.documentElement.classList.add('dark');
  }

  private enableLight(): void {
    document.documentElement.classList.remove('dark');
  }

  isDark(): boolean {
    return this.darkMode();
  }
  
}
