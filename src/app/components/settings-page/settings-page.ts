import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TagService } from '../../services/tag.service';
import { SettingsService } from '../../services/settings.service';
import {FormsModule} from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private router: Router = inject(Router);
  private tagService = inject(TagService);
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);

  tags = this.tagService.tags;
  localTags = signal(structuredClone(this.tagService.tags()));
  settings = this.settingsService.settings;
  localSettings = signal(structuredClone(this.settingsService.settings()));

  constructor() {
    effect(() => {
      this.localTags.set(structuredClone(this.tagService.tags()));
      this.localSettings.set(structuredClone(this.settingsService.settings()));
    });
  }

  toggleDarkMode(value: boolean) {
    this.settingsService.updateSettings((settings) => {
      const updatedSettings = { ...settings, darkMode: value };
      return updatedSettings;
    });      

    this.localSettings.update((settings) => ({
      ...settings,
       darkMode: value}));
       
    this.themeService.applyTheme();
  }

  updateColor(event: Event, id: number) {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
    this.localTags().find(tag => tag.id === id)!.color = newColor;
  }

  updateName(event: Event, id: number) {
    const input = event.target as HTMLInputElement;
    const newName = input.value;
    this.localTags().find(tag => tag.id === id)!.name = newName;
  }

  addTag(){
    const currentTags = this.localTags();
    const newId = currentTags.length > 0 ? Math.max(...currentTags.map(tag => tag.id)) + 1 : 1;
    this.localTags.set([...currentTags, {id: newId, name: '', color: '#ff0000' }]);
  }

  deleteTag(id: number) {
    const currentTags = this.localTags();
    this.localTags.set(currentTags.filter((tag) => tag.id !== id));
  }

  saveSettings(event: Event) {
    event.preventDefault();
    this.tagService.saveTags(this.localTags());
    this.settingsService.updateSettings(() => this.localSettings());
    this.toastService.showSuccess('Settings saved successfully!'); 
    this.goBack();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
