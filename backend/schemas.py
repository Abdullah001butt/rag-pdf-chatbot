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
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    tier: str
    email_verified: bool


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangeEmailRequest(BaseModel):
    new_email: str
    current_password: str


class DeleteAccountRequest(BaseModel):
    password: str


class MessageResponse(BaseModel):
    message: str


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


class RewriteTextRequest(BaseModel):
    text: str
    instruction: str


class RewriteTextResponse(BaseModel):
    result: str


class AgentPlanRequest(BaseModel):
    goal: str


TokenResponse.model_rebuild()
