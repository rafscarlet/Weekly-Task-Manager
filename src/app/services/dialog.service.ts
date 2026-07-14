import { Injectable, signal } from '@angular/core';
import { DialogOptions } from '../types/all-types';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  readonly isOpen = signal(false);
  readonly options = signal<DialogOptions | null>(null);

  private resolver?: (result: boolean) => void;

  open(options: DialogOptions): Promise<boolean> {
    this.options.set(options);
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm(){
    this.resolver?.(true);
    this.close();
  }

  cancel(){
    this.resolver?.(false);
    this.close();
  }

  private close() {
    this.isOpen.set(false);
    this.options.set(null);
    this.resolver = undefined;
  }
}
