from pydantic import BaseModel


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    tier: str


class BillingStatusResponse(BaseModel):
    tier: str
    label: str
    max_pdfs: int | None
    daily_actions: int | None
    used_today: int
    locked_features: list[str]


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    citations: list[str]
    not_found: bool


class GenerateRequest(BaseModel):
    source: str


class CompareRequest(BaseModel):
    source_a: str
    source_b: str


class ResearchRequest(BaseModel):
    topic: str


TokenResponse.model_rebuild()
