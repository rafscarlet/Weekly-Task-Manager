import { Injectable, signal } from '@angular/core';

export type ToastState = 'success' | 'error' | null;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly message = signal('');
  readonly state = signal<ToastState>(null);

  private toastTimer: ReturnType<typeof window.setTimeout> | null = null;

  show(message: string, state: Exclude<ToastState, null>, durationMs: number = 1800): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }

    this.message.set(message);
    this.state.set(state);

    this.toastTimer = window.setTimeout(() => {
      this.state.set(null);
      this.message.set('');
      this.toastTimer = null;
    }, durationMs);
  }

  showSuccess(message: string, durationMs: number = 1800): void {
    this.show(message, 'success', durationMs);
  }

  showError(message: string, durationMs: number = 1800): void {
    this.show(message, 'error', durationMs);
  }

  clear(): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    this.state.set(null);
    this.message.set('');
  }
}