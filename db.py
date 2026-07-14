import os
from datetime import datetime, date

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Date, Boolean, ForeignKey, Text, LargeBinary
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), "documind.db")
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # e.g. postgresql://user:password@host:5432/documind
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
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
    email_verified = Column(Boolean, default=False, nullable=False)
    stripe_customer_id = Column(String(50), unique=True, nullable=True)
    stripe_subscription_id = Column(String(50), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    usage_events = relationship("UsageEvent", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    action_tokens = relationship("ActionToken", back_populates="user", cascade="all, delete-orphan")
    document_versions = relationship("DocumentVersion", back_populates="user", cascade="all, delete-orphan")


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


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class ActionToken(Base):
    """Single-use tokens for email verification and password reset."""

    __tablename__ = "action_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)
    purpose = Column(String(20), nullable=False)  # "email_verify" | "password_reset"
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="action_tokens")


class DocumentVersion(Base):
    """User-opted-in saved snapshots of an edited PDF. Unlike the in-memory
    per-session document store, these are explicitly saved by the user and
    persist in the database until deleted.
    """

    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    version_number = Column(Integer, nullable=False)
    label = Column(String(200), default="")
    size_bytes = Column(Integer, nullable=False)
    file_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="document_versions")


MAX_VERSIONS_PER_DOCUMENT = 20


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


def store_refresh_token(db_session, user_id, token_hash, expires_at):
    record = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
    db_session.add(record)
    db_session.commit()
    return record


def get_valid_refresh_token(db_session, token_hash):
    return (
        db_session.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )


def revoke_refresh_token(db_session, token_hash):
    record = db_session.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if record:
        record.revoked = True
        db_session.commit()


def revoke_all_refresh_tokens(db_session, user_id):
    db_session.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({"revoked": True})
    db_session.commit()


def store_action_token(db_session, user_id, token_hash, purpose, expires_at):
    record = ActionToken(user_id=user_id, token_hash=token_hash, purpose=purpose, expires_at=expires_at)
    db_session.add(record)
    db_session.commit()
    return record


def get_valid_action_token(db_session, token_hash, purpose):
    return (
        db_session.query(ActionToken)
        .filter(
            ActionToken.token_hash == token_hash,
            ActionToken.purpose == purpose,
            ActionToken.used.is_(False),
            ActionToken.expires_at > datetime.utcnow(),
        )
        .first()
    )


def consume_action_token(db_session, token_hash):
    record = db_session.query(ActionToken).filter(ActionToken.token_hash == token_hash).first()
    if record:
        record.used = True
        db_session.commit()


def save_document_version(db_session, user_id, filename, label, file_bytes):
    existing = (
        db_session.query(DocumentVersion)
        .filter(DocumentVersion.user_id == user_id, DocumentVersion.filename == filename)
        .order_by(DocumentVersion.version_number)
        .all()
    )
    if len(existing) >= MAX_VERSIONS_PER_DOCUMENT:
        oldest = existing[0]
        db_session.delete(oldest)
        db_session.flush()
    next_number = (existing[-1].version_number + 1) if existing else 1
    record = DocumentVersion(
        user_id=user_id,
        filename=filename,
        version_number=next_number,
        label=label or "",
        size_bytes=len(file_bytes),
        file_data=file_bytes,
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


def list_document_versions(db_session, user_id, filename):
    return (
        db_session.query(DocumentVersion)
        .filter(DocumentVersion.user_id == user_id, DocumentVersion.filename == filename)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )


def get_document_version(db_session, user_id, version_id):
    return (
        db_session.query(DocumentVersion)
        .filter(DocumentVersion.id == version_id, DocumentVersion.user_id == user_id)
        .first()
    )


def delete_document_version(db_session, user_id, version_id):
    record = get_document_version(db_session, user_id, version_id)
    if record:
        db_session.delete(record)
        db_session.commit()
        return True
    return False
