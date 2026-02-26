import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  #buffer: string = '\n';

  constructor() {
    this.#log('start')
  }

  log(...args:any[]): void {
    let acc = '';
    const add = (v: any) => acc += `${v} `

    for (const v of args) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        add(v);
      }

      if (typeof v === 'object') {
        add(JSON.stringify(v));
      }
    }

    return this.#log(acc);
  }

  geLogs(): string {
    return this.#buffer;
  }

  #log(value: string): void {
    const timestamp = new Date();

    this.#buffer += `${(timestamp.toISOString())}: ${value} \n`
  }
}
