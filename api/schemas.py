from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta


def format_beijing_time(v: datetime) -> str:
    if v is None:
        return ""
    if v.tzinfo is None:
        v = v.replace(tzinfo=timezone(timedelta(hours=8)))
    else:
        v = v.astimezone(timezone(timedelta(hours=8)))
    return v.strftime("%Y-%m-%d %H:%M:%S")


class UserCreate(BaseModel):
    nickname: str = Field(min_length=2, max_length=20)
    gender: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    position: str
    area: str
    status: str
    session_id: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    position: Optional[str] = None
    area: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    nickname: str
    gender: Optional[str] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    position: str
    area: str
    status: str
    reputation: int
    is_ai: bool
    avatar_color: str
    last_active: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: format_beijing_time}


class MessageCreate(BaseModel):
    content: str = Field(max_length=500)
    area: str
    message_type: str = "note"


class MessageResponse(BaseModel):
    id: int
    user_id: int
    nickname: str
    avatar_color: str
    content: str
    area: str
    message_type: str
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: format_beijing_time}


class GiftCreate(BaseModel):
    to_user_id: int
    gift_type: str
    message: Optional[str] = None


class GiftResponse(BaseModel):
    id: int
    from_user_id: int
    from_nickname: str
    to_user_id: int
    to_nickname: str
    gift_type: str
    message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: format_beijing_time}


class ComplaintCreate(BaseModel):
    content: str


class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    nickname: str
    avatar_color: str
    content: str
    likes: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: format_beijing_time}


class ChatCreate(BaseModel):
    content: str = Field(max_length=500)


class BossEventResponse(BaseModel):
    id: int
    event_type: str
    event_content: str
    reputation_change: int
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: format_beijing_time}


class RankingResponse(BaseModel):
    rank: int
    user_id: int
    nickname: str
    reputation: int
    avatar_color: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    online_users: int
    ai_users: int
    today_messages: int

    class Config:
        from_attributes = True
