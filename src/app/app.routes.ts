import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SettingsPage } from './components/settings-page/settings-page';

export const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'settings', component: SettingsPage
   },
  { path: '**', redirectTo: 'home' }
];
