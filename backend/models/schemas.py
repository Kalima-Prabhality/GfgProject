from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class ChatRequest(BaseModel):
    question: str
    csv_name: Optional[str] = None


class ChartDataset(BaseModel):
    label: str
    data: list[float]
    backgroundColor: Any
    borderColor: Any
    borderWidth: int
    fill: Optional[bool] = None
    tension: Optional[float] = None
    borderRadius: Optional[int] = None
    pointRadius: Optional[int] = None


class ChartData(BaseModel):
    labels: list[str]
    datasets: list[ChartDataset]


class ChatResponse(BaseModel):
    question: str
    generated_sql: str
    chart_type: str
    chart_data: Optional[dict] = None
    table_data: Optional[list[dict]] = None
    insights: str
    row_count: int
    execution_time_ms: float
    history_id: int
    csv_name: Optional[str] = None


class HistoryItem(BaseModel):
    id: int
    question: str
    generated_sql: str
    chart_type: str
    insights: str
    timestamp: datetime

    class Config:
        from_attributes = True


class HistoryDetail(HistoryItem):
    result_json: Optional[str] = None
