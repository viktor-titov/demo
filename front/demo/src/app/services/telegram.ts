import { Injectable } from '@angular/core';
import WebApp from '@twa-dev/sdk';

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  constructor() {
    // Теперь WebApp имеет полную типизацию всех методов и свойств
const user = WebApp.initDataUnsafe?.user;
WebApp.ready();
  }
}
