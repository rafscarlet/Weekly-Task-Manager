import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { Config } from './components/config/config';

export const appRoutes: Routes = [
  { path: 'config', component: HomeComponent },
  { path: '', component: Config
   },
  { path: '**', redirectTo: 'config' }
];
