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
    current_stage: str | None = "step_1_greeting"
    stress: int | None = 20
    agreement: int | None = 30

# --- API ЭНДПОИНТЫ АВТОРИЗАЦИИ ---

# --- ВОЗВРАЩАЕМ НАДЁЖНОЕ ХЭШИРОВАНИЕ С ПРАВИЛЬНЫМ RETURN ---
def hash_password(password: str) -> str:
    salt = "hackathon_secret_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Теперь функция гарантированно возвращает True/False, а не None
    return hash_password(plain_password) == hashed_password


# --- АВТОРИЗАЦИЯ С ШИФРОВАНИЕМ ДЛЯ POSTGRESQL ---

@app.post("/api_v1/api/register")
async def register_user(user_data: UserAuth, db: Session = Depends(get_db)):
    clean_name = user_data.username.strip()
    existing_user = db.query(User).filter(User.username.ilike(clean_name)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Этот никнейм уже занят!")

    # Шифруем пароль перед записью в базу данных
    hashed = hash_password(user_data.password)
    new_user = User(username=clean_name, password_hash=hashed, password_plain=user_data.password)

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"message": "Регистрация успешна!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api_v1/api/login")
async def login_user(user_data: UserAuth, db: Session = Depends(get_db)):
    clean_name = user_data.username.strip()
    user = db.query(User).filter(User.username.ilike(clean_name)).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")

    return {"message": "Успешный вход!", "user_id": user.id}


# --- ИГРОВОЙ ЭНДПОИНТ ---

