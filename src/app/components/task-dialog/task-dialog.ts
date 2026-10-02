import { Component, Input, Output, EventEmitter, inject, signal, effect, ViewChild, ElementRef, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reminder, TaskCard, Unit } from '../../types/all-types';
import { TasksService } from '../../services/tasks.service';
import { TagService } from '../../services/tag.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { DEFAULT_REMINDER, UNIT_LABELS } from '../../services/notification.service';

@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './task-dialog.html',
})
export class TaskDialog {
  @Input() task!: TaskCard;
  @Input() action: 'view' | 'edit' | 'create' = 'view';
  @Output() closed = new EventEmitter<void>();

  @ViewChild('title')
  titleInput!: ElementRef<HTMLInputElement>;

  highlightTitle = signal(false);
  unitLabels = UNIT_LABELS;

  private tasksService: TasksService = inject(TasksService);
  private tagService: TagService = inject(TagService);
  private toastService: ToastService = inject(ToastService);

  protected readonly today = new Date().toISOString().split('T')[0];

  protected originalTask : TaskCard | null = null; 
  protected editableTask = signal<TaskCard | null>(null);

  protected readonly tasks = this.tasksService.tasks;
  protected readonly tags = this.tagService.tags;

  selectedTag = computed(() => this.tags().find(tag => tag.id === this.editableTask()?.tagId));

  ngOnChanges(): void {
    this.highlightTitle.set(false);

    if (this.action === 'edit' || this.action === 'create') {
      this.originalTask = structuredClone(this.task);
      this.editableTask.set(structuredClone(this.task));
      return;
    }

    this.originalTask = null;
    this.editableTask.set(null);
  }

  ngAfterViewInit() {
    if ((this.action === 'edit' || this.action === 'create') && this.titleInput) {
      this.titleInput.nativeElement.focus();
    }
  }

  isOverdue(task: TaskCard | null, date: string): boolean {
    if (!task) {
      return false;
    }
    return task.deadline? 
      date >= task.deadline && 
      !task.completed && 
      (task.completedAt? task.completedAt < task.deadline : false )
    : false;
  }

  addReminder(): void {
    const editable = this.editableTask();
    if (!editable) {
      return;
    }
    const newId = (editable.reminderTimes?.reduce((max, reminder) => Math.max(max, reminder.id), -1) ?? -1) + 1 ; 
    const reminder: Reminder = { 
      id: newId, 
      value: DEFAULT_REMINDER.value, 
      unit: DEFAULT_REMINDER.unit };
    this.updateTaskField('reminderTimes', [...(editable.reminderTimes || []), reminder]);
  }

  updateReminderUnit(id: number, event:Event): void {
    const unit = (event.target as HTMLInputElement).value as Unit;
    const editable = this.editableTask();

    if(!editable){
      return; 
    }

    const reminderTimes: Reminder[] = editable.reminderTimes?.map(reminder => 
      reminder.id === id? { ...reminder, unit } : reminder)?? [];
      this.updateTaskField('reminderTimes', reminderTimes);
  }

  updateReminderValue(id: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);

    if (Number.isNaN(value)) {
      return;
    }

    const editable = this.editableTask();

    if (!editable) {
      return;
    }

    const reminderTimes: Reminder[] =
      editable.reminderTimes?.map(reminder =>
        reminder.id === id
          ? { ...reminder, value }
          : reminder
      ) ?? [];

    this.updateTaskField('reminderTimes', reminderTimes);
  }

  removeReminder(reminderId: number): void {
    const editable = this.editableTask();
    if (!editable || !editable.reminderTimes) {
      return;
    }
    const updatedReminders = editable.reminderTimes.filter(reminder => reminder.id !== reminderId);
    this.updateTaskField('reminderTimes', updatedReminders);
  }

  protected updateTaskField<K extends keyof TaskCard>(field: K, value: TaskCard[K]): void {
    this.editableTask.update( task => 
      task ? {
        ...task, 
        [field]: value
      }: null
    );
  }

  saveForm(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const editable = this.editableTask();

    if (!editable){
      return; 
    }

    const title = editable.title.trim();

    if (!title) {
      this.titleInput.nativeElement.focus();
      this.highlightTitle.set(true);
      return;
    }

    const reminders = editable.reminderTimes ?? [];
    const distinctReminders = Array.from(
      new Map(
        reminders.map(reminder => [
          `${reminder.value}-${reminder.unit}`,
          reminder
        ])
      ).values()
    );

    const taskToSave = {
      ...editable, 
      title, 
      description: editable.description.trim(),
      reminderTimes: distinctReminders
    }

    if (this.action === 'create') {
      this.tasksService.addTask({ ...taskToSave });
    } else {
      this.tasksService.updateTask(this.task.id, taskToSave);
    }

    this.clearEdit();
  }

  protected clearEdit(): void {
    this.resetEditorState();
    this.closed.emit();
  }

  private resetEditorState(): void {
    this.originalTask = null;
    this.editableTask.set(null);
    this.highlightTitle.set(false);
  }

  protected setDeadline(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editableTask.update(task => task? {...task ,deadline: input.value || undefined }: null);
  }

  clearTime(): void {
    this.editableTask.update(task => task? {...task ,time: undefined }: null);
  }

    protected setTime(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editableTask.update(task => task? {...task ,time: input.value || undefined } : null);
  }

  protected updateTag(tagId: string | null | undefined): void {
    const selectedTagId = tagId && tagId !== 'none' ? tagId : undefined;
    this.editableTask.update(task => task ? {
      ...task,
      tagId: selectedTagId,
      tag: selectedTagId
        ? this.tags().find(tag => tag.id === selectedTagId) ?? undefined
        : undefined
    } : null);
  }

  protected toggleDeadlinePicker(event: Event, taskId: number): void {
    event.preventDefault();
    event.stopPropagation();
  }

  hasUnsavedChanges(): boolean {
    const editable = this.editableTask();
    const original = this.originalTask;

    if (!editable || !original) {
      return false;
    }

    return (
      editable.title !== original.title ||
      editable.description !== original.description ||
      editable.date !== original.date ||
      editable.time !== original.time ||
      editable.deadline !== original.deadline ||
      editable.tagId !== original.tagId ||
      editable.completed !== original.completed ||
      editable.completedAt !== original.completedAt ||
      editable.reminderEnabled !== original.reminderEnabled ||
      JSON.stringify(editable.reminderTimes) !== JSON.stringify(original.reminderTimes)
    );
  }

  close(): void {
    if (!this.hasUnsavedChanges()) {
      this.toastService.showError('Careful! You have unsaved changes.');
      return;
    }
    this.closed.emit();
  }
}
