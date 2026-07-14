import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  dialog = inject(DialogService);
}
