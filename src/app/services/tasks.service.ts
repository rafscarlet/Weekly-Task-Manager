import { Injectable, signal } from '@angular/core';

export type TaskCard = {
  id: number;
  date: string;
  title: string;
  description: string;
  completed: boolean;
  deadline?: string;
};

type ElectronTasksApi = {
  loadTasks: () => Promise<TaskCard[] | null>;
  saveTasks: (tasks: TaskCard[]) => void;
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
  private readonly _tasks = signal<TaskCard[]>([]);

  constructor() {
    this.fetchTasks();
  }

  get tasks() {
    return this._tasks;
  }

  async fetchTasks() {
    try {
      const electronTasks = await window.electronTasks?.loadTasks();

      if (electronTasks) {
        this._tasks.set(electronTasks);
        return;
      }

      const response = await fetch('data.json');

      if (!response.ok) {
        throw new Error(`Failed to load data.json (${response.status})`);
      }

      const payload = (await response.json()) as { tasks?: TaskCard[] };

      if (!payload.tasks || !Array.isArray(payload.tasks)) {
        throw new Error('data.json is missing a tasks array');
      }

      this._tasks.set(payload.tasks);
    } catch (error) {
      throw error;
    }
  }

  addTask(task: TaskCard): void {
    this.updateTasks(tasks => [...tasks, task]);
  }

  updateTask(id: number, changes: Partial<Omit<TaskCard, 'id'>>): void {
    this.updateTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, ...changes } : task
      )
    );
  }

  deleteTask(id: number): void {
    this.updateTasks(tasks => tasks.filter(task => task.id !== id));
  }

  private updateTasks(updater: (tasks: TaskCard[]) => TaskCard[]): void {
    this._tasks.update(tasks => {
      const nextTasks = updater(tasks);
      window.electronTasks?.saveTasks(nextTasks);
      return nextTasks;
    });
  }

}
