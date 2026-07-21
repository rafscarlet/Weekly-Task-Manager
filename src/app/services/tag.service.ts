import { effect, Injectable, signal } from '@angular/core';
import { TagCategory } from '../types/all-types';

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
        
        if (electronTags) {
          this._tags.set(electronTags.filter(tag => tag.id !== undefined && typeof tag.id === 'string'));
          return;
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
