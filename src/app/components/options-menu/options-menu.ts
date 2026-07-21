import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { TaskCard } from '../../types/all-types';

@Component({
  selector: 'app-options-menu',
  imports: [],
  templateUrl: './options-menu.html',
  styles: [`
.menu-option {
    width: 100%;
    padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3);
    text-align: left;
    font-size: var(--text-sm);
    display: flex;
    align-items: center;
    gap: calc(var(--spacing) * 2);
  }

  .menu-option:hover {
    background-color: rgb(var(--surface-hover));
  }

  .menu-icon {
    font-size: 15px;
    vertical-align: middle;
  }
`],
})
export class OptionsMenu {
  @Input({ required: true }) task!: TaskCard;

  @Output() view = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();  
}
