# Фиксируем стабильную версию Python, чтобы pip скачивал готовые бинарники без компиляции
FROM python:3.12

# Установка базовых утилит
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Шаг 1: Копируем только requirements.txt из папки backend
COPY backend/requirements.txt ./backend/

# Шаг 2: Обновляем сам pip (это критично для бинарников pydantic) и ставим зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Шаг 3: Копируем весь остальной код (фронтенд и бэкенд)
COPY . .

EXPOSE 8000

# Команда запуска uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
