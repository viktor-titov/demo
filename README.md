# Pachamama. Server side.

Проект представляет собой контейнеризированную микросервисную инфраструктуру. Она объединяет в себе инструменты для автоматизации бизнес-процессов, управления базами данных без написания кода (no-code), надежного хранения информации и маршрутизации трафика.

## Описание системы и архитектура компонентов

Проект построен на базе Docker и состоит из нескольких взаимосвязанных компонентов. Каждый сервис выполняет свою строгую функцию:

* **Front (`pachamama-front`)**: Пользовательский веб-интерфейс приложения. Отвечает за взаимодействие с конечным клиентом.
* **Nginx Proxy Manager (`pachamama-npm`)**: [Официальная документация](https://nginxproxymanager.com/). Шлюз и обратный прокси-сервер. Принимает все внешние запросы и направляет их к нужному контейнеру. Также автоматически управляет SSL-сертификатами (Let's Encrypt) для безопасного HTTPS-соединения.
* **n8n (`pachamama-n8n`)**: [Официальная документация](https://docs.n8n.io/). Ядро автоматизации. Позволяет визуально связывать различные API, базы данных и сервисы в единые сценарии (воркфлоу).
* **NocoDB (`pachamama-nocodb`)** и **Baserow (`pachamama-baserow`)**: [Документация NocoDB](https://docs.nocodb.com/) | [Документация Baserow](https://baserow.io/docs/index). No-code платформы для работы с базами данных. Они превращают классическую реляционную базу данных в удобный интерфейс, похожий на смарт-таблицы (аналог Airtable), что позволяет управлять данными без SQL-запросов.
* **PostgreSQL (`pachamama-postgres`)**: [Официальная документация](https://www.postgresql.org/docs/). Единое надежное хранилище данных для всех сервисов. Разделено на несколько логических баз данных (через скрипт инициализации) для изоляции данных NPM, n8n, NocoDB и Baserow.
* **PgAdmin (`pachamama-pgadmin`)**: [Официальная документация](https://www.pgadmin.org/docs/). Веб-интерфейс для прямого администрирования PostgreSQL. Нужен для тонкой настройки БД, создания бэкапов и выполнения сложных SQL-запросов.

## Маршрутизация трафика

Все контейнеры проекта находятся в изолированной виртуальной сети Docker (`pachamama-network`).
Извне (из интернета) открыты только порты `80` (HTTP), `443` (HTTPS) и `81` (Панель управления шлюзом). Они проброшены исключительно в контейнер **Nginx Proxy Manager**.

**Как это работает:**

1. Пользователь вводит адрес (например, `n8n.yourdomain.com`) в браузере.
2. Запрос приходит на сервер (порт 80 или 443) и попадает в Nginx Proxy Manager.
3. NPM проверяет свои правила маршрутизации и видит, что этот домен привязан к контейнеру `pachamama-n8n` на порту `5678`.
4. NPM перенаправляет трафик по внутренней Docker-сети прямо в нужный сервис.
5. Остальные сервисы (например, сама база данных Postgres) напрямую из интернета недоступны, что обеспечивает высокий уровень безопасности.


## Установка на сервер (Ubuntu 22.04 и выше)

Для работы системы требуется Docker и плагин Docker Compose. Ниже приведена установка из официального репозитория Docker для актуальных версий Ubuntu.

**Шаг 1. Настройка репозитория Docker:**

```bash
# Обновляем индексы пакетов и устанавливаем зависимости
sudo apt-get update
sudo apt-get install ca-certificates curl

# Создаем директорию для ключей и добавляем официальный GPG-ключ Docker
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL [https://download.docker.com/linux/ubuntu/gpg](https://download.docker.com/linux/ubuntu/gpg) -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Добавляем репозиторий в источники APT
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] [https://download.docker.com/linux/ubuntu](https://download.docker.com/linux/ubuntu) \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

```

**Шаг 2. Установка Docker Engine:**

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

```

**Шаг 3. Добавление пользователя в группу docker (чтобы не писать sudo перед каждой командой):**

```bash
sudo usermod -aG docker $USER
# После этой команды необходимо выйти из системы (logout) и зайти заново!

```

## Настройка перед запуском

### Подготовка файлов

1. Скопируйте шаблон переменных окружения:

```bash
cp .env.template .env

```

2. Выдайте права на исполнение скрипту инициализации баз данных. Без этого Postgres не сможет создать нужные БД при первом запуске:

```bash
chmod +x init-multiple-dbs.sh

```

### Описание переменных окружения (`.env`)

Откройте файл `.env` и настройте значения:

| Переменная | Описание | Зачем нужна |
| --- | --- | --- |
| **POSTGRES_DB** | `pachamama` | Имя основной базы данных по умолчанию. |
| **POSTGRES_USER** | `pachamama_admin` | Главный пользователь СУБД (суперюзер). |
| **POSTGRES_PASSWORD** | `admin` | Пароль суперюзера БД. Обязательно смените на сложный! |
| **PGADMIN_DEFAULT_EMAIL** | `admin@mail.com` | Email для входа в веб-интерфейс PgAdmin. |
| **PGADMIN_DEFAULT_PASSWORD** | `admin` | Пароль для входа в веб-интерфейс PgAdmin. |
| **N8N_WEBHOOK_URL** | `http://n8n.test.com` | Внешний URL сервиса n8n. Необходим движку для генерации корректных ссылок вебхуков при интеграциях. |
| **BASEROW_PUBLIC_URL** | `http://baserow.test.com` | Внешний URL Baserow. Без точного указания публичного адреса сервис не сможет загружать статику и обрабатывать API-запросы. |
| **TZ** | `Europe/Moscow` | Часовой пояс. Гарантирует правильное время в логах, планировщиках задач (cron в n8n) и записях базы данных. |
| **DB_NPM_NAME** | `pachamama_npm_db` | БД для хранения маршрутов и сертификатов NPM. |
| **DB_N8N_NAME** | `pachamama_n8n_db` | БД для хранения сценариев, учетных данных и истории n8n. |
| **DB_NOCODB_NAME** | `pachamama_nocodb_db` | БД для метаданных интерфейса NocoDB. |
| **DB_BASEROW_NAME** | `pachamama_baserow_db` | БД для хранения табличных данных Baserow. |
| **LOG_MAX_SIZE** | `100m` | Ограничение размера одного файла логов. Защищает сервер от нехватки места на диске. |
| **LOG_MAX_FILES** | `3` | Количество хранимых архивов логов для каждого контейнера. |

*Примечание: Скрипт `init-multiple-dbs.sh` автоматически считывает `POSTGRES_MULTIPLE_DATABASES` из `docker-compose.yml` и создает нужные базы при самом первом запуске контейнера с PostgreSQL.*


## Запуск приложения на сервере

Перейдите в директорию с файлом `docker-compose.yml` и запустите инфраструктуру:

```bash
docker compose up -d

```

* Флаг `-d` запускает контейнеры в фоновом режиме (detached mode).

**Полезные команды:**

* Проверка статуса всех контейнеров: `docker compose ps`
* Просмотр логов в реальном времени: `docker compose logs -f`
* Остановка всех сервисов: `docker compose down`


## Настройки Nginx Proxy Manager (NPM)

NPM — это наш шлюз. Он управляет маршрутизацией запросов из интернета к контейнерам.

1. Откройте панель управления NPM: `http://<IP_ВАШЕГО_СЕРВЕРА>:81`
2. Данные для входа по умолчанию:
* Email: `admin@example.com`
* Пароль: `changeme`
*(Система сразу попросит обновить email и пароль).*



### Настройка Proxy Hosts

Перейдите в раздел **Hosts -> Proxy Hosts** и нажмите **Add Proxy Host**.

*Важно: В поле "Forward Hostname / IP" необходимо указывать **имя контейнера** (из docker-compose), а не IP-адрес, так как NPM обращается к ним по внутренней сети.*

Создайте записи для сервисов по таблице:

| Сервис | Описание | Domain Names (ваш домен) | Forward Hostname / IP | Forward Port | Обязательные флаги (Options) |
| --- | --- | --- | --- | --- | --- |
| **Front** | Приложение | `app.domain.com` | `pachamama-front` | `80` | Block Common Exploits |
| **n8n** | Автоматизация | `n8n.domain.com` | `pachamama-n8n` | `5678` | Block Common Exploits, **Websockets Support** |
| **NocoDB** | Smart-таблицы | `noco.domain.com` | `pachamama-nocodb` | `8080` | Block Common Exploits |
| **Baserow** | Базы данных | `base.domain.com` | `pachamama-baserow` | `80` | Block Common Exploits, **Websockets Support** |
| **PgAdmin** | Админка БД | `db.domain.com` | `pachamama-pgadmin` | `80` | Block Common Exploits |

**Настройка SSL (HTTPS):**
Для каждого домена перейдите на вкладку **SSL**, выберите "Request a new SSL Certificate", включите галочки **"Force SSL"** и **"HTTP/2 Support"**, введите свой email и сохраните. Сертификат выпустится автоматически.


## Начало работы в браузере

После настройки доменов в NPM сервисы станут доступны по вашим URL.

### 🐘 Подробная настройка PgAdmin

[PgAdmin](https://www.pgadmin.org/) не видит базу данных автоматически, подключение нужно создать вручную:

1. Перейдите по URL для PgAdmin и авторизуйтесь (данные из `.env`: `PGADMIN_DEFAULT_EMAIL` и пароль).
2. В левом меню нажмите правой кнопкой мыши на **Servers** -> **Register** -> **Server...**
3. Вкладка **General**:
* **Name**: Любое понятное имя (например, `Pachamama DB`).


4. Вкладка **Connection**:
* **Host name/address**: `postgres` *(именно так, это имя контейнера в сети pachamama-network)*
* **Port**: `5432`
* **Maintenance database**: `pachamama` *(значение POSTGRES_DB)*
* **Username**: Имя суперпользователя *(значение POSTGRES_USER)*
* **Password**: Пароль от БД *(значение POSTGRES_PASSWORD)*
* Опционально: поставьте галочку "Save password".


5. Нажмите **Save**. Теперь вы можете администрировать все созданные базы прямо в браузере.

### ⚙️ n8n

Перейдите по вашему URL для n8n. При первом входе система попросит создать аккаунт владельца (Owner). Этот аккаунт хранится в отдельной БД Postgres. После регистрации вы попадете в визуальный редактор сценариев.

### 📊 NocoDB

При первом открытии NocoDB предложит создать аккаунт суперадмина. После регистрации нажмите "Connect to external database". Введите параметры подключения, указав в качестве Host `postgres`, порт `5432` и ваши учетные данные из `.env`.

### 🗂️ Baserow

Перейдите по URL Baserow, зарегистрируйте первого пользователя. Платформа сразу переведет вас в рабочее пространство, где можно начинать создавать таблицы и связи между ними.


## Полезные ссылки

Для детальной настройки сервисов и решения специфических задач обращайтесь к официальной документации инструментов:

* **Документация Docker:** [https://docs.docker.com/](https://docs.docker.com/)
* **Документация Docker Compose:** [https://docs.docker.com/compose/](https://docs.docker.com/compose/)
* **Документация Nginx Proxy Manager:** [https://nginxproxymanager.com/guide/](https://nginxproxymanager.com/guide/)
* **Документация n8n:** [https://docs.n8n.io/](https://docs.n8n.io/)
* **Документация NocoDB:** [https://docs.nocodb.com/](https://docs.nocodb.com/)
* **Документация Baserow:** [https://baserow.io/docs/index](https://baserow.io/docs/index)
* **Документация PostgreSQL:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
* **Документация PgAdmin:** [https://www.pgadmin.org/docs/](https://www.pgadmin.org/docs/)

