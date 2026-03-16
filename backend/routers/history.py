from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from models.database import User, ChatHistory, get_db
from models.schemas import HistoryItem, HistoryDetail
from services.auth_service import get_current_user

router = APIRouter()


@router.get("/", response_model=list[HistoryItem])
def get_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(min(limit, 100))
        .all()
    )
    return [HistoryItem.model_validate(i) for i in items]


@router.get("/{history_id}", response_model=HistoryDetail)
def get_history_item(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ChatHistory).filter(
        ChatHistory.id == history_id,
        ChatHistory.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return HistoryDetail.model_validate(item)


@router.delete("/{history_id}", status_code=204)
def delete_history_item(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ChatHistory).filter(
        ChatHistory.id == history_id,
        ChatHistory.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
