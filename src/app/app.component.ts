import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast';
import { ThemeService } from './services/theme.service';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ToastComponent, ConfirmationDialogComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private themeService = inject(ThemeService);
  
  appVersion = '';

  async ngOnInit() {
    this.appVersion = await window.electronAPI.getVersion();
  }
}