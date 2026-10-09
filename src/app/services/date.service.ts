import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { Reminder } from '../types/all-types';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(new Date());

  readonly today = computed(() => {
    const now = this.now();
    return now
   });

  readonly currentDate = computed(() => {
    const now = this.now();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
  });

  readonly currentTime = computed(() => {
    const date = this.now();
    return [
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0')
      ].join(':');
    });

    constructor() {
      this.scheduleClockUpdate();
    }

    private scheduleClockUpdate(): void {
      const now = new Date();
      const millisecondsUntilNextMinute =
        60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());

      const timer = window.setTimeout(() => {
        this.now.set(new Date());
        this.scheduleClockUpdate();
      }, millisecondsUntilNextMinute);

      this.destroyRef.onDestroy(() => {
        window.clearTimeout(timer);
      });
    }
  
  getWeekDates(anchorDate = new Date(), showWeekends = false): Date[] {
    const date = new Date(anchorDate);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    
    const len = showWeekends ? 7 : 5;

    return Array.from({ length: len }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  calculateReminderTime(taskDate: string, taskTime: string | undefined,  reminder: Reminder): string {
    if (!taskTime) {
      return ''; 
    }
    const taskDateTime = new Date(`${taskDate}T${taskTime}:00`); 
    let reminderTime: Date;

    switch (reminder.unit) {
      case 'min':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 60_000);
        break;
      case 'h':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 60 * 60_000);
        break;
      case 'd':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 24 * 60 * 60_000);
        break;
      case 'w':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 7 * 24 * 60 * 60_000);
        break;
      default:
        throw new Error('Invalid reminder unit');
    }
    const hours = reminderTime.getHours().toString().padStart(2, '0');
    const minutes = reminderTime.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;

  }
}
