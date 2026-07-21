import { CommonModule, formatDate } from '@angular/common';
import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DateService } from '../../services/date.service';
import { TasksService } from '../../services/tasks.service';
import { TaskCard } from '../../types/all-types';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { TagService } from '../../services/tag.service';
import { SettingsService } from '../../services/settings.service';
import { FormsModule } from '@angular/forms';
import { formatTasksForClipboard } from '../../helpers/clipboard.helper';
import { DialogService } from '../../services/dialog.service';
import { TaskDialog } from '../task-dialog/task-dialog';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { OptionsMenu } from '../options-menu/options-menu';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, TaskDialog, OverlayModule],
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
  private dialog = inject(DialogService);
  private overlay = inject(Overlay);
  private overlayRef?: OverlayRef;

  protected readonly today = new Date().toISOString().split('T')[0];
  protected readonly loadError = signal<string | null>(null);
  protected readonly editingTaskId = signal<number | null>(null);
  protected readonly deadlinePickerTaskId = signal<number | null>(null);
  protected readonly draftTask = signal<TaskCard | null>(null);
  protected readonly editTitle = signal('');
  protected readonly editDescription = signal('');
  protected readonly editTagId = signal<string | undefined>(undefined);
  protected readonly editDeadline = signal('');
  protected readonly selectedWeekDate = signal(new Date())
  protected readonly deleteDropActive = signal(false);

  protected readonly openTaskMenuId = signal<number | null>(null);
  protected readonly selectedTask = signal<TaskCard | null>(null);

  protected readonly tasks = this.tasksService.tasks;
  protected readonly tags = this.tagService.tags;
  protected readonly settings = this.settingsService.settings;

  protected readonly showCompleted = computed(() => this.settings().showCompleted);
  protected readonly showDeadlineOnCopy = computed(() => this.settings().showDeadlineOnCopy);

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  protected readonly weekDays = computed(() => this.dateService.getWeekDates(this.selectedWeekDate())
  );
  protected readonly visibleWeekContainsToday = computed(() =>
    this.weekDays().some(day => this.getDateKey(day) === this.today)
  );

  @HostListener('document:click')
  onDocumentClick() {
    this.openTaskMenuId.set(null);
  }

  constructor() {
    effect(() => {
      // console.log('Today is:', this.today);
      // console.log('tasks:', this.tasks());
      // console.log('tags:', this.tags());
      // console.log('settings:', this.settings());
    });
  }

  getTasksForDay(date: string): TaskCard[] {
    const tasks = this.tasks().filter(task => task.date === date && (this.showCompleted() || !task.completed));
    const draftTask = this.draftTask();

    return draftTask?.date === date ? [...tasks, draftTask] : tasks;
  }

  navigateWeek(direction: 'previous' | 'next'): void {
    this.selectedWeekDate.update(date => {
      const target = new Date(date);
      target.setDate(target.getDate() + (direction === 'next' ? 7 : -7));
      return target;
    });

    this.cancelEdit();
  }

  protected goToToday(): void {
    this.selectedWeekDate.set(new Date());
    this.cancelEdit();
  }

  protected getDateKey(date: string | number | Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

  toggleTaskCompleted(task: TaskCard): void {
    this.tasksService.updateTask(task.id, { completed: !task.completed });
  }


  moveTaskToWeek(task: TaskCard, direction: 'previous' | 'next'): void {
    const currentDate = new Date(task.date);
    const targetDate = new Date(currentDate);
    targetDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));

    this.tasksService.updateTask(task.id, { date: this.getDateKey(targetDate) });

    this.navigateWeek(direction);
  }


  moveTaskToDate(task: TaskCard, targetDate: string): void {
    this.tasksService.updateTask(task.id, { date: targetDate });
    this.openTaskMenuId.set(null);
  }


  toggleTaskMenu(event: MouseEvent, task: TaskCard): void {
    event.stopPropagation();

    this.closeMenu();

    const button = event.currentTarget as HTMLElement;
    const position = button.getBoundingClientRect();

    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(button)
        .withPositions([
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
            offsetY: 8
          },
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'bottom',
            offsetY: -8
          }
        ]),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    const portal = new ComponentPortal(OptionsMenu);

    const component = this.overlayRef.attach(portal);

    component.instance.task = task;

    component.instance.view.subscribe(() => {
      this.viewTask(task);
      this.closeMenu();
    });

    component.instance.edit.subscribe(() => {
      this.editFromMenu(task);
      this.closeMenu();
    });

    component.instance.previous.subscribe(() => {
      this.moveTaskToWeek(task, 'previous');
      this.closeMenu();
    });

    component.instance.next.subscribe(() => {
      this.moveTaskToWeek(task, 'next');
      this.closeMenu();
    });

    component.instance.delete.subscribe(() => {
      this.deleteFromMenu(task);
      this.closeMenu();
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeMenu();
    });
  }


  closeMenu(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }


  viewTask(task: TaskCard): void {
    this.selectedTask.set(task);
    this.openTaskMenuId.set(null);
  }


  editFromMenu(task: TaskCard): void {
    this.startEdit(task);
    this.openTaskMenuId.set(null);
  }


  async deleteFromMenu(task: TaskCard): Promise<void> {
    const confirmed = await this.dialog.open({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    this.tasksService.deleteTask(task.id);
    this.openTaskMenuId.set(null);
  }


  protected setDeadline(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editDeadline.set(input.value);
  }


  protected toggleDeadlinePicker(event: Event, taskId: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.deadlinePickerTaskId.update(openTaskId =>
      openTaskId === taskId ? null : taskId
    );
  }

  protected startEdit(task: TaskCard): void {
    this.editingTaskId.set(task.id);
    this.deadlinePickerTaskId.set(null);
    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editTagId.set(task.tagId);
    this.editDeadline.set(task.deadline ?? '');

    setTimeout(() => {
      document.getElementById(`task-${task.id}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

      document.getElementById(`task-${task.id}`)?.focus();
    },100);
  }


  saveForm(event: Event, id: number, date: string, title: string, description: string, tagId: string, deadline: string): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.editingTaskId() !== id) {
      return;
    }

    const draftTask = this.draftTask();
    const isDraftTask = draftTask?.id === id;

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    const nextTag = this.tags().find(tag => tag.id === tagId) || undefined
    const nextDeadline = deadline.trim();
    const completed = this.tasks().find(task => task.id === id)?.completed || false;

    if (!nextTitle) {
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
      tagId: nextTag?.id,
      deadline: nextDeadline || undefined
    };

    if (isDraftTask) {
      this.tasksService.addTask({ ...draftTask, ...taskChanges });
    } else {
      this.tasksService.updateTask(id, taskChanges);
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


  async onDeleteDrop(event: CdkDragDrop<string>): Promise<void> {
    const task = event.item.data as TaskCard | undefined;
    this.deleteDropActive.set(false);

    if (!task) {
      return;
    }

    const confirmed = await this.dialog.open({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete',
      danger: true
    });

    if (!confirmed) {
      return;
    }
    this.tasksService.deleteTask(task.id);
  }

  protected setDeleteDropActive(active: boolean): void {
    this.deleteDropActive.set(active);
  }

  async copyTasksToClipboard(): Promise<void> {
    const tasksJson = formatTasksForClipboard(this.tasks(), this.weekDays(), this.showDeadlineOnCopy());

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

  goToSettings(): void {
    this.cancelEdit();
    this.router.navigate(['/settings']);
  }
}
