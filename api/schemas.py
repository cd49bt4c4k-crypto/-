from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    nickname: str = Field(min_length=2, max_length=10)
    position: str
    area: str
    status: str
    session_id: str


class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    position: Optional[str] = None
    area: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    nickname: str
    position: str
    area: str
    status: str
    reputation: int
    is_ai: bool
    avatar_color: str
    last_active: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str = Field(max_length=80)
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


class ChatCreate(BaseModel):
    content: str = Field(max_length=200)


class BossEventResponse(BaseModel):
    id: int
    event_type: str
    event_content: str
    reputation_change: int
    created_at: datetime

    class Config:
        from_attributes = True


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
