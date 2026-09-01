import { Component, Input, Output, EventEmitter, inject, signal, effect, ViewChild, ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagCategory, TaskCard } from '../../types/all-types';
import { TasksService } from '../../services/tasks.service';
import { TagService } from '../../services/tag.service';
import { FormsModule } from '@angular/forms';


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

  private tasksService: TasksService = inject(TasksService);
  private tagService: TagService = inject(TagService)

  protected readonly draftTask = signal<TaskCard | null>(null);
  protected readonly editTitle = signal('');
  protected readonly editDescription = signal('');
  protected readonly editTagId = signal<string | undefined>(undefined);
  protected readonly editDeadline = signal('');
  protected readonly selectedTag = signal<TagCategory | undefined>(undefined);

  protected readonly tasks = this.tasksService.tasks;
  protected readonly tags = this.tagService.tags;

  constructor() {
    effect(() => {
      if (this.action === 'edit' || this.action === 'create') {
        this.draftTask.set(this.task);
        this.editTitle.set(this.task.title);
        this.editDescription.set(this.task.description);
        this.editTagId.set(this.task.tagId);
        this.editDeadline.set(this.task.deadline ?? '');
      }
    });

    effect(() => {
        this.selectedTag.set(this.tags().find(tag => tag.id === this.editTagId()));
    })
  }

  ngAfterViewInit() {
    if (this.action === 'edit' || this.action === 'create'){
      this.titleInput.nativeElement.focus();
    }
  }

  saveForm(event: Event, date: string, title: string, description: string, tagId: string, deadline: string): void {
    event.preventDefault();
    event.stopPropagation();

    const draftTask = this.draftTask();
    const isDraftTask = draftTask?.id === this.task.id;

    const nextTitle = title.trim();
    const nextDescription = description.trim();
    let  nextTag =this.tags().find(tag => tag.id === tagId) ?? undefined;
    const nextDeadline = deadline.trim() || undefined;
    const completed = this.tasks().find(task => task.id === this.task.id)?.completed || false;

    const taskChanges = {
      date,
      title: nextTitle || `Task #${this.task.id}`,
      description: nextDescription,
      completed,
      tag: nextTag,
      tagId: nextTag?.id ?? tagId,
      deadline: nextDeadline
    };

    if (isDraftTask && this.action === 'create') {
      this.tasksService.addTask({ ...draftTask, ...taskChanges });
    } else {
      this.tasksService.updateTask(this.task.id, taskChanges);
    }

    this.cancelEdit();
  }

  protected cancelEdit(): void {
    this.draftTask.set(null);
    this.editTitle.set('');
    this.editDescription.set('');
    this.editTagId.set(undefined);
    this.editDeadline.set('');
    
    this.close();
  }

  protected setDeadline(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editDeadline.set(input.value);
  }

  protected toggleDeadlinePicker(event: Event, taskId: number): void {
    event.preventDefault();
    event.stopPropagation();
  }


  close() {
    this.closed.emit();
  }
}
