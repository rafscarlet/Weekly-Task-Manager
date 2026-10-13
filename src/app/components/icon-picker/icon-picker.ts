import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { IconService } from '../../services/icon.service';
import { DialogService } from '../../services/dialog.service';
import { ToastService } from '../../services/toast.service';
import { TagCategory } from '../../types/all-types';
import { TagService } from '../../services/tag.service';

const MAX_ICON_CAPACITY = 10; 

type IconSelection = { 
  tagId: string;
  icon: string;
}

@Component({
  selector: 'app-icon-picker',
  imports: [],
  templateUrl: './icon-picker.html',
  styleUrl: './icon-picker.css',
})
export class IconPicker {
  @Input({ required: true }) tag !: TagCategory;

  @Output() iconSelected = new EventEmitter<IconSelection>();
  @Output() closed = new EventEmitter<any>();

  private readonly iconService = inject(IconService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly tagService = inject(TagService);

  icons = signal<string[]>([]);
  maxIconCapacity = MAX_ICON_CAPACITY;
  selectedIcon: string | undefined = undefined;

  ngOnInit() {
    this.loadIcons();
    this.selectedIcon = this.tag.icon;
  }

  async loadIcons(): Promise<void> {
    try {
      const icons = await this.iconService.getIcons();
      this.icons.set(icons);
      console.log('Loaded icons:', this.icons());
    } catch (error) {
      console.error('Failed to load icons:', error);
      this.icons.set([]);
    }
  }

  selectIcon(icon: string) {
    this.selectedIcon = icon;
    this.iconSelected.emit({ tagId: this.tag.id, icon: this.selectedIcon });
    this.toastService.showSuccess(`Icon updated for tag "${this.tag.name}"`);
  }

  async deleteIcon(icon: string) {
    const confirmed = await this.dialogService.open({
      title: 'Delete Icon',
      message: `Are you sure you want to delete this icon?`,
      icon: 'delete',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    const isUsed = this.tagService.tags().some(tag => tag.icon === icon);
    if (isUsed || this.selectedIcon === icon) {
      this.toastService.showError('Icon is currently in use by a tag and cannot be deleted.');
      return;
    }

    const deleted = await this.iconService.deleteIcon(icon);
    if (deleted) {
      this.loadIcons();
      this.toastService.show('Icon deleted successfully', 'default');
    } else {
      this.toastService.showError('An error occurred while deleting the icon. :( ');
    }
  }

  async uploadIcon() {
    const uploadedIcon = await this.iconService.uploadIcon();
    if (uploadedIcon) {
      this.loadIcons();
      this.toastService.showSuccess('Icon uploaded successfully');
    } 
  }

  close() {
    this.closed.emit();
  }

}