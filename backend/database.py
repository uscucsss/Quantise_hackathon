import datetime
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

db_user = str(os.getenv("DB_USER", "postgres")).strip()
db_password = str(os.getenv("DB_PASSWORD", "")).strip()
db_host = str(os.getenv("DB_HOST", "127.0.0.1")).strip()
db_port = str(os.getenv("DB_PORT", "5432")).strip()
db_name = str(os.getenv("DB_NAME", "postgres")).strip()

DATABASE_URL = f"postgresql+pg8000://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Включаем echo=True, чтобы бэкенд выводил в консоль все логи работы с базой
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    password_plain = Column(String, default="********")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class GameSession(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    player_name = Column(String, default="Игрок")
    current_stage = Column(String, default="step_1_greeting")
    stress = Column(Integer, default=20)
    agreement = Column(Integer, default=30)
    status = Column(String, default="in_progress")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    final_argumentation = Column(Integer, default=0)
    final_politeness = Column(Integer, default=0)
    final_clarity = Column(Integer, default=0)
    final_empathy = Column(Integer, default=0)
    final_flexibility = Column(Integer, default=0)
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    user = relationship("User")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"))
    sender = Column(String)
    text = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    session = relationship("GameSession", back_populates="messages")

def init_db():
    # Принудительно открываем транзакцию для создания таблиц
    with engine.begin() as connection:
        Base.metadata.create_all(bind=connection)
