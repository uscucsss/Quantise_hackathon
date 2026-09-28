# Базовый образ Python
FROM python:3.14

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Шаг 1: Копируем только requirements.txt из папки backend
COPY backend/requirements.txt ./backend/

# Шаг 2: Устанавливаем зависимости прямо из этой папки
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Шаг 3: Копируем весь остальной код (фронтенд и бэкенд)
COPY . .

EXPOSE 8000

# Команда запуска uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
