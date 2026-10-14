import { inject, Injectable, signal } from '@angular/core';
import { TagCategory } from '../types/all-types';
import { IconService } from './icon.service';

type ElectronTagsApi = {
  loadTags: () => Promise<TagCategory[] | null>;
  saveTags: (tags: TagCategory[]) => void;
};

declare global {
  interface Window {
    electronTags?: ElectronTagsApi;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TagService {
    private readonly iconService = inject(IconService);

    private readonly _tags = signal<TagCategory[]>([]);
  
    constructor() {
      this.fetchTags();
    }

    get tags() {
      return this._tags;
    }

    async fetchTags() {
      try {
        const electronTags = await window.electronTags?.loadTags();

        if (!electronTags) {
          console.error('Electron tags API is not available');
          return;
        }

        const validTags = electronTags.filter(
          tag => tag.id !== undefined && typeof tag.id === 'string'
        );

        if (!window.electronAssets) {
          console.error('Electron assets API is not available');
          this._tags.set(validTags);
          return;
        }

        const availableIcons = new Set(await this.iconService.getIcons());
        let changed = false;

        const cleanedTags = validTags.map(tag => {
          if (tag.icon && !availableIcons.has(tag.icon)) {
            changed = true;
            return { ...tag, icon: '' };
          }
          return tag;
        });

        this._tags.set(cleanedTags);

        if (changed) {
          window.electronTags?.saveTags(cleanedTags);
        }
      } catch (error) {
        throw error;
      }
    }

    saveTags(tags: TagCategory[]): void {
      this.updateTags(() => tags);
    }

    private updateTags(updater: (tags: TagCategory[]) => TagCategory[]): void {
      this._tags.update(tags => {
        const updatedTags = updater(tags);
        window.electronTags?.saveTags(updatedTags);
        return updatedTags;
      });
    }
}