@app.post("/game/chat")
async def chat_step(state: GameState, db: Session = Depends(get_db)):
    is_guest = (state.user_id is None or state.user_id == 0)

    # 1. Логика сессии и шкал
    is_guest = (state.user_id is None or state.user_id == 0)

    # 1. Логика сессии и шкал (Исправленная синхронизация для облачной СУБД)
    if is_guest:
        # Для гостей генерируем или сохраняем ID сессии в памяти
        session_id = state.session_id if (state.session_id and state.session_id != "null") else str(uuid.uuid4())
        guest_stress = state.stress if state.stress is not None else 20
        guest_agreement = state.agreement if state.agreement is not None else 30
        stage_id = state.current_stage or "step_1_greeting"
        current_status = "in_progress"
        db_session = None
    else:
        # ИСПРАВЛЕНО: Строго проверяем строковое значение "null", которое может прилететь от JS
        if not state.session_id or state.session_id == "null":
            session_id = str(uuid.uuid4())
            db_session = GameSession(
                id=session_id,
                user_id=state.user_id,
                stress=20,
                agreement=30,
                status="in_progress",
                current_stage="step_1_greeting"
            )
            db.add(db_session)
            try:
                db.commit()
                db.refresh(db_session)
            except Exception as db_err:
                db.rollback()
                print(f"[QUANTISE DB ERROR]: Сбой создания сессии: {str(db_err)}")
        else:
            session_id = state.session_id
            db_session = db.query(GameSession).filter(GameSession.id == session_id).first()

            # Аварийный фолбек: если фронт прислал старый UUID, которого нет в новой БД Render
            if not db_session:
                db_session = GameSession(
                    id=session_id,
                    user_id=state.user_id,
                    stress=state.stress if state.stress is not None else 20,
                    agreement=state.agreement if state.agreement is not None else 30,
                    status="in_progress",
                    current_stage=state.current_stage or "step_1_greeting"
                )
                db.add(db_session)
                db.commit()
                db.refresh(db_session)

        guest_stress = db_session.stress
        guest_agreement = db_session.agreement
        stage_id = db_session.current_stage
        current_status = db_session.status

    # 2. Загрузка файла сценария
    scenarios_dir = os.path.join(os.path.dirname(__file__), "scenarios")
    scenario_file_path = os.path.join(scenarios_dir, f"{state.scenario_id}.json")
    if not os.path.exists(scenario_file_path):
        raise HTTPException(status_code=400, detail="Сценарий не найден.")

    with open(scenario_file_path, "r", encoding="utf-8") as f:
        scenario = json.load(f)

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

    # 6. Генерация ответа ИИ
    # 6. Генерация ответа ИИ (Отказоустойчивый гибридный модуль: Локальная Ollama -> Hugging Face -> Фолбек)
    if current_status == "in_progress":
        if not state.player_message:
            if state.scenario_id == "deadline_crisis":
                client_replica = "Вы задерживаете релиз приложения на целых три недели! Объясните мне причину, какого черта у вас процессы дали сбой?!"
            elif state.scenario_id == "price_increase":
                client_replica = "Я видела ваше письмо о повышении чека на поддержку на 20%. С какой стати? Наш бюджет на ИТ заблокирован до конца года!"
            else:
                client_replica = "Вы сорвали прод-сервер! Он лежит уже 2 часа, база данных пуста! Какого черта?!"
        else:
            system_prompt = (
                f"Ты играешь роль жесткого клиента. {scenario['client_profile']} "
                f"Инструкция для твоего поведения на этом шаге: {stage_data['prompt']}. "
                f"Твой стресс: {new_stress}%, согласие: {new_agreement}%. "
                "ОБЯЗАТЕЛЬНЫЕ КРИТИЧЕСКИЕ ПРАВИЛА:\n"
                "1. Отвечай СТРОГО на русском языке! Использовать иероглифы категорически запрещено!\n"
                "2. Пиши супер-коротко: максимум 1-2 предложения. Никакого JSON!"
            )

            # --- СТУЧИМСЯ В ЛОКАЛЬНУЮ OLLAMA (Приоритет) ---
            client_replica = None
            try:
                print("[QUANTISE AI]: Попытка обращения к локальной Ollama...")
                payload = {
                    "model": MODEL_NAME,
                    "prompt": f"{system_prompt}\n\nПрошлое сообщение игрока ({state.chosen_archetype}): {state.player_message}\nОтвет строго на русском:",
                    "stream": False,
                    "options": {"temperature": 0.3, "top_p": 0.8}
                }
                # Ставим таймаут покороче (3.5 сек), чтобы в облаке Render игра не зависала при отсутствии Ollama
                response = requests.post(OLLAMA_URL, json=payload, timeout=3.5)
                if response.status_code == 200:
                    client_replica = response.json().get("response", "").strip()
                    print("[QUANTISE AI]: Успешный ответ получен от локальной Ollama!")
            except Exception as e:
                print(f"[QUANTISE AI]: Локальная Ollama недоступна. Ошибка: {str(e)}")

            # --- СТУЧИМСЯ В ОБЛАЧНЫЙ HUGGING FACE INFERENCE API (Фолбек №1 для Render) ---
            if not client_replica:
                hf_token = os.getenv("HF_TOKEN", "").strip()
                HF_API_URL = "https://huggingface.co"

                if hf_token:
                    try:
                        print("[QUANTISE AI]: Переключение на облачный Hugging Face Inference API...")
                        headers = {"Authorization": f"Bearer {hf_token}"}
                        hf_payload = {
                            "inputs": f"<|im_start|>system\nТы — жесткий ИИ-клиент в симуляторе переговоров. Отвечай строго на русском языке, лаконично (1-2 предложения), реагируя на стратегию игрока ({state.chosen_archetype}). {scenario['client_profile']}<|im_end|>\n<|im_start|>user\nИнструкция этапа: {stage_data['prompt']}. Сообщение переговорщика: {state.player_message}<|im_end|>\n<|im_start|>assistant\n",
                            "parameters": {
                                "max_new_tokens": 120,
                                "temperature": 0.5,
                                "return_full_text": False
                            }
                        }
                        hf_res = requests.post(HF_API_URL, headers=headers, json=hf_payload, timeout=7.0)
                        if hf_res.status_code == 200:
                            result = hf_res.json()
                            if isinstance(result, list) and len(result) > 0:
                                client_replica = result[0].get("generated_text", "").strip()
                                print("[QUANTISE AI]: Успешный ответ получен от Hugging Face API!")
                        else:
                            print(
                                f"[QUANTISE AI ERROR]: Hugging Face вернул статус {hf_res.status_code}: {hf_res.text}")
                    except Exception as hf_err:
                        print(f"[QUANTISE AI CRITICAL]: Сбой Hugging Face API: {str(hf_err)}")
                else:
                    print("[QUANTISE AI WARN]: Переменная HF_TOKEN отсутствует в окружении. Облачный ИИ пропущен.")

            # --- АВАРЯЙНАЯ ЗАГЛУШКА (Фолбек №2: Если легли и Ollama, и Hugging Face) ---
            if not client_replica:
                print("[QUANTISE AI]: Включение автономного текстового генератора ответов.")
                fallback_replies = {
                    "АНАЛИТИК": "Ваши цифры выглядят убедительно, но где гарантии соблюдения SLA в следующем квартале? Мне нужны четкие юридические фиксации.",
                    "БОЕЦ": "Не нужно давить на меня штрафами! Мы тоже можем выставить встречные претензии. Давайте говорить на языке компромиссов, а не ультиматумов.",
                    "ДИПЛОМАТ": "Я ценю ваше понимание нашей ситуации. Хорошо, мы готовы рассмотреть перенос дедлайна на две недели, но при условии фиксации текущей стоимости.",
                    "ХАРИЗМА": "Хах, ладно, ваш подход мне нравится. Вы умеете убеждать. Давайте согласуем доп. соглашение, но сдвиг сроков будет финальным."
                }
                client_replica = fallback_replies.get(state.chosen_archetype,
                                                      "Я услышал вашу позицию. Каковы ваши дальнейшие конкретные предложения по оптимизации проекта?")

            # Валидация на китайские иероглифы (из твоего оригинального кода)
            if any(ord(char) > 0x4e00 and ord(char) < 0x9fff for char in client_replica):
                client_replica = "Я слышу ваши аргументы, но мне нужны конкретные гарантии прямо сейчас."

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

        if state.player_message:
            db.add(Message(session_id=session_id, sender="Игрок", text=state.player_message))
        db.add(Message(session_id=session_id, sender="Клиент", text=client_replica))
        db.commit()

    return {
        "session_id": session_id,
        # ИСПРАВЛЕНО: Сначала очищаем скобки через replace, а затем берем имя до запятой
        "speaker": scenario["name"].replace(")", "").split("(")[1].upper() if "(" in scenario["name"] else "КЛИЕНТ",
        "client_replica": client_replica,
        "feedback": feedback,
        "new_stress": new_stress,
        "new_agreement": new_agreement,
        "game_status": current_status,
        "current_stage": current_stage_id,
        "options": options,
        "radar_metrics": radar_metrics
    }



