import { inject, Injectable } from "@angular/core";
import { Reminder, ValueLabels } from "../types/all-types";
import { TasksService } from "./tasks.service";
import { DateService } from "./date.service";

declare global {
  interface Window {
    electronNotificationAPI: {
      showNotification(
        title: string,
        body: string
      ): Promise<void>;
    };
  }
}

export const DEFAULT_REMINDER : Reminder = { id: 0, value: 10, unit: 'min' };
export const CHECK_EVERY = 60000; // 1 minute
export const UNIT_LABELS : ValueLabels[]= [
    { value: 'min', label: 'Minutes' },
    { value: 'h', label: 'Hours' },
    { value: 'd', label: 'Days' },
    { value: 'w', label: 'Weeks' }
]

@Injectable({providedIn: 'root'})
export class NotificationService {
    private readonly tasksService = inject(TasksService);
    private readonly dateService = inject(DateService);

    private intervalId?: number;

    get tasks() { 
       return this.tasksService.tasks();
    }
    
    show(title: string, body: string): void {
        if (window.electronNotificationAPI) {
            window.electronNotificationAPI.showNotification(title, body);
        } else {
            console.warn('Electron notification API is not available.');
        }
    }

    start(): void { 
        if (this.intervalId) {
            return;
        }

        this.checkReminders();

        this.intervalId = setInterval(() => {
            this.checkReminders();
        }, CHECK_EVERY); // Check every minute
    }

    private checkReminders(): void { 
        const currentDate = new Date();
        const today = [
            currentDate.getFullYear(),
            String(currentDate.getMonth() + 1).padStart(2, '0'),
            String(currentDate.getDate()).padStart(2, '0')
        ].join('-');
        const currentTime = [
            String(currentDate.getHours()).padStart(2, '0'),
            String(currentDate.getMinutes()).padStart(2, '0')
        ].join(':');

        this.tasks.forEach(task => {
            if (
                task.date === today && 
                !task.completed &&
                task.reminderEnabled && 
                task.reminderTimes &&
                task.formattedReminders?.includes(currentTime)
            ) {
                this.show('Task Reminder' , `Reminder for task: ${task.title}`);
            } 
        });
    }
}