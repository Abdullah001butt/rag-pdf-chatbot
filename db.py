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
    automation_rules = relationship("AutomationRule", back_populates="user", cascade="all, delete-orphan")
    owned_workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")


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


class AutomationRule(Base):
    """A user-defined 'when I upload a PDF, automatically do X' rule."""

    __tablename__ = "automation_rules"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200), nullable=False)
    match_keyword = Column(String(200), default="")
    actions = Column(String(200), nullable=False)  # comma-separated: summary,notes,quiz,flashcards
    deliver_email = Column(Boolean, default=True, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="automation_rules")
    runs = relationship("AutomationRun", back_populates="rule", cascade="all, delete-orphan")


class AutomationRun(Base):
    """A single execution record of an automation rule against an uploaded file."""

    __tablename__ = "automation_runs"

    id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, ForeignKey("automation_rules.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rule_name = Column(String(200), nullable=False)
    filename = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)  # "success" | "error" | "skipped"
    result_text = Column(Text, default="")
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    rule = relationship("AutomationRule", back_populates="runs")


MAX_AUTOMATION_RUNS_PER_USER = 100


class Workspace(Base):
    """A Pro-tier shared team workspace. Documents uploaded here are stored
    in the database (unlike the personal in-memory-only store) so every
    member can access them.
    """

    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="owned_workspaces")
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    documents = relationship("WorkspaceDocument", back_populates="workspace", cascade="all, delete-orphan")
    chat_messages = relationship("WorkspaceChatMessage", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(10), nullable=False, default="member")  # "owner" | "member"
    joined_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="workspace_memberships")


class WorkspaceDocument(Base):
    __tablename__ = "workspace_documents"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    file_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="documents")
    uploaded_by = relationship("User")


class WorkspaceChatMessage(Base):
    """Shared chat history for a workspace, visible to every member."""

    __tablename__ = "workspace_chat_messages"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    asked_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    citations = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    asked_by = relationship("User")


MAX_WORKSPACE_MEMBERS = 20
MAX_WORKSPACE_DOCUMENTS = 100
MAX_WORKSPACE_CHAT_MESSAGES = 200


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


def create_automation_rule(db_session, user_id, name, match_keyword, actions, deliver_email):
    rule = AutomationRule(
        user_id=user_id,
        name=name,
        match_keyword=match_keyword or "",
        actions=actions,
        deliver_email=deliver_email,
    )
    db_session.add(rule)
    db_session.commit()
    db_session.refresh(rule)
    return rule


def list_automation_rules(db_session, user_id):
    return (
        db_session.query(AutomationRule)
        .filter(AutomationRule.user_id == user_id)
        .order_by(AutomationRule.created_at.desc())
        .all()
    )


def get_automation_rule(db_session, user_id, rule_id):
    return (
        db_session.query(AutomationRule)
        .filter(AutomationRule.id == rule_id, AutomationRule.user_id == user_id)
        .first()
    )


def set_automation_rule_enabled(db_session, user_id, rule_id, enabled):
    rule = get_automation_rule(db_session, user_id, rule_id)
    if rule:
        rule.enabled = enabled
        db_session.commit()
        return True
    return False


def delete_automation_rule(db_session, user_id, rule_id):
    rule = get_automation_rule(db_session, user_id, rule_id)
    if rule:
        db_session.delete(rule)
        db_session.commit()
        return True
    return False


def record_automation_run(db_session, rule_id, user_id, rule_name, filename, status, result_text="", error_message=""):
    run = AutomationRun(
        rule_id=rule_id,
        user_id=user_id,
        rule_name=rule_name,
        filename=filename,
        status=status,
        result_text=result_text,
        error_message=error_message,
    )
    db_session.add(run)
    db_session.flush()

    total = db_session.query(AutomationRun).filter(AutomationRun.user_id == user_id).count()
    if total > MAX_AUTOMATION_RUNS_PER_USER:
        oldest = (
            db_session.query(AutomationRun)
            .filter(AutomationRun.user_id == user_id)
            .order_by(AutomationRun.created_at)
            .first()
        )
        if oldest:
            db_session.delete(oldest)

    db_session.commit()
    return run


