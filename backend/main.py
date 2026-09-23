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


# Функции безопасного хеширования паролей на базе встроенного hashlib
def hash_password(password: str) -> str:
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
    user_id: int | None = None
    player_message: str | None = None
    chosen_archetype: str | None = None
    scenario_id: str
    # НОВЫЕ ПОЛЯ: Для передачи шкал и этапов виртуального гостя
    current_stage: str | None = "step_1_greeting"
    stress: int | None = 20
    agreement: int | None = 30



# --- API ЭНДПОИНТЫ АВТОРИЗАЦИИ ---

@app.post("/api/register")
async def register_user(user_data: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username.ilike(user_data.username)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Этот никнейм уже занят!")

    hashed = hash_password(user_data.password)
    new_user = User(username=user_data.username, password_hash=hashed)
    db.add(new_user)
    db.commit()
    return {"message": "Регистрация успешна!"}


@app.post("/api/login")
async def login_user(user_data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username.ilike(user_data.username)).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")
    return {"message": "Успешный вход!", "user_id": user.id}


# --- ИГРОВОЙ ЭНДПОИНТ ---

@app.post("/game/chat")
async def chat_step(state: GameState, db: Session = Depends(get_db)):
    is_guest = (state.user_id is None or state.user_id == 0)

    # 1. Логика сессии и шкал
    if is_guest:
        # Для гостя генерируем виртуальный ID сессии, если его нет
        session_id = state.session_id or str(uuid.uuid4())
        # Берём шкалы и стадию прямо из запроса фронтенда, чтобы они развивались, а не сбрасывались!
        guest_stress = state.stress if state.stress is not None else 20
        guest_agreement = state.agreement if state.agreement is not None else 30
        stage_id = state.current_stage or "step_1_greeting"
        game_status = "in_progress"
        db_session = None
    else:
        # Стандартная логика авторизованного юзера с хранением в PostgreSQL
        if not state.session_id:
            session_id = str(uuid.uuid4())
            db_session = GameSession(id=session_id, user_id=state.user_id, stress=20, agreement=30,
                                     status="in_progress", current_stage="step_1_greeting")
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
        else:
            session_id = state.session_id
            db_session = db.query(GameSession).filter(GameSession.id == session_id).first()
            if not db_session:
                raise HTTPException(status_code=404, detail="Сессия не найдена")

        guest_stress = db_session.stress
        guest_agreement = db_session.agreement
        stage_id = db_session.current_stage
        game_status = db_session.status

    # 2. Загрузка файла сценария
    scenarios_dir = os.path.join(os.path.dirname(__file__), "scenarios")
    scenario_file_path = os.path.join(scenarios_dir, f"{state.scenario_id}.json")
    if not os.path.exists(scenario_file_path):
        raise HTTPException(status_code=400, detail="Сценарий не найден.")

    with open(scenario_file_path, "r", encoding="utf-8") as f:
        scenario = json.load(f)

    # Если сессия из БД загружена, берем стадию оттуда, иначе виртуальную
    current_stage_id = stage_id if is_guest else (db_session.current_stage or "step_1_greeting")
    stage_data = scenario["stages"].get(current_stage_id, scenario["stages"]["step_1_greeting"])

    # 3. Расчет изменений параметров
    stress_change = 0
    agreement_change = 0
    feedback = "Диалог продолжается."

    if state.chosen_archetype and state.player_message:
        rule = stage_data["rules"].get(state.chosen_archetype,
                                       {"stress": 0, "agreement": 0, "feedback": "Нейтральный ответ."})
        stress_change = rule.get("stress", 0)
        agreement_change = rule.get("agreement", 0)
        feedback = rule.get("feedback", "Ход обработан.")

    # Высчитываем новые показатели шкал
    current_s = guest_stress if is_guest else db_session.stress
    current_a = guest_agreement if is_guest else db_session.agreement

    new_stress = max(0, min(100, current_s + stress_change))
    new_agreement = max(0, min(100, current_a + agreement_change))

    # 4. Переключение этапов сюжета
    if state.chosen_archetype:
        next_stage_id = stage_data.get("next_stage", "end")
        if next_stage_id and next_stage_id in scenario["stages"]:
            current_stage_id = next_stage_id
            stage_data = scenario["stages"][current_stage_id]
        else:
            current_stage_id = "end"

    # 5. Проверка условий концовок
    current_status = "in_progress"
    client_replica = ""

    if new_stress >= 100 or new_agreement < 20:
        current_status = "lose"
        client_replica = scenario["endings"]["lose"]
        feedback = "Контракт разорван."
    elif new_agreement >= 70 and new_stress < 45:
        current_status = "win"
        client_replica = scenario["endings"]["win"]
        feedback = "Успех! Заключено соглашение."
    elif current_stage_id == "end":
        if new_agreement >= 50:
            current_status = "win"
            client_replica = scenario["endings"]["win"]
            feedback = "Достигнуто компромиссное соглашение."
        else:
            current_status = "lose"
            client_replica = scenario["endings"]["lose"]
            feedback = "Переговоры зашли в тупик."


    # 6. ГЕНЕРАЦИЯ ИЛИ ВЫДАЧА РЕПЛИКИ КЛИЕНТА
    if current_status == "in_progress":
        # ИСПРАВЛЕНО: Если это самый первый ход (сообщения от игрока еще нет),
        # мы выдаем заготовленную художественную реплику сценариста без запроса к Ollama!
        if not state.player_message:
            if state.scenario_id == "deadline_crisis":
                client_replica = "Вы задерживаете релиз приложения на целых три недели! Объясните мне причину, какого черта у вас процессы дали сбой?!"
            elif state.scenario_id == "price_increase":
                client_replica = "Я видела ваше письмо о повышении чека на поддержку на 20%. С какой стати? Наш бюджет на ИТ заблокирован до конца года!"
            else:
                client_replica = "Добрый день. Я жду от вас четкого и внятного отчета по текущему статусу проекта."
        else:
            # Для всех последующих ходов подключаем Ollama с жестким языковым фильтром
            system_prompt = (
                f"Ты играешь роль жесткого клиента по имени Антон. {scenario['client_profile']} "
                f"Текущая инструкция для твоего поведения на этом шаге: {stage_data['prompt']}. "
                f"Твой стресс: {new_stress}%, согласие: {new_agreement}%. "
                "ОБЯЗАТЕЛЬНЫЕ КРИТИЧЕСКИЕ ПРАВИЛА:\n"
                "1. Отвечай СТРОГО на русском языке! Использовать китайский язык, иероглифы или английские слова КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО!\n"
                "2. Пиши супер-коротко: максимум 1-2 предложения от лица Антона. Никакого JSON, списков или вариантов ответов!"
            )

            payload = {
                "model": MODEL_NAME,
                "prompt": f"{system_prompt}\n\nПрошлое сообщение игрока ({state.chosen_archetype}): {state.player_message}\nОтвет Антона строго на русском языке:",
                "stream": False,
                # Снижаем температуру, чтобы модель вела себя стабильно и не улетала в астрал
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.8
                }
            }

            try:
                response = requests.post(OLLAMA_URL, json=payload, timeout=30)
                client_replica = response.json().get("response", "Продолжайте.").strip()

                # Дополнительная бэк-проверка: если ИИ все-таки умудрился выдать иероглифы (проверяем по кодам символов)
                if any(ord(char) > 0x4e00 and ord(char) < 0x9fff for char in client_replica):
                    client_replica = "Я слышу ваши аргументы, но мне нужны конкретные гарантии прямо сейчас. Продолжайте."

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Ошибка Ollama: {str(e)}")

        # Опции ответов всегда стабильно берем из JSON сценария
        options = stage_data["options"]
    else:
        options = {}

    radar_metrics = {
        "argumentation": max(10, min(100, 50 + (new_agreement - new_stress) // 2)),
        "politeness": max(10, min(100, 100 - new_stress)),
        "clarity": 80 if stress_change <= 0 else 40,
        "empathy": max(10, min(100, new_agreement)),
        "flexibility": max(10, min(100, 50 + agreement_change * 2))
    }

    # ИСПРАВЛЕНО: Записываем в Postgres только если перед нами НЕ ГОСТЬ!
    if not is_guest:
        db_session.stress = new_stress
        db_session.agreement = new_agreement
        db_session.status = current_status
        db_session.current_stage = current_stage_id

        db_session.final_argumentation = radar_metrics["argumentation"]
        db_session.final_politeness = radar_metrics["politeness"]
        db_session.final_clarity = radar_metrics["clarity"]
        db_session.final_empathy = radar_metrics["empathy"]
        db_session.final_flexibility = radar_metrics["flexibility"]
        db.commit()
    return {
        "session_id": session_id,
        "speaker": "Антон",
        "client_replica": client_replica,
        "feedback": feedback,
        "new_stress": new_stress,
        "new_agreement": new_agreement,
        "game_status": current_status,
        "current_stage": current_stage_id, # ВОЗВРАЩАЕМ ТЕКУЩИЙ ШАГ
        "options": options,
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
    return {"message": "Бэкенд готов."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
