import { Injectable } from '@angular/core';
import { Reminder } from '../types/all-types';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  today = new Date();

  isToday(dateString: string): boolean {
    const date = new Date(dateString);
    return (
      date.getFullYear() === this.today.getFullYear() &&
      date.getMonth() === this.today.getMonth() &&
      date.getDate() === this.today.getDate()
    );
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

  calculateReminderTime(taskDate: string, reminder: Reminder): string {
    const taskDateTime = new Date(taskDate);
    let reminderTime: Date;

    switch (reminder.unit) {
      case 'min':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 60000);
        break;
      case 'h':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 3600000);
        break;
      case 'd':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 86400000);
        break;
      case 'w':
        reminderTime = new Date(taskDateTime.getTime() - reminder.value * 604800000);
        break;
      default:
        throw new Error('Invalid reminder unit');
    }
    return reminderTime.toISOString().split('T')[1]; // Returns in 'HH:mm' format

  }
}
