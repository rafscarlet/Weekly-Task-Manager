import { effect, inject, Injectable, signal } from '@angular/core';
import { TagCategory, Task, TaskCard } from '../types/all-types';
import { ToastService } from './toast.service';
import { TagService } from './tag.service';
import { DateService } from './date.service';


type ElectronTasksApi = {
  loadTasks: () => Promise<Task[] | null>;
  saveTasks: (tasks: Task[]) => void;
};

declare global {
  interface Window {
    electronTasks?: ElectronTasksApi;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private toastService = inject(ToastService);
  private tagService = inject(TagService);
  private dateService = inject(DateService);
  private readonly _tasks = signal<TaskCard[]>([]);
  private readonly _tags = signal<TagCategory[]>([]);
  private nextTaskId = 1;

  constructor() {
    effect(() => {
      const tags = this.tagService.tags();

      this._tasks.update(tasks =>
        tasks.map(task => ({
          ...task,
          tag: tags.find(tag => tag.id === task.tagId)
        }))
      );
    });

    this.fetchTasks();
  }

  get tasks() {
    return this._tasks;
  }

  async fetchTasks() {
    try {
      const electronTasks = await window.electronTasks?.loadTasks();

      if (electronTasks) {
        this._tasks.set(this.normalizeTasks(electronTasks).map(task => ({
          ...task,
          tag: this.tagService.tags().find(tag => tag.id === task.tagId) ?? undefined,
          formattedReminders: task.reminderTimes?.map(reminder => this.dateService.calculateReminderTime(task.date, reminder) ) ?? []
        })));
      }
    } catch (error) {
      throw error;
    }
  }

  private normalizeTasks(tasks: Task[]): Task[] {
    const usedIds = new Set<number>();
    let nextId = tasks.reduce((max, task) => {
      const id = Number(task.id);
      return Number.isSafeInteger(id) && id >= 0 ? Math.max(max, id + 1) : max;
    }, 1);

    return tasks.map(task => {
      const parsedId = Number(task.id);
      let id = parsedId;

      if (!Number.isSafeInteger(id) || id < 0 || usedIds.has(id)) {
        while (usedIds.has(nextId)) {
          nextId++;
        }
        id = nextId++;
      }

      usedIds.add(id);
      return { ...task, id };
    });
  }

  createTaskId(): number {
    return (
      this._tasks().reduce(
        (max, task) => Math.max(max, task.id),
        0
      ) + 1
    );
  }

  addTask(task: TaskCard): void {
    this.updateTasks(tasks => [
      ...tasks,
      task
    ]);
    this.toastService.showSuccess('Task created!');
  }

  updateTask(id: number, changes: Partial<Omit<TaskCard, 'id'>>): void {
    this.updateTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, ...changes } : task
      )
    );
    this.toastService.showSuccess('Task updated!');
  }

  deleteTask(id: number): void {
    this.updateTasks(tasks => tasks.filter(task => task.id !== id));
  }

  private updateTasks(updater: (tasks: TaskCard[]) => TaskCard[]): void {
    const previousTasks = this._tasks();
    const nextTasks = updater(previousTasks);

    try {
      this._tasks.set(nextTasks);
      window.electronTasks?.saveTasks(
        nextTasks.map(task => this.toStoredTask(task))
      );
    } catch (error) {
      this._tasks.set(previousTasks);
      console.error('Failed to save tasks:', error);
      this.toastService.showError('Could not save task.');
    }
  }

  // Helper to convert TaskCard to Task for storage
  private toStoredTask(task: TaskCard): Task {
    const tag = task.tagId
      ? this.tagService.tags().find(candidate => candidate.id === task.tagId)
      : undefined;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      date: task.date,
      time: task.time,
      completed: task.completed,
      completedAt: task.completedAt,
      reminderEnabled: task.reminderEnabled,
      reminderTimes: task.reminderTimes,
      deadline: task.deadline,
      tagId: tag ? tag.id : undefined,
    };
  }

}
