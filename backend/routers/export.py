from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import json
import csv
import io
from datetime import datetime

from models.database import User, ChatHistory, get_db, settings

router = APIRouter()


def get_user_from_token(token: str, db: Session) -> User:
    credentials_exception = HTTPException(status_code=401, detail="Invalid token")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise credentials_exception
    return user


@router.get("/csv/{history_id}")
def export_csv(
    history_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    current_user = get_user_from_token(token, db)
    item = db.query(ChatHistory).filter(
        ChatHistory.id == history_id,
        ChatHistory.user_id == current_user.id,
    ).first()
    if not item or not item.result_json:
        raise HTTPException(status_code=404, detail="History item not found")

    data = json.loads(item.result_json)
    if not data:
        raise HTTPException(status_code=404, detail="No data to export")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)

    filename = f"nykaa_bi_{history_id}_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/pdf/{history_id}")
def export_pdf(
    history_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    from reportlab.lib.pagesizes import landscape, letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors

    current_user = get_user_from_token(token, db)
    item = db.query(ChatHistory).filter(
        ChatHistory.id == history_id,
        ChatHistory.user_id == current_user.id,
    ).first()
    if not item or not item.result_json:
        raise HTTPException(status_code=404, detail="History item not found")

    data = json.loads(item.result_json)
    if not data:
        raise HTTPException(status_code=404, detail="No data to export")

    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    styles = getSampleStyleSheet()
    elems  = []

    elems.append(Paragraph("Nykaa BI Dashboard — Query Report", styles["Title"]))
    elems.append(Spacer(1, 12))
    elems.append(Paragraph(f"Question: {item.question}", styles["Normal"]))
    elems.append(Spacer(1, 8))
    elems.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elems.append(Spacer(1, 16))

    if item.generated_sql:
        elems.append(Paragraph("SQL Query:", styles["Heading3"]))
        elems.append(Paragraph(item.generated_sql, styles["Code"]))
        elems.append(Spacer(1, 16))

    if item.insights:
        elems.append(Paragraph("AI Insights:", styles["Heading3"]))
        elems.append(Paragraph(item.insights.replace("**", ""), styles["Normal"]))
        elems.append(Spacer(1, 16))

    cols  = list(data[0].keys())
    tdata = [cols] + [[str(row.get(c, "")) for c in cols] for row in data[:30]]
    col_w = 720 / max(len(cols), 1)
    t     = Table(tdata, colWidths=[col_w] * len(cols))
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0), colors.HexColor("#FF3F6C")),
        ("TEXTCOLOR",      (0, 0), (-1, 0), colors.white),
        ("FONTNAME",       (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",       (0, 0), (-1, -1), 8),
        ("GRID",           (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF0F3")]),
        ("ALIGN",          (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",        (0, 0), (-1, -1), 5),
    ]))
    elems.append(Paragraph("Results (first 30 rows):", styles["Heading3"]))
    elems.append(Spacer(1, 6))
    elems.append(t)

    doc.build(elems)
    buffer.seek(0)

    filename = f"nykaa_bi_report_{history_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        iter([buffer.read()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )