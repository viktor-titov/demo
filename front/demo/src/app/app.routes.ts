import { Routes } from '@angular/router';
import { Signup } from './components/signup/signup';
import { Logs } from './components/logs/logs';
import { Main } from './components/main/main';

export const routes: Routes = [
  {
    path: '',
    component: Main,
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: 'logs',
    component: Logs
  }
];
