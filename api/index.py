import json
import os
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from .database import engine, Base, get_db
from . import models, schemas
from .sensitive_filter import filter_sensitive_words, contains_sensitive_word
from . import utils

Base.metadata.create_all(bind=engine)

app = FastAPI(title="虚拟职场共享办公", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def ensure_db_initialized(db: Session = Depends(get_db)):
    Base.metadata.create_all(bind=engine)
    init_ai_users(db)
    return db


@app.get("/")
def read_root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "虚拟职场共享办公 API 服务运行中"}


def get_current_user(session_id: str = Header(None), db: Session = Depends(get_db)):
    if not session_id:
        raise HTTPException(status_code=401, detail="未登录")
    
    user = db.query(models.User).filter(models.User.session_id == session_id).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    user.last_active = datetime.now()
    db.commit()
    return user


def get_or_create_user(session_id: str = Header(None), db: Session = Depends(get_db)):
    if not session_id:
        session_id = 'session_' + str(random.randint(100000, 999999))
    
    user = db.query(models.User).filter(models.User.session_id == session_id).first()
    
    if not user:
        guest_nicknames = ['匿名同事', '神秘访客', '职场新人', '实习生小王', '新入职员工', '打工人小李', '摸鱼大师', '代码狂人']
        random_nickname = guest_nicknames[random.randint(0, len(guest_nicknames) - 1)]
        
        user = models.User(
            nickname=random_nickname,
            position=utils.get_random_position(),
            area=utils.get_random_area(),
            status=utils.get_random_status(),
            reputation=50,
            is_ai=False,
            avatar_color=utils.get_random_avatar_color(),
            session_id=session_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    user.last_active = datetime.now()
    db.commit()
    return user


@app.get("/api/config")
def get_config():
    return {
        "positions": utils.POSITIONS,
        "areas": utils.AREAS,
        "statuses": utils.STATUSES,
        "gift_types": ["咖啡", "奶茶", "可乐", "零食", "鲜花"],
    }


@app.post("/api/users/register", response_model=schemas.UserResponse)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if contains_sensitive_word(user_data.nickname):
        raise HTTPException(status_code=400, detail="昵称包含敏感词，请修改")

    if not utils.validate_position(user_data.position):
        raise HTTPException(status_code=400, detail="无效的岗位")
    if not utils.validate_area(user_data.area):
        raise HTTPException(status_code=400, detail="无效的区域")
    if not utils.validate_status(user_data.status):
        raise HTTPException(status_code=400, detail="无效的状态")

    existing = db.query(models.User).filter(models.User.nickname == user_data.nickname).first()
    if existing:
        raise HTTPException(status_code=400, detail="昵称已被占用")

    existing_session = db.query(models.User).filter(models.User.session_id == user_data.session_id).first()
    if existing_session:
        existing_session.nickname = user_data.nickname
        existing_session.position = user_data.position
        existing_session.area = user_data.area
        existing_session.status = user_data.status
        db.commit()
        db.refresh(existing_session)
        return existing_session

    user = models.User(
        nickname=user_data.nickname,
        position=user_data.position,
        area=user_data.area,
        status=user_data.status,
        reputation=50,
        is_ai=False,
        avatar_color=utils.get_random_avatar_color(),
        session_id=user_data.session_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/users/me", response_model=schemas.UserResponse)
def get_my_info(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.put("/api/users/me", response_model=schemas.UserResponse)
def update_user(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_update.nickname is not None:
        if contains_sensitive_word(user_update.nickname):
            raise HTTPException(status_code=400, detail="昵称包含敏感词，请修改")
        existing = db.query(models.User).filter(
            models.User.nickname == user_update.nickname,
            models.User.id != current_user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="昵称已被占用")
        current_user.nickname = user_update.nickname

    if user_update.position is not None:
        if not utils.validate_position(user_update.position):
            raise HTTPException(status_code=400, detail="无效的岗位")
        current_user.position = user_update.position

    if user_update.area is not None:
        if not utils.validate_area(user_update.area):
            raise HTTPException(status_code=400, detail="无效的区域")
        if user_update.area == "靠窗黄金区" and current_user.reputation < 80:
            raise HTTPException(status_code=400, detail="声望不足80，无法使用靠窗黄金区工位")
        current_user.area = user_update.area

    if user_update.status is not None:
        if not utils.validate_status(user_update.status):
            raise HTTPException(status_code=400, detail="无效的状态")
        current_user.status = user_update.status

    db.commit()
    db.refresh(current_user)
    return current_user


@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(
    area: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.User)
    if area:
        query = query.filter(models.User.area == area)
    users = query.order_by(models.User.last_active.desc()).limit(100).all()
    return users


@app.post("/api/messages", response_model=schemas.MessageResponse)
def create_message(
    msg_data: schemas.MessageCreate,
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    filtered_text, has_sensitive = filter_sensitive_words(msg_data.content)
    if has_sensitive:
        raise HTTPException(status_code=400, detail="留言包含敏感词，请修改")

    message = models.Message(
        user_id=current_user.id,
        content=filtered_text,
        area=msg_data.area,
        message_type=msg_data.message_type,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    result = schemas.MessageResponse(
        id=message.id,
        user_id=message.user_id,
        nickname=current_user.nickname,
        avatar_color=current_user.avatar_color,
        content=message.content,
        area=message.area,
        message_type=message.message_type,
        created_at=message.created_at,
    )
    return result


@app.get("/api/messages", response_model=List[schemas.MessageResponse])
def get_messages(
    area: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(
        models.Message.id,
        models.Message.user_id,
        models.Message.content,
        models.Message.area,
        models.Message.message_type,
        models.Message.created_at,
        models.User.nickname,
        models.User.avatar_color,
    ).join(models.User, models.Message.user_id == models.User.id)

    if area:
        query = query.filter(models.Message.area == area)

    messages = query.order_by(models.Message.created_at.desc()).limit(limit).all()

    result = []
    for msg in messages:
        result.append(schemas.MessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            nickname=msg.nickname,
            avatar_color=msg.avatar_color,
            content=msg.content,
            area=msg.area,
            message_type=msg.message_type,
            created_at=msg.created_at,
        ))
    return result


@app.post("/api/gifts", response_model=schemas.GiftResponse)
def send_gift(
    gift_data: schemas.GiftCreate,
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    if gift_data.from_user_id == gift_data.to_user_id:
        raise HTTPException(status_code=400, detail="不能给自己送礼物")

    to_user = db.query(models.User).filter(models.User.id == gift_data.to_user_id).first()
    if not to_user:
        raise HTTPException(status_code=404, detail="目标用户不存在")

    if gift_data.gift_type not in ["咖啡", "奶茶", "可乐", "零食", "鲜花"]:
        raise HTTPException(status_code=400, detail="无效的礼物类型")

    gift = models.Gift(
        from_user_id=current_user.id,
        to_user_id=gift_data.to_user_id,
        gift_type=gift_data.gift_type,
        message=gift_data.message,
    )
    db.add(gift)
    db.commit()
    db.refresh(gift)

    to_user.reputation = min(100, to_user.reputation + 2)
    db.commit()

    result = schemas.GiftResponse(
        id=gift.id,
        from_user_id=gift.from_user_id,
        from_nickname=current_user.nickname,
        to_user_id=gift.to_user_id,
        to_nickname=to_user.nickname,
        gift_type=gift.gift_type,
        message=gift.message,
        created_at=gift.created_at,
    )
    return result


@app.get("/api/gifts/received")
def get_received_gifts(
    limit: int = 20,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    gifts = db.query(
        models.Gift.id,
        models.Gift.from_user_id,
        models.Gift.to_user_id,
        models.Gift.gift_type,
        models.Gift.message,
        models.Gift.created_at,
        models.User.nickname.label("from_nickname"),
    ).join(
        models.User, models.Gift.from_user_id == models.User.id
    ).filter(
        models.Gift.to_user_id == current_user.id
    ).order_by(models.Gift.created_at.desc()).limit(limit).all()

    result = []
    for g in gifts:
        result.append({
            "id": g.id,
            "from_user_id": g.from_user_id,
            "from_nickname": g.from_nickname,
            "gift_type": g.gift_type,
            "message": g.message,
            "created_at": g.created_at,
        })
    return result


@app.post("/api/complaints", response_model=schemas.ComplaintResponse)
def create_complaint(
    data: schemas.ComplaintCreate,
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    filtered_text, has_sensitive = filter_sensitive_words(data.content)
    if has_sensitive:
        raise HTTPException(status_code=400, detail="吐槽内容包含敏感词，请修改")

    complaint = models.Complaint(
        user_id=current_user.id,
        content=filtered_text,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    result = schemas.ComplaintResponse(
        id=complaint.id,
        user_id=complaint.user_id,
        nickname=current_user.nickname,
        avatar_color=current_user.avatar_color,
        content=complaint.content,
        likes=complaint.likes,
        created_at=complaint.created_at,
    )
    return result


@app.get("/api/complaints", response_model=List[schemas.ComplaintResponse])
def get_complaints(
    limit: int = 30,
    db: Session = Depends(get_db),
):
    complaints = db.query(
        models.Complaint.id,
        models.Complaint.user_id,
        models.Complaint.content,
        models.Complaint.likes,
        models.Complaint.created_at,
        models.User.nickname,
        models.User.avatar_color,
    ).join(
        models.User, models.Complaint.user_id == models.User.id
    ).order_by(models.Complaint.created_at.desc()).limit(limit).all()

    result = []
    for c in complaints:
        result.append(schemas.ComplaintResponse(
            id=c.id,
            user_id=c.user_id,
            nickname=c.nickname,
            avatar_color=c.avatar_color,
            content=c.content,
            likes=c.likes,
            created_at=c.created_at,
        ))
    return result


@app.post("/api/complaints/{complaint_id}/like")
def like_complaint(
    complaint_id: int,
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="吐槽不存在")
    complaint.likes += 1
    db.commit()
    return {"likes": complaint.likes}


@app.post("/api/chat", response_model=schemas.MessageResponse)
def send_chat_message(
    msg_data: schemas.ChatCreate,
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    filtered_text, has_sensitive = filter_sensitive_words(msg_data.content)
    if has_sensitive:
        raise HTTPException(status_code=400, detail="消息包含敏感词，请修改")

    message = models.Message(
        user_id=current_user.id,
        content=filtered_text,
        area="group_chat",
        message_type="chat",
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    result = schemas.MessageResponse(
        id=message.id,
        user_id=message.user_id,
        nickname=current_user.nickname,
        avatar_color=current_user.avatar_color,
        content=message.content,
        area="group_chat",
        message_type="chat",
        created_at=message.created_at,
    )
    return result


@app.get("/api/chat", response_model=List[schemas.MessageResponse])
def get_chat_messages(
    limit: int = 100,
    db: Session = Depends(get_db),
):
    messages = db.query(
        models.Message.id,
        models.Message.user_id,
        models.Message.content,
        models.Message.area,
        models.Message.message_type,
        models.Message.created_at,
        models.User.nickname,
        models.User.avatar_color,
    ).join(models.User, models.Message.user_id == models.User.id)\
     .filter(models.Message.message_type == "chat")\
     .order_by(models.Message.created_at.desc())\
     .limit(limit)\
     .all()

    result = []
    for msg in messages:
        result.append(schemas.MessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            nickname=msg.nickname,
            avatar_color=msg.avatar_color,
            content=msg.content,
            area=msg.area,
            message_type=msg.message_type,
            created_at=msg.created_at,
        ))
    return result


@app.post("/api/boss-office/enter", response_model=schemas.BossEventResponse)
def enter_boss_office(
    current_user: models.User = Depends(get_or_create_user),
    db: Session = Depends(get_db),
):
    event = utils.get_random_boss_event()

    current_user.reputation = max(0, min(100, current_user.reputation + event["reputation"]))
    db.commit()

    boss_event = models.BossEvent(
        user_id=current_user.id,
        event_type=event["type"],
        event_content=event["content"],
        reputation_change=event["reputation"],
    )
    db.add(boss_event)
    db.commit()
    db.refresh(boss_event)

    return boss_event


@app.get("/api/ranking/today", response_model=List[schemas.RankingResponse])
def get_today_ranking(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    today = datetime.now().strftime("%Y-%m-%d")
    users = db.query(models.User).filter(
        models.User.is_ai == False
    ).order_by(
        models.User.reputation.desc()
    ).limit(limit).all()

    result = []
    for idx, user in enumerate(users):
        result.append(schemas.RankingResponse(
            rank=idx + 1,
            user_id=user.id,
            nickname=user.nickname,
            reputation=user.reputation,
            avatar_color=user.avatar_color,
        ))
    return result


@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    five_minutes_ago = datetime.now() - timedelta(minutes=5)
    online_users = db.query(models.User).filter(
        models.User.is_ai == False,
        models.User.last_active >= five_minutes_ago,
    ).count()

    ai_users = db.query(models.User).filter(models.User.is_ai == True).count()

    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_messages = db.query(models.Message).filter(
        models.Message.created_at >= today_start
    ).count()

    return schemas.StatsResponse(
        online_users=online_users,
        ai_users=ai_users,
        today_messages=today_messages,
    )


@app.get("/api/rooftop/status")
def get_rooftop_status():
    now = datetime.now()
    hour = now.hour
    is_open = hour >= 21 or hour < 2
    return {
        "is_open": is_open,
        "current_hour": hour,
        "message": "天台吸烟区仅21:00-凌晨2:00开放" if not is_open else "天台开放中，注意安全~",
    }


@app.post("/api/ai/action")
def ai_action(db: Session = Depends(get_db)):
    """
    触发AI同事的随机行为：切换状态、发布留言、互相赠送礼物
    由前端定时调用，模拟AI活跃度
    """
    try:
        ai_users = db.query(models.User).filter(models.User.is_ai == True).all()
        if not ai_users:
            return {"performed": 0}

        actions_performed = 0
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()

        active_ais = random.sample(ai_users, min(random.randint(2, 5), len(ai_users)))

        for ai_user in active_ais:
            action_type = random.choice(["status", "message", "gift", "move", "complaint"])

            if action_type == "status":
                new_status = utils.get_random_status()
                if weekday == 0 and hour < 12 and random.random() < 0.6:
                    new_status = "带薪发呆"
                if weekday == 4 and hour >= 17 and random.random() < 0.5:
                    new_status = "摸鱼刷论坛"
                
                ai_user.status = new_status
                ai_user.last_active = now
                actions_performed += 1

            elif action_type == "message":
                if hour >= 21 or hour < 6:
                    continue
                
                note = utils.generate_random_note()
                filtered_text, has_sensitive = filter_sensitive_words(note)
                if not has_sensitive:
                    msg = models.Message(
                        user_id=ai_user.id,
                        content=filtered_text,
                        area=ai_user.area,
                        message_type="note",
                    )
                    db.add(msg)
                    ai_user.last_active = now
                    actions_performed += 1

            elif action_type == "gift" and len(ai_users) > 1:
                other_users = [u for u in ai_users if u.id != ai_user.id]
                if other_users:
                    target = random.choice(other_users)
                    gift_type = random.choice(["咖啡", "奶茶", "可乐", "零食", "鲜花"])
                    gift = models.Gift(
                        from_user_id=ai_user.id,
                        to_user_id=target.id,
                        gift_type=gift_type,
                        message=None,
                    )
                    db.add(gift)
                    target.reputation = min(100, target.reputation + 1)
                    ai_user.last_active = now
                    actions_performed += 1

            elif action_type == "move":
                areas = utils.AREAS.copy()
                if ai_user.reputation < 80 and "靠窗黄金区" in areas:
                    areas.remove("靠窗黄金区")
                
                if hour >= 21 or hour < 6:
                    if "地下加班区" not in areas:
                        areas.append("地下加班区")
                    if random.random() < 0.4:
                        new_area = "地下加班区"
                    else:
                        new_area = random.choice(areas)
                elif 12 <= hour <= 14:
                    if random.random() < 0.3:
                        new_area = "茶水间" if "茶水间" in areas else random.choice(areas)
                    else:
                        new_area = random.choice(areas)
                else:
                    new_area = random.choice(areas)
                
                if new_area in utils.AREAS:
                    ai_user.area = new_area
                    ai_user.last_active = now
                    actions_performed += 1

            elif action_type == "complaint":
                if random.random() < 0.3:
                    complaint_text = utils.generate_random_complaint()
                    filtered_text, has_sensitive = filter_sensitive_words(complaint_text)
                    if not has_sensitive:
                        complaint = models.Complaint(
                            user_id=ai_user.id,
                            content=filtered_text,
                        )
                        db.add(complaint)
                        ai_user.last_active = now
                        actions_performed += 1

        db.commit()
        cleanup_old_messages(db)
        
        return {"performed": actions_performed}
    except Exception as e:
        db.rollback()
        print(f"AI action error: {e}")
        return {"performed": 0, "error": str(e)}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
    }


def init_ai_users(db: Session):
    ai_count = db.query(models.User).filter(models.User.is_ai == True).count()
    if ai_count < 15:
        used_names = [u.nickname for u in db.query(models.User).all()]
        available_names = [n for n in utils.AI_NAMES if n not in used_names]

        for i in range(min(15 - ai_count, len(available_names))):
            name = available_names[i]
            user = models.User(
                nickname=name,
                position=utils.get_random_position(),
                area=utils.get_random_area(),
                status=utils.get_random_status(),
                reputation=random.randint(30, 90),
                is_ai=True,
                avatar_color=utils.get_random_avatar_color(),
                session_id=f"ai_{name}_{i}",
            )
            db.add(user)
        db.commit()


def cleanup_old_messages(db: Session):
    total = db.query(models.Message).count()
    if total > 450:
        delete_count = total - 450
        subquery = db.query(models.Message.id).order_by(
            models.Message.created_at.asc()
        ).limit(delete_count).subquery()
        db.query(models.Message).filter(models.Message.id.in_(subquery)).delete(
            synchronize_session=False
        )
        db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        init_ai_users(db)
        cleanup_old_messages(db)
    except Exception as e:
        print(f"Startup error: {e}")
    finally:
        db.close()


@app.middleware("http")
async def ensure_ai_users_middleware(request: Request, call_next):
    try:
        db = next(get_db())
        init_ai_users(db)
        db.close()
    except Exception:
        pass
    response = await call_next(request)
    return response
