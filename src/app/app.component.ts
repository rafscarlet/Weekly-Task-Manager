import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from './components/toast/toast';
import { ThemeService } from './services/theme.service';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';


const PROFILE_URL = "https://github.com/rafscarlet";
const RELEASES_URL = "https://github.com/rafscarlet/Weekly-Task-Manager/releases";
const REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdZYM7hM0WYVtQMUQ5eDr7YO2PrpP4Ab6ykCeSMvrOhBmfsrw/viewform?usp=pp_url";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, ToastComponent, ConfirmationDialogComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private themeService = inject(ThemeService);

  readonly releases_url = RELEASES_URL;
  readonly profile_url = PROFILE_URL;

  readonly report_url = signal(REPORT_URL);


  appVersion = signal('');
  async ngOnInit() {
    const version = await window.electronAPI.getVersion();
    this.appVersion.set(version);
    this.report_url.set(`https://docs.google.com/forms/d/e/1FAIpQLSdZYM7hM0WYVtQMUQ5eDr7YO2PrpP4Ab6ykCeSMvrOhBmfsrw/viewform?usp=pp_url&entry.1350614233=${version}`);
  }
}