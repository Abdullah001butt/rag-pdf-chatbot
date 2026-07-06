import re
import bcrypt

from db import User


USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_user(db_session, username, email, password):
    username = username.strip()
    email = email.strip().lower()

    if not USERNAME_RE.match(username):
        raise ValueError("Username must be 3-30 characters (letters, numbers, underscore only).")
    if not EMAIL_RE.match(email):
        raise ValueError("Please enter a valid email address.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")

    if db_session.query(User).filter(User.username == username).first():
        raise ValueError("That username is already taken.")
    if db_session.query(User).filter(User.email == email).first():
        raise ValueError("An account with that email already exists.")

    user = User(username=username, email=email, password_hash=hash_password(password), tier="free")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def authenticate_user(db_session, username, password):
    user = db_session.query(User).filter(User.username == username.strip()).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user
