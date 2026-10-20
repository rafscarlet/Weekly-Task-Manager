import { inject, Injectable, signal } from "@angular/core";
import { Reminder, ValueLabels } from "../types/all-types";
import { TasksService } from "./tasks.service";
import { ToastService } from "./toast.service";
import { DateService } from "./date.service";

declare global {
  interface Window {
    electronNotificationAPI: {
      showNotification(
        title: string,
        body: string,
        taskId: number
      ): Promise<void>;

            isNotificationsSupported(): Promise<boolean>;

       setUnreadBadge(
        count: number
      ): Promise<boolean>;

      getNotificationCheckpoint(): Promise<string | null>;
      setNotificationCheckpoint(lastCheckAt: string): void;
      onNotificationClicked(
        callback: (taskId: number) => void): () => void;
    };
  }
}

export const DEFAULT_REMINDER : Reminder = { id: 0, value: 10, unit: 'min' };
export const CHECK_EVERY = 60000; // 1 min
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
    private lastCheckAt = new Date(Date.now() - CHECK_EVERY);

    private intervalId?: number;

    readonly clickedTaskId = signal<number | null>(null);
    readonly notificationsSupported = signal<boolean | null>(null);

    constructor() {
        window.electronNotificationAPI?.onNotificationClicked((taskId: number) => {
            this.clickedTaskId.set(taskId);
        });
    }

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

    showSystemNotification(title: string, body: string, taskId: number): void {
        if (window.electronNotificationAPI) {
            window.electronNotificationAPI.showNotification(title, body, taskId);
        } else {
            console.warn('Electron notification API is not available.');
        }
    }

    async start() { 
        if (this.intervalId) {
            return;
        }

        const [checkpoint] = await Promise.all([
            window.electronNotificationAPI?.getNotificationCheckpoint().catch(() => null),
            this.tasksService.ready
        ]);

        if (checkpoint) {
            this.lastCheckAt = new Date(checkpoint);
        }
        
        this.checkReminders(true);
        this.intervalId = window.setInterval(() => {
            this.checkReminders(false);
        }, CHECK_EVERY);
    }

    private checkReminders(isStartupReplay = false): void { 
        const now = new Date();
        let notificationsAdded = false;

        this.tasks.forEach(task => {
            if (!task.completed && task.reminderEnabled && task.reminderTimes) {
                task.reminderTimes.forEach(reminder => {
                    const reminderTime = this.dateService.calculateReminderDate(
                        task.date,
                        task.time,
                        reminder
                    );

                    if (!reminderTime || reminderTime <= this.lastCheckAt || reminderTime > now) {
                        return;
                    }

                if (!isStartupReplay) {
                    this.showSystemNotification(
                        `${task.title} - @${task.time}` ,
                        "Pssst! There's probably something to remember about this task...",
                        task.id
                    );
                }
                
                this.unreadCount++;
                notificationsAdded = true;

                this.toastService.showNotification(
                `[${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}]: ${task.title} - @${task.time}`,
                () => {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    void this.setUnreadBadge(this.unreadCount);
                }
                );
                });
            }
        });

        this.lastCheckAt = now;
        window.electronNotificationAPI?.setNotificationCheckpoint(now.toISOString());

        if (notificationsAdded) {
            void this.setUnreadBadge(this.unreadCount);
        }
    }

    clearClickedTask(): void {
        this.clickedTaskId.set(null);
    }

    async checkNotificationSupport(): Promise<void> {
        const supported = await window.electronNotificationAPI?.isNotificationsSupported();
        this.notificationsSupported.set(supported ?? false);
    }
}