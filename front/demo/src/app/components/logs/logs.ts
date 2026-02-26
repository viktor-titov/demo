import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";
import { LoggerService } from '../../services/logger';

@Component({
  selector: 'app-logs',
  imports: [RouterLink],
  templateUrl: './logs.html',
  styleUrl: './logs.scss',
})
export class Logs implements OnInit {
  #logService = inject(LoggerService);

  protected logs: string = '';

  ngOnInit(): void {
    this.logs = this.#logService.geLogs();
  }

}
