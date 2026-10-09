import { Injectable, signal } from '@angular/core';
import { ToastItem, ToastState } from '../types/all-types';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);
  private nextId = 0; 

  show(message: string, state: Exclude<ToastState, null>, durationMs: number = 1800): void {
    const id = this.nextId++; 

    this.toasts.update(toasts => [
      ...toasts, 
      { id, message, state}
    ]);

    window.setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  showSuccess(message: string, durationMs: number = 1800): void {
    this.show(message, 'success', durationMs);
  }

  showError(message: string, durationMs: number = 1800): void {
    this.show(message, 'error', durationMs);
  }

  showNotification(message: string, onOk: () => void): void {
    const id = this.nextId++; 

    this.toasts.update(toasts => [
      ...toasts, 
      {id, message, state: 'notification', action: onOk}
    ]);
  }

  remove(id: number): void {
    this.toasts.update(toasts =>
      toasts.map(toast =>
        toast.id === id ? { ...toast, fading: true } : toast
      )
    );

    window.setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(toast => toast.id !== id));
    }, 350);
  }

  clear(): void {
    this.toasts.set([]);
  }
}