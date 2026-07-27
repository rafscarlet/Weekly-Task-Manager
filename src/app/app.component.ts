import { Component, inject, signal } from '@angular/core';
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

  readonly releases_url = "https://github.com/rafscarlet/Weekly-Task-Manager/releases";
  readonly profile_url = "https://github.com/rafscarlet";


  appVersion = signal('');
  async ngOnInit() {
    const version = await window.electronAPI.getVersion();
    this.appVersion.set(version);
  }
}