import { inject, Injectable } from "@angular/core";
import { Reminder, ValueLabels } from "../types/all-types";
import { TasksService } from "./tasks.service";
import { ToastService } from "./toast.service";
import { DateService } from "./date.service";

declare global {
  interface Window {
    electronNotificationAPI: {
      showNotification(
        title: string,
        body: string
      ): Promise<void>;

       setUnreadBadge(
        count: number
      ): Promise<boolean>;
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
    private readonly toastService = inject(ToastService);
    private readonly dateService = inject(DateService);

    private unreadCount = 0;

    private intervalId?: number;

    get tasks() { 
       return this.tasksService.tasks();
    }

    private async setUnreadBadge(count: number): Promise<void> {
        if (!window.electronNotificationAPI) {
            console.error('electronNotificationAPI is unavailable');
            return;
        }

        try {
            await window.electronNotificationAPI.setUnreadBadge(count);
        } catch (error) {
            console.error('Failed to update unread badge:', error);
        }
    }

    showSystemNotification(title: string, body: string): void {
        if (window.electronNotificationAPI) {
            window.electronNotificationAPI.showNotification(title, body);
        } else {
            console.warn('Electron notification API is not available.');
        }
    }

    start() { 
        if (this.intervalId) {
            return;
        }
        const now = new Date();
        // this.show('Weekly Task Manager', 'Notification service started.');
        const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        setTimeout(() => {
            this.checkReminders();
            this.intervalId = window.setInterval(() => {
                this.checkReminders();
            }, CHECK_EVERY);
        }, delay);
    }

    private checkReminders(): void { 
        const today = this.dateService.currentDate();
        const currentTime = this.dateService.currentTime();

        this.tasks.forEach(task => {
            if (
                task.date === today && 
                !task.completed &&
                task.reminderEnabled && 
                task.reminderTimes &&
                task.formattedReminders?.includes(currentTime)
            ) {
                this.showSystemNotification(
                    `${task.title} - @${task.time}` ,
                    "Pssst! There's probably something to remember about this task..."
                );
                
                this.unreadCount++;
                void this.setUnreadBadge(this.unreadCount);

                this.toastService.showNotification(
                `[${currentTime}]: ${task.title} - @${task.time}`,
                () => {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    void this.setUnreadBadge(this.unreadCount);
                }
                );
            } 
        });
    }
}