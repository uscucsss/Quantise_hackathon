import os
import json
import uuid
import requests
import hashlib
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Импортируем модели и настройки БД из соседнего файла database.py
from .database import SessionLocal, init_db, GameSession, Message, User

app = FastAPI()

# Автоматически создаем таблицы в PostgreSQL при запуске сервера
init_db()


# Простые функции безопасного хеширования паролей на базе встроенного hashlib
def hash_password(password: str) -> str:
    # Используем соль для надежности хеша на хакатоне
    salt = "hackathon_secret_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


# Настройка CORS для работы фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Переменные окружения для локального запуска и Docker
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = "qwen2.5:3b"


# Сессия базы данных для эндпоинтов
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- МОДЕЛИ ВАЛИДАЦИИ ДАННЫХ ---
class UserAuth(BaseModel):
    username: str
    password: str


class GameState(BaseModel):
    session_id: str | None = None
    player_message: str | None = None  # На первом ходу будет None
    chosen_archetype: str | None = None  # СТИЛЬ (Боец, Аналитик, Дипломат, Харизма)
    scenario_id: str  # crisis, deadline, check


# --- ЭНДПОИНТ РЕГИСТРАЦИИ ---
@app.post("/api/register")
async def register_user(user_data: UserAuth, db: Session = Depends(get_db)):
    from .database import DATABASE_URL
    print(f"\n[DEBUG REGISTER] Попытка записи в базу: {DATABASE_URL}")
    print(f"[DEBUG REGISTER] Пользователь: {user_data.username}")

    existing_user = db.query(User).filter(User.username.ilike(user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Этот никнейм уже занят!")

    # Хешируем через наш встроенный sha256
    hashed = hash_password(user_data.password)
    new_user = User(username=user_data.username, password_hash=hashed)
    db.add(new_user)
    db.commit()
    print("[DEBUG REGISTER] Успешно закоммичено в Postgres!")
    return {"message": "Регистрация успешна!"}


# --- ЭНДПОИНТ ВХОДА ---
@app.post("/api/login")
async def login_user(user_data: UserAuth, db: Session = Depends(get_db)):
    from .database import DATABASE_URL
    print(f"\n[DEBUG LOGIN] Проверка авторизации в базе: {DATABASE_URL}")

    user = db.query(User).filter(User.username.ilike(user_data.username)).first()
    if user:
        print(f"[DEBUG LOGIN] Пользователь найден в БД!")
    else:
        print("[DEBUG LOGIN] Пользователь НЕ найден в этой БД!")

    # Проверяем пароль чистым сравнением хешей
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")
    return {"message": "Успешный вход!"}


# --- ИГРОВОЙ ЭНДПОИНТ ДЛЯ ГЕНЕРАЦИИ РАЗВИЛОК СЮЖЕТА ---
@app.post("/game/chat")
async def chat_step(state: GameState, db: Session = Depends(get_db)):
    if not state.session_id:
        session_id = str(uuid.uuid4())
        db_session = GameSession(id=session_id, stress=20, agreement=30, status="in_progress",
                                 current_stage=state.scenario_id)
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
    else:
        session_id = state.session_id
        db_session = db.query(GameSession).filter(GameSession.id == session_id).first()
        if not db_session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")

    if db_session.status != "in_progress":
        return {
            "session_id": session_id,
            "game_status": db_session.status,
            "client_replica": "Переговоры завершены.",
            "options": {}
        }

    scenarios = {
        "crisis": "Кризис-менеджмент. Утечка данных на прод-сервере. Клиент в панике и ярости, требует объяснений.",
        "deadline": "Сдвиг дедлайнов. Переговоры о переносе сроков релиза. Клиент жесткий, не хочет терять деньги.",
        "check": "Повышение чека. Обоснование индексации стоимости поддержки. Клиент прижимистый, считает каждую копейку."
    }
    client_profile = scenarios.get(state.scenario_id, "Жесткий директор IT.")

    system_prompt = (
        f"Ты играешь роль клиента симулятора жестких переговоров. Профиль: {client_profile}. "
        f"Текущий уровень стресса: {db_session.stress}%, согласие на сделку: {db_session.agreement}%. "
        "Сделай ход в переговорах. Если это первый ход (player_message пустой), начни диалог с наезда по теме сценария. "
        "Если игрок уже ответил, проанализируй его реплику (стиль: {state.chosen_archetype}), измени свои шкалы стресса и согласия. "
        "Затем выдай свою новую реплику И ОБЯЗАТЕЛЬНО предложи 4 новых тактических варианта ответа для игрока строго под 4 архетипа: БОЕЦ, АНАЛИТИК, ДИПЛОМАТ, ХАРИЗМА. "
        "Ты обязан ответить СТРОГО в формате JSON без лишнего текста до и после:\n"
        "{\n"
        '  "client_replica": "Твоя жесткая фраза в роли директора",\n'
        '  "stress_change": int,\n'
        '  "agreement_change": int,\n'
        '  "feedback": "Краткое пояснение изменений",\n'
        '  "options": {\n'
        '    "БОЕЦ": "Вариант ответа с позиции давления/обороны",\n'
        '    "АНАЛИТИК": "Вариант ответа с опорой на цифры/факты/логику",\n'
        '    "ДИПЛОМАТ": "Вариант ответа сглаживающий углы/по регламенту",\n'
        '    "ХАРИЗМА": "Вариант ответа через уверенность/эмоции"\n'
        "  }\n"
        "}"
    )

    prompt_context = f"Прошлое сообщение игрока: {state.player_message}" if state.player_message else "Начало игры, первый ход."
    payload = {"model": MODEL_NAME, "prompt": f"{system_prompt}\n\nКонтекст: {prompt_context}\nОтвет в JSON:",
               "stream": False, "format": "json"}

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        ai_json = json.loads(response.json().get("response", "{}"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации Ollama: {str(e)}")

    new_stress = max(0, min(100, db_session.stress + ai_json.get("stress_change", 0)))
    new_agreement = max(0, min(100, db_session.agreement + ai_json.get("agreement_change", 0)))

    game_status = "in_progress"
    client_replica = ai_json.get("client_replica", "Продолжайте.")

    if new_stress >= 100:
        game_status = "lose"
        client_replica = "Разговор окончен. До свидания! *Бросил трубку*"
    elif new_agreement >= 100:
        game_status = "win"
        client_replica = "Что ж, ваши аргументы убедительны. Давайте подписывать контракт!"

    radar_metrics = {
        "argumentation": max(10, min(100, 50 + (new_agreement - new_stress) // 2)),
        "politeness": max(10, min(100, 100 - new_stress)),
        "clarity": 80 if ai_json.get("stress_change", 0) <= 0 else 40,
        "empathy": max(10, min(100, new_agreement)),
        "flexibility": max(10, min(100, 50 + ai_json.get("agreement_change", 0) * 2))
    }

    db_session.stress = new_stress
    db_session.agreement = new_agreement
    db_session.status = game_status

    if state.player_message:
        player_msg = Message(session_id=session_id, sender="player", text=state.player_message)
        db.add(player_msg)

    client_msg = Message(
        session_id=session_id, sender="client", text=client_replica,
        stress_change=ai_json.get("stress_change", 0), agreement_change=ai_json.get("agreement_change", 0),
        feedback=ai_json.get("feedback", ""),
        argumentation=radar_metrics["argumentation"], politeness=radar_metrics["politeness"],
        clarity=radar_metrics["clarity"], empathy=radar_metrics["empathy"], flexibility=radar_metrics["flexibility"]
    )
    db.add(client_msg)
    db.commit()

    return {
        "session_id": session_id,
        "client_replica": client_replica,
        "feedback": ai_json.get("feedback", ""),
        "new_stress": new_stress,
        "new_agreement": new_agreement,
        "game_status": game_status,
        "options": ai_json.get("options", {}),
        "radar_metrics": radar_metrics
    }


# --- ИНТЕГРАЦИЯ И СЛИЯНИЕ С ФРОНТЕНДОМ ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/src", StaticFiles(directory=os.path.join(FRONTEND_DIR, "src")), name="src")
    app.mount("/pages", StaticFiles(directory=os.path.join(FRONTEND_DIR, "pages")), name="pages")


@app.get("/")
async def get_index():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Бэкенд запущен, но index.html не найден по пути: " + index_path}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