# --- API ЭНДПОИНТЫ ПРОФИЛЯ И СТАТИСТИКИ ---

@app.get("/api_v1/user/profile/{user_id}")
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Берем ВСЕ завершенные сессии игрока (статус win или lose)
    sessions = db.query(GameSession).filter(GameSession.user_id == user_id, GameSession.status != "in_progress").all()
    wins = sum(1 for s in sessions if s.status == "win")
    losses = sum(1 for s in sessions if s.status == "lose")
    draws = len(sessions) - wins - losses
    total_games = len(sessions)

    # ИСПРАВЛЕНО: Считаем честное среднее на основе реальных названий колонок в БД
    avg_stats = {
        "analyst": int(sum(s.final_argumentation for s in sessions) / total_games) if total_games > 0 else 0,
        "fighter": int(sum(s.final_politeness for s in sessions) / total_games) if total_games > 0 else 0,
        "diplomat": int(sum(s.final_empathy for s in sessions) / total_games) if total_games > 0 else 0,
        "charismatic": int(sum(s.final_flexibility for s in sessions) / total_games) if total_games > 0 else 0
    }

    return {
        "nickname": user.username,
        "password": user.password_plain,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "stats": avg_stats
    }



@app.delete("/api_v1/user/profile/{user_id}")
async def delete_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    db.delete(user)
    db.commit()
    return {"message": "Аккаунт успешно ликвидирован."}


# --- ЖЕЛЕЗОБЕТОННЫЙ МОНТАЖ ВСЕГО ФРОНТЕНДА В КОРЕНЬ ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
