# Использован легковесный образ Python
FROM python:3.14

# Установка системных зависимостей сборщика
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Адаптивное копирование зависимостей (ищет и в корне, и в подпапках)
COPY requirements.txt* ./
COPY backend/requirements.txt* ./backend/
COPY Backend/requirements.txt* ./Backend/

# Устанавливаем зависимости из того места, где они точно нашлись
RUN if [ -f "./requirements.txt" ]; then pip install --no-cache-dir -r ./requirements.txt; \
    elif [ -f "./backend/requirements.txt" ]; then pip install --no-cache-dir -r ./backend/requirements.txt; \
    elif [ -f "./Backend/requirements.txt" ]; then pip install --no-cache-dir -r ./Backend/requirements.txt; \
    else echo "ERROR: requirements.txt не найден!" && exit 1; fi

# Копируем абсолютно весь исходный код проекта в контейнер
COPY . .

EXPOSE 8000

# Динамическая команда запуска uvicorn (проверяет точный регистр папки бэкенда)
CMD ["sh", "-c", "if [ -d './backend' ]; then uvicorn backend.main:app --host 0.0.0.0 --port 8000; else uvicorn Backend.main:app --host 0.0.0.0 --port 8000; fi"]