def list_automation_runs(db_session, user_id, limit=50):
    return (
        db_session.query(AutomationRun)
        .filter(AutomationRun.user_id == user_id)
        .order_by(AutomationRun.created_at.desc())
        .limit(limit)
        .all()
    )


def create_workspace(db_session, owner_id, name):
    workspace = Workspace(name=name, owner_id=owner_id)
    db_session.add(workspace)
    db_session.flush()
    db_session.add(WorkspaceMember(workspace_id=workspace.id, user_id=owner_id, role="owner"))
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


def list_user_workspaces(db_session, user_id):
    return (
        db_session.query(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .filter(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at.desc())
        .all()
    )


def get_workspace(db_session, workspace_id):
    return db_session.query(Workspace).filter(Workspace.id == workspace_id).first()


def get_workspace_member(db_session, workspace_id, user_id):
    return (
        db_session.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.user_id == user_id)
        .first()
    )


def list_workspace_members(db_session, workspace_id):
    return (
        db_session.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at)
        .all()
    )


def add_workspace_member(db_session, workspace_id, user_id):
    existing = get_workspace_member(db_session, workspace_id, user_id)
    if existing:
        return existing
    member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role="member")
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)
    return member


def remove_workspace_member(db_session, workspace_id, user_id):
    member = get_workspace_member(db_session, workspace_id, user_id)
    if member:
        db_session.delete(member)
        db_session.commit()
        return True
    return False


def delete_workspace(db_session, workspace_id):
    workspace = get_workspace(db_session, workspace_id)
    if workspace:
        db_session.delete(workspace)
        db_session.commit()
        return True
    return False


def save_workspace_document(db_session, workspace_id, uploaded_by_id, filename, file_bytes):
    existing_count = (
        db_session.query(WorkspaceDocument).filter(WorkspaceDocument.workspace_id == workspace_id).count()
    )
    if existing_count >= MAX_WORKSPACE_DOCUMENTS:
        oldest = (
            db_session.query(WorkspaceDocument)
            .filter(WorkspaceDocument.workspace_id == workspace_id)
            .order_by(WorkspaceDocument.created_at)
            .first()
        )
        if oldest:
            db_session.delete(oldest)
            db_session.flush()
    doc = WorkspaceDocument(
        workspace_id=workspace_id,
        uploaded_by_id=uploaded_by_id,
        filename=filename,
        size_bytes=len(file_bytes),
        file_data=file_bytes,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    return doc


def list_workspace_documents(db_session, workspace_id):
    return (
        db_session.query(WorkspaceDocument)
        .filter(WorkspaceDocument.workspace_id == workspace_id)
        .order_by(WorkspaceDocument.created_at.desc())
        .all()
    )


def get_workspace_document(db_session, workspace_id, document_id):
    return (
        db_session.query(WorkspaceDocument)
        .filter(WorkspaceDocument.id == document_id, WorkspaceDocument.workspace_id == workspace_id)
        .first()
    )


def delete_workspace_document(db_session, workspace_id, document_id):
    doc = get_workspace_document(db_session, workspace_id, document_id)
    if doc:
        db_session.delete(doc)
        db_session.commit()
        return True
    return False


def save_workspace_chat_message(db_session, workspace_id, asked_by_id, question, answer, citations):
    msg = WorkspaceChatMessage(
        workspace_id=workspace_id,
        asked_by_id=asked_by_id,
        question=question,
        answer=answer,
        citations=citations,
    )
    db_session.add(msg)
    db_session.flush()

    total = db_session.query(WorkspaceChatMessage).filter(WorkspaceChatMessage.workspace_id == workspace_id).count()
    if total > MAX_WORKSPACE_CHAT_MESSAGES:
        oldest = (
            db_session.query(WorkspaceChatMessage)
            .filter(WorkspaceChatMessage.workspace_id == workspace_id)
            .order_by(WorkspaceChatMessage.created_at)
            .first()
        )
        if oldest:
            db_session.delete(oldest)

    db_session.commit()
    return msg


def load_workspace_chat_history(db_session, workspace_id, limit=50):
    rows = (
        db_session.query(WorkspaceChatMessage)
        .filter(WorkspaceChatMessage.workspace_id == workspace_id)
        .order_by(WorkspaceChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))
