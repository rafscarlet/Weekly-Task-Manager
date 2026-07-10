import { CommonModule, formatDate } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DateService } from '../../services/date.service';
import { TaskCard, TasksService } from '../../services/tasks.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { TagService } from '../../services/tag.service';
import { SettingsService } from '../../services/settings.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private dateService = inject(DateService);
  private tasksService = inject(TasksService);
  private tagService = inject(TagService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  protected readonly today = new Date().toISOString().split('T')[0];
  protected readonly loadError = signal<string | null>(null);
  protected readonly editingTaskId = signal<number | null>(null);
  protected readonly deadlinePickerTaskId = signal<number | null>(null);
  protected readonly draftTask = signal<TaskCard | null>(null);
  protected readonly editTitle = signal('');
  protected readonly editDescription = signal('');
  protected readonly editTagId = signal<number | undefined>(undefined);
  protected readonly editDeadline = signal('');
  protected readonly selectedWeekDate = signal(new Date())
  protected readonly deleteDropActive = signal(false);

  protected readonly tasks = this.tasksService.tasks;
  protected readonly tags = this.tagService.tags;
  protected readonly settings = this.settingsService.settings;

  protected readonly showCompleted = computed(()=> this.settings().showCompleted);
  protected readonly showDeadlineOnCopy = computed(()=> this.settings().showDeadlineOnCopy);

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  protected readonly weekDays = computed(() => this.dateService.getWeekDates(this.selectedWeekDate())
);
  protected readonly visibleWeekContainsToday = computed(() =>
    this.weekDays().some(day => this.getDateKey(day) === this.today)
  );

  constructor() {
    effect(() => {
      // console.log('Today is:', this.today);
      // console.log('tasks:', this.tasks());
      // console.log('tags:', this.tags());
    });
  }

  getTasksForDay(date: string): TaskCard[] {
    const tasks = this.tasks().filter(task => task.date === date && (this.showCompleted() || !task.completed));
    const draftTask = this.draftTask();

    return draftTask?.date === date ? [...tasks, draftTask] : tasks;
  }

  protected previousWeek(): void {
    this.selectedWeekDate.update(date => {
      const next = new Date(date);
      next.setDate(next.getDate() - 7);
      return next;
    })
  }

  protected nextWeek(): void {
    this.selectedWeekDate.update(date => {
      const next = new Date(date);
      next.setDate(next.getDate() + 7);
      return next;
    })
  }

  protected goToToday(): void {
    this.selectedWeekDate.set(new Date());
  }

  protected getDateKey(date: string | number | Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

  onTaskDrop(event: CdkDragDrop<string>): void {
    const task = event.item.data as TaskCard | undefined;
    const targetDate = event.container.data;

    if (!task || !targetDate) {
      return;
    }

    if (task.date === targetDate) {
      return;
    }

    this.tasksService.updateTask(task.id, { date: targetDate });
  }

  protected startEdit(task: TaskCard): void {
    this.editingTaskId.set(task.id);
    this.deadlinePickerTaskId.set(null);
    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editTagId.set(task.tag?.id);
    this.editDeadline.set(task.deadline ?? '');

    setTimeout(() => {
      document.getElementById(`task-title-${task.id}`)?.focus();
    });
  }

  saveForm(event: Event, id: number, date: string, title: string, description: string, tagId: string, completed: boolean, deadline: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.commitEdit(id, date, title, description, Number(tagId), completed, deadline);
  }

  toggleTaskCompleted(task: TaskCard): void {
    this.tasksService.updateTask(task.id, { completed: !task.completed });
  }

  protected toggleDeadlinePicker(event: Event, taskId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.deadlinePickerTaskId.update(openTaskId => openTaskId === taskId ? null : taskId);
  }

  private commitEdit(id: number, date: string, title: string, description: string, tagId: number, completed: boolean, deadline: string): void {
    if (this.editingTaskId() !== id) {
      return;
    }

    const draftTask = this.draftTask();
    const isDraftTask = draftTask?.id === id;

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const nextTag = this.tags().find(tag => tag.id === tagId) || undefined
    const nextDeadline = deadline.trim();

    if (!nextTitle && !nextDescription) {
      if (!isDraftTask) {
        this.tasksService.deleteTask(id);
      }
      this.cancelEdit();
      return;
    }

    if (nextTitle && !nextDescription) {
      if (!isDraftTask) {
        this.tasksService.deleteTask(id);
      }
      this.cancelEdit();
      return;
    }

    const taskChanges = {
      date,
      title: nextTitle || `Task #${id}`,
      description: nextDescription,
      completed,
      tag: nextTag,
      deadline: nextDeadline || undefined
    };

    if (isDraftTask) {
      this.tasksService.addTask({ ...draftTask, ...taskChanges });
      this.toastService.showSuccess('Task created!');
    } else {
      this.tasksService.updateTask(id, taskChanges);
      this.toastService.showSuccess('Task saved!');
    }

    this.cancelEdit();
  }

  newTask(date: string): void {
    if (this.editingTaskId()) {
      return;
    }
    const newId = this.tasks().length > 0 ? Math.max(...this.tasks().map(t => t.id)) + 1 : 1;
    const newTask: TaskCard = {
      id: newId,
      date: date,
      title: '',
      description: '',
      completed: false
    };
    this.draftTask.set(newTask);
    this.startEdit(newTask);
  }

  protected cancelEdit(): void {
    this.editingTaskId.set(null);
    this.deadlinePickerTaskId.set(null);
    this.draftTask.set(null);
    this.editTitle.set('');
    this.editDescription.set('');
    this.editTagId.set(undefined);
    this.editDeadline.set('');
  }

  onDeleteDrop(event: CdkDragDrop<string>): void {
    const task = event.item.data as TaskCard | undefined;
    this.deleteDropActive.set(false);
    
    if (!task) {
      return;
    }

    this.tasksService.deleteTask(task.id);
  }

  protected setDeleteDropActive(active: boolean): void {
    this.deleteDropActive.set(active);
  }

  
  async copyTasksToClipboard(): Promise<void> {
    const tasksJson = this.formatTasksForClipboard();

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available in this context');
      }

      await navigator.clipboard.writeText(tasksJson);
      this.toastService.showSuccess('Tasks copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy tasks to clipboard', error);
      this.toastService.showError('Failed to copy tasks!');
    }
  }


  formatTasksForClipboard(): string {
    const weekDays = this.dateService.getWeekDates(new Date());
    const weekKeys = weekDays.map(day => formatDate(day, 'yyyy-MM-dd', 'en-US'));

    const grouped = this.tasksService.tasks()
      .filter(task => weekKeys.includes(task.date))
      .reduce((groups, task) => {
        (groups[task.date] ??=[]).push(task);
        return groups;
      }, {} as Record<string, TaskCard[]>);

    const hasAnyTasks = Object.values(grouped).some(tasks => tasks.length > 0);

    if (!hasAnyTasks) {
      return 'No tasks documented.';
    }

    const text = `Tasks for week ${formatDate(weekDays[0], 'MMMM d, yyyy', 'en-US')} to ${formatDate(weekDays[4], 'MMMM d, yyyy', 'en-US')}:\n\n`;

    const body =  weekDays.map(day => {
      const key = formatDate(day, 'yyyy-MM-dd', 'en-US');
      const tasks = grouped[key] ?? [];

      if (!tasks.length) {
        return '';
      }

      const label = formatDate(day, 'EEEE, MMMM d', 'en-US');
      const line = tasks.map(task => 
        `${task.completed? ' [✓]': '[   ]'} - ${task.tag ? '[' + task.tag.name + ']': ''} ${task.title} ${task.description ? `: ${task.description}` : ''} ${task.deadline && this.showDeadlineOnCopy() ? ` (Deadline: ${task.deadline})` : ''}`).join('\n');

      return `${label}\n${line}\n`;
    }).filter(Boolean).join('\n\n')  

  return text + body;
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

}
