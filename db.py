import os
from datetime import datetime, date

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_PATH = os.path.join(os.path.dirname(__file__), "documind.db")
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    tier = Column(String(10), nullable=False, default="free")
    stripe_customer_id = Column(String(50), unique=True, nullable=True)
    stripe_subscription_id = Column(String(50), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    usage_events = relationship("UsageEvent", back_populates="user", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    citations = Column(Text, default="")
    pdf_names = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(30), nullable=False)
    event_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="usage_events")


def init_db():
    Base.metadata.create_all(engine)


def get_session():
    return SessionLocal()


def save_chat_message(db_session, user_id, question, answer, citations, pdf_names):
    msg = ChatMessage(
        user_id=user_id,
        question=question,
        answer=answer,
        citations=citations,
        pdf_names=pdf_names,
    )
    db_session.add(msg)
    db_session.commit()


def load_chat_history(db_session, user_id, limit=200):
    rows = (
        db_session.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at)
        .limit(limit)
        .all()
    )
    return [
        (r.question, r.answer, "Google AI", r.created_at.strftime("%Y-%m-%d %H:%M:%S"), r.pdf_names, r.citations)
        for r in rows
    ]


def clear_chat_history(db_session, user_id):
    db_session.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db_session.commit()
