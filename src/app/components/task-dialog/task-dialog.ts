import { Component, Input, Output, EventEmitter} from '@angular/core';
import { TaskCard } from '../../types/all-types';

@Component({
  selector: 'app-task-dialog',
  imports: [],
  templateUrl: './task-dialog.html',
})
export class TaskDialog {
  @Input() task!: TaskCard;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
