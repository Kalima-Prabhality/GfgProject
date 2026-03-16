from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json, logging

from models.database import User, ChatHistory, get_db
from models.schemas import ChatRequest, ChatResponse
from services.auth_service import get_current_user
from services.gemini_service import natural_language_to_sql, generate_insights, determine_chart_data
from services.query_service import execute_query

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=ChatResponse)
async def query_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = payload.question.strip()
    if not question:
        raise HTTPException(400, "Question cannot be empty")

    logger.info(f"Question: {question}")

    # Step 1 — Gemini generates SQL
    try:
        ai = await natural_language_to_sql(question)
    except Exception as e:
        logger.error(f"Gemini failed: {e}")
        raise HTTPException(500, f"AI error: {str(e)}")

    sql        = ai.get("sql", "").strip()
    chart_type = ai.get("chart_type", "bar")
    x_axis     = ai.get("x_axis", "")
    y_axis     = ai.get("y_axis", "")

    logger.info(f"SQL: {sql}")
    logger.info(f"Chart: {chart_type}, x={x_axis}, y={y_axis}")

    # Step 2 — Run SQL on PostgreSQL (sync)
    try:
        data, exec_ms = await execute_query(db, sql)
    except ValueError as e:
        raise HTTPException(400, str(e))

    logger.info(f"Data rows: {len(data)}, sample: {data[:2]}")

    # Step 3 — Generate insights
    insights = await generate_insights(question, sql, data)

    # Step 4 — Build chart data
    chart_data = determine_chart_data(data, chart_type, x_axis, y_axis)

    logger.info(f"Chart type: {chart_type}")
    logger.info(f"Chart data: {chart_data}")
    logger.info(f"Chart data labels: {chart_data.get('labels', [])[:3] if chart_data else 'EMPTY'}")
    logger.info(f"Chart data values: {chart_data.get('datasets', [{}])[0].get('data', [])[:3] if chart_data else 'EMPTY'}")

    # Step 5 — Save history
    hist = ChatHistory(
        user_id=current_user.id,
        question=question,
        generated_sql=sql,
        result_json=json.dumps(data[:50], default=str),
        chart_type=chart_type,
        insights=insights,
    )
    db.add(hist)
    db.commit()
    db.refresh(hist)

    return ChatResponse(
        question=question,
        generated_sql=sql,
        chart_type=chart_type,
        chart_data=chart_data if chart_data else None,
        table_data=data[:20],
        insights=insights,
        row_count=len(data),
        execution_time_ms=round(exec_ms, 2),
        history_id=hist.id,
    )


@router.get("/suggestions")
async def suggestions(current_user: User = Depends(get_current_user)):
    return {"suggestions": [
        "Show top 5 campaign types by total revenue",
        "Which channel has the highest average ROI?",
        "Monthly revenue trend as a line chart",
        "Compare conversions by language",
        "Donut chart of revenue by campaign type",
        "Average acquisition cost by target audience",
    ]}