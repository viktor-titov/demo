import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoggerService } from '../../services/logger';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TelegramService } from '../../services/telegram';
import WebApp from '@twa-dev/sdk';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule],
  standalone: true,
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup implements OnInit {
  #logger = inject(LoggerService);
  #webapp = inject(TelegramService);

  private fb = inject(FormBuilder);
  private http = inject(HttpClient); // Понадобится для 2-го варианта

  public isSubmitting = signal(false);

  public regForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^\\+?[1-9]\\d{1,14}$')]]
  });

  ngOnInit() {
    // Сообщаем Telegram, что приложение готово к отображению
    WebApp.ready();

    // Пытаемся предзаполнить имя из данных Telegram
    const tgUser = WebApp.initDataUnsafe?.user;

    this.#logger.log(tgUser);

    if (tgUser?.first_name) {
      this.regForm.patchValue({
        name: tgUser.last_name ? `${tgUser.first_name} ${tgUser.last_name}` : tgUser.first_name
      });
    }
  }

  onSubmit(way: number) {
    if (this.regForm.invalid) {
      console.log('invalid form')
      return;
    }

    this.isSubmitting.set(true);

    const formData = this.regForm.value;

    // Здесь происходит отправка данных. Варианты описаны ниже!
    if (way = 1) {
      this.#handleDataSubmissionWayOne(formData);
    }

    if (way = 2) {
      this.#handleDataSubmissionWayTwo(formData);
    }
  }


  /**
   *
   * Вариант А: Нативный метод WebApp.sendData()
  * Вы отправляете данные обратно в чат с ботом как скрытое сообщение.
  * Как это работает: Вы вызываете метод SDK, передавая ему строку (обычно JSON).
  * Web App немедленно закрывается, а ваш бот получает обновление (update) с объектом message.web_app_data.
  *
  *
  * Критичное ограничение: Этот метод работает ТОЛЬКО если Mini App был открыт с помощью обычной клавиатурной кнопки
  *  (KeyboardButton с request_web_app). Если пользователь открыл приложение через Inline-кнопку,
  *  кнопку в меню (Menu Button) или по прямой ссылке, вызов sendData() просто выдаст ошибку в консоль и ничего не произойдет.
   */
  #handleDataSubmissionWayOne(data: any) {
    const payload = JSON.stringify(data);
    WebApp.sendData(payload);
  }

  /**
   *
   * Вариант Б: Прямой HTTP-запрос на ваш бэкенд / вебхук (Рекомендуемый)
   *
   * Поскольку Mini App — это обычное веб-приложение, вы можете отправлять данные напрямую на свой сервер с помощью Angular HttpClient.
   * Этот вариант идеален, если вы строите логику на базе стейт-машины и используете инструменты автоматизации.
   *  Вы можете отправить POST-запрос прямо на вебхук (например, в n8n или Make), где настроен воркфлоу:
   *  вебхук принимает данные регистрации, переводит пользователя в следующий статус стейт-машины и сохраняет его имя и телефон напрямую в базу данных (например, в NocoDB или Airtable).
   *
   * Как это работает: Приложение не закрывается само по себе (пока вы не вызовете WebApp.close()), что позволяет показать красивый лоадер и экран успешной регистрации.
   *
   * Преимущества: Работает при любом способе открытия Mini App. Позволяет реализовать сложную асинхронную логику.
   */
  #handleDataSubmissionWayTwo(data: any) {
    // Важно: мы передаем initData, чтобы бэкенд мог проверить подлинность запроса
    const payload = {
      userData: data,
      tgAuthData: WebApp.initData
    };

    this.http.post('https://your-webhook-url.com/register', payload).subscribe({
      next: (response) => {
        // Показываем уведомление (Native Telegram popup)
        WebApp.showAlert('Регистрация успешна!', () => {
          this.isSubmitting.set(false);
          WebApp.close(); // Закрываем приложение после успеха
        });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
        WebApp.showAlert('Произошла ошибка при отправке.');
      }
    });
  }

}
