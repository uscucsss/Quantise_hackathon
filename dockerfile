# Использован легковесный образ Python
FROM python:3.14

# Установка системных зависимостей, если необходимы
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /lib/apt/lists/*

WORKDIR /app

# Копируем и устанавливаем зависимости бэкенда
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходный код бэкенда и фронтенда
COPY backend/ ./backend
COPY frontend/ ./frontend

EXPOSE 8000

# Запуск приложения через uvicorn (указываем путь к main)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
