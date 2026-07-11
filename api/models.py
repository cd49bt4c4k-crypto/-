from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from datetime import datetime, timezone, timedelta
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(20), unique=True, index=True)
    position = Column(String(20))
    area = Column(String(20))
    status = Column(String(30))
    reputation = Column(Integer, default=50)
    is_ai = Column(Boolean, default=False)
    avatar_color = Column(String(7), default="#4F46E5")
    last_active = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))
    session_id = Column(String(100), unique=True, index=True)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    area = Column(String(20))
    message_type = Column(String(20), default="note")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class Gift(Base):
    __tablename__ = "gifts"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"))
    gift_type = Column(String(20))
    message = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    options = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class VoteRecord(Base):
    __tablename__ = "vote_records"

    id = Column(Integer, primary_key=True, index=True)
    vote_id = Column(Integer, ForeignKey("votes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    option_index = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class BossEvent(Base):
    __tablename__ = "boss_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(String(50))
    event_content = Column(String(200))
    reputation_change = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))


class ReputationRanking(Base):
    __tablename__ = "reputation_ranking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reputation = Column(Integer, default=0)
    rank_date = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone(timedelta(hours=8))))
