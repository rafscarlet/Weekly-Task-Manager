import { inject, Injectable } from '@angular/core';

type ElectronAssetsApi = {
  uploadImage: () => Promise<string | null>;
  listImages: () => Promise<string[]>;
  deleteImage: (filename: string) => Promise<void>;
};

declare global { 
  interface Window {
    electronAssets?: ElectronAssetsApi;
  }
}

@Injectable({
  providedIn: 'root',
})
export class IconService {

  async getIcons(): Promise<string[]> {
    if (!window.electronAssets) {
      return [];
    }
    return await window.electronAssets.listImages();
  }

  async deleteIcon(filename: string): Promise<boolean> {
    if (!window.electronAssets) {
      return false;
    }
    const deleted = await window.electronAssets.deleteImage(filename);
    return deleted ?? false;
  }

  async uploadIcon(): Promise<string | null> {
    if (!window.electronAssets) {
      return null;
    }
    const currentIcons = await this.getIcons();
    if (currentIcons.length >= 10) {
      throw new Error('Maximum icon capacity reached');
    }
    const uploadedIcon = await window.electronAssets.uploadImage();
    return uploadedIcon;
  }

}