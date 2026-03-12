#!/bin/bash
set -e
set -u

# Функция создания базы и выдачи прав
function create_database() {
    local database=$1
    echo "Создаем базу данных: $database"
    # Подключаемся к Postgres от лица суперпользователя и выполняем SQL
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE DATABASE "$database";
        GRANT ALL PRIVILEGES ON DATABASE "$database" TO "$POSTGRES_USER";
EOSQL
}

# Проверяем, задана ли переменная со списком баз
if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Запрошено создание дополнительных баз: $POSTGRES_MULTIPLE_DATABASES"
    # Разбиваем строку по запятым и создаем каждую базу
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db
    done
    echo "Дополнительные базы успешно созданы!"
fi