# === Этап 1: Сборка (Build) ===
FROM node:24-alpine AS build

# Задаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем весь исходный код
COPY . .

# Собираем production-версию приложения
RUN npm run build --configuration=production

# === Этап 2: Раздача (Serve) ===
FROM nginx:alpine

# Копируем наш кастомный конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы из первого этапа
# ВНИМАНИЕ: Замените "your-app-name" на имя вашего проекта (проверьте путь в папке dist после локальной сборки).
# В новых версиях Angular (17+) путь часто заканчивается на /browser.
COPY --from=build /app/dist/demo/browser /usr/share/nginx/html

# Открываем 80 порт
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
