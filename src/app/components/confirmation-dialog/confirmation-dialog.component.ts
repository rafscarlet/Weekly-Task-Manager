import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  dialog = inject(DialogService);
}
