import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TagService } from '../../services/tag.service';
import { SettingsService } from '../../services/settings.service';
import {FormsModule} from '@angular/forms';
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

  tags = this.tagService.tags;
  settings = this.settingsService.settings;

  updateColor(event: Event, id: number) {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
    this.tags().find(tag => tag.id === id)!.color = newColor;
  }

  updateName(event: Event, id: number) {
    const input = event.target as HTMLInputElement;
    const newName = input.value;
    this.tags().find(tag => tag.id === id)!.name = newName;
  }

  addTag(){
    const currentTags = this.tagService.tags();
    const newId = currentTags.length > 0 ? Math.max(...currentTags.map(tag => tag.id)) + 1 : 1;
    this.tags.set([...currentTags, {id: newId, name: '', color: '#ff0000' }]);
  }

  deleteTag(id: number) {
    const currentTags = this.tagService.tags();
    this.tags.set(currentTags.filter((tag) => tag.id !== id));
  
  }

  saveSettings(event: Event) {
    event.preventDefault();
    this.tagService.saveTags(this.tags());
    this.settingsService.updateSettings((settings) => settings);
    this.toastService.showSuccess('Settings saved successfully!');
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
