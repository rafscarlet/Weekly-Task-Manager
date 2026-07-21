import { effect, inject, Injectable, signal } from '@angular/core';
import { TagCategory, Task, TaskCard } from '../types/all-types';
import { ToastService } from './toast.service';
import { TagService } from './tag.service';


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
  private readonly _tasks = signal<TaskCard[]>([]);
  private readonly _tags = signal<TagCategory[]>([]);

  constructor() {
    effect(() => {
      const tags = this.tagService.tags();
      
      if (tags.length > 0) {
        this._tasks.update(tasks =>
          tasks.map(task => ({
            ...task,
            tag: tags.find(tag => tag.id === task.tagId),
          }))
        );
      }
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
        this._tasks.set(electronTasks);
      }
    } catch (error) {
      throw error;
    }
  }

  addTask(task: TaskCard): void {
    this.updateTasks(tasks => [
      ...tasks,
      this.toStoredTask(task)
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
    this._tasks.update(tasks => {
      const nextTasks = updater(tasks);
      window.electronTasks?.saveTasks(
        nextTasks.map(task => this.toStoredTask(task))
      );

      return nextTasks;
    });
  }

  // Helper to convert TaskCard to Task for storage
  private toStoredTask(task: TaskCard): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      date: task.date,
      completed: task.completed,
      deadline: task.deadline,
      tagId: task.tag?.id.toString()
    };
  }

}
