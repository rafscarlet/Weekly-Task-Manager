import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.html',
})
export class ConfirmationDialog{
  dialog = inject(DialogService);
}
