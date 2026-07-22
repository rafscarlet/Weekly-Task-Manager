import { Component, Input, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCard } from '../../types/all-types';

@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule],
  templateUrl: './task-dialog.html',
})
export class TaskDialog {
  @Input() task!: TaskCard;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
