import httpx
import json
import re
import logging
from models.database import settings

logger = logging.getLogger(__name__)

GEMINI_KEY = settings.GEMINI_API_KEY
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
SCHEMA = """
PostgreSQL table: campaigns
Exact column names (use as-is, lowercase):
  campaign_id      TEXT
  campaign_type    TEXT   (Social Media, Paid Ads, Influencer, Email)
  target_audience  TEXT   (College Students, Working Women, Tier 2 City Customers, Youth)
  duration         INTEGER
  channel_used     TEXT   (YouTube, Instagram, WhatsApp, Facebook, Google, Twitter)
  impressions      INTEGER
  clicks           INTEGER
  leads            INTEGER
  conversions      INTEGER
  revenue          FLOAT
  acquisition_cost FLOAT
  roi              FLOAT
  language         TEXT   (Hindi, English, Tamil, Telugu, Bengali)
  engagement_score FLOAT
  customer_segment TEXT
  date             TIMESTAMP
"""

async def _gemini(prompt: str) -> str:
    if not GEMINI_KEY:
        raise ValueError("GEMINI_API_KEY missing in .env")
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024}
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(GEMINI_URL, json=payload)
        if r.status_code != 200:
            raise ValueError(f"Gemini HTTP {r.status_code}: {r.text[:200]}")
        d = r.json()
        return d["candidates"][0]["content"]["parts"][0]["text"].strip()


async def natural_language_to_sql(question: str) -> dict:
    prompt = f"""You are a PostgreSQL expert for Nykaa beauty brand analytics.

DATABASE:
{SCHEMA}

QUESTION: "{question}"

Write a PostgreSQL SELECT query that answers the question exactly.

RULES:
1. Only SELECT — never INSERT/UPDATE/DELETE/DROP
2. Use exact column names from schema above
3. ROUND(value::numeric, 2) for float aggregations
4. Always GROUP BY for aggregations
5. ORDER BY main metric DESC
6. LIMIT 12 max
7. Return ONLY the JSON below — no markdown no explanation

CHART RULES:
- bar: comparing named categories (campaign_type, channel_used, language, target_audience, customer_segment)
- line: time trend (involves date column, GROUP BY month/year)
- pie: share/proportion, 3-6 items
- doughnut: share/proportion, 4-8 items
- radar: multiple metrics across categories (3-8 items)
- area: cumulative over time
- table: raw records, no single metric

RESPOND ONLY WITH THIS JSON:
{{
  "sql": "SELECT campaign_type, ROUND(SUM(revenue)::numeric,2) AS total_revenue FROM campaigns GROUP BY campaign_type ORDER BY total_revenue DESC LIMIT 10",
  "chart_type": "bar",
  "x_axis": "campaign_type",
  "y_axis": "total_revenue",
  "chart_title": "Revenue by Campaign Type"
}}"""

    raw = await _gemini(prompt)
    logger.info(f"Gemini raw: {raw[:300]}")

    clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    m = re.search(r'\{[^{}]*"sql"[^{}]*\}', clean, re.DOTALL)
    if m:
        clean = m.group(0)

    result = json.loads(clean)
    sql = result.get("sql", "").strip()
    if not sql.upper().startswith("SELECT"):
        raise ValueError(f"Non-SELECT returned: {sql[:60]}")

    logger.info(f"SQL={sql} | chart={result.get('chart_type')} | x={result.get('x_axis')} | y={result.get('y_axis')}")
    return result


async def generate_insights(question: str, sql: str, data: list[dict]) -> str:
    if not data:
        return "No data returned. Try rephrasing your question."
    sample = json.dumps(data[:10], default=str)
    prompt = f"""You are a senior analyst for Nykaa beauty brand.

Question: "{question}"
SQL: {sql}
Data ({len(data)} rows): {sample}

Write exactly 3 bullet insights:
- Start each with -
- Bold key terms with **bold**
- Include real numbers from the data
- Be specific and actionable
- Max 120 words total"""
    try:
        return await _gemini(prompt)
    except Exception as e:
        logger.error(f"Insights error: {e}")
        return f"- **{len(data)} records** matched your query. Review the chart above for key patterns and trends."


def determine_chart_data(data: list[dict], chart_type: str, x_axis: str, y_axis: str) -> dict:
    if not data or chart_type == "table":
        return {}

    keys = list(data[0].keys())
    logger.info(f"Columns available: {keys}")
    logger.info(f"x_axis hint: '{x_axis}', y_axis hint: '{y_axis}'")

    # Find X col — prefer exact match, then first text column
    x_col = None
    if x_axis and x_axis in keys:
        x_col = x_axis
    else:
        for k in keys:
            v = str(data[0].get(k, ""))
            try:
                float(v)
            except (ValueError, TypeError):
                if v.strip() not in ("", "None", "null"):
                    x_col = k
                    break
    if not x_col:
        x_col = keys[0]

    # Find Y col — prefer exact match, then first numeric column != x
    y_col = None
    if y_axis and y_axis in keys:
        y_col = y_axis
    else:
        for k in keys:
            if k == x_col:
                continue
            v = str(data[0].get(k, "0")).replace(",", "").strip()
            try:
                float(v)
                y_col = k
                break
            except (ValueError, TypeError):
                continue
    if not y_col:
        others = [k for k in keys if k != x_col]
        y_col = others[0] if others else keys[-1]

    logger.info(f"Final: x_col={x_col}, y_col={y_col}")

    labels, values = [], []
    for row in data:
        labels.append(str(row.get(x_col, ""))[:32])
        raw = str(row.get(y_col, "0") or "0").replace(",", "").strip()
        try:
            values.append(round(float(raw), 2))
        except (ValueError, TypeError):
            values.append(0.0)

    logger.info(f"Labels: {labels[:4]}")
    logger.info(f"Values: {values[:4]}")

    n = len(values)
    y_label = y_col.replace("_", " ").title()

    # Deep wine red + pink palette matching Nykaa brand
    SOLID = ["#9D0039","#C4004A","#E8005A","#FF4D8F","#6B0027","#FF79A8","#B8003F","#F50057","#800029","#FF1744","#D81B60","#F06292"]
    ALPHA = ["rgba(157,0,57,0.82)","rgba(196,0,74,0.82)","rgba(232,0,90,0.82)","rgba(255,77,143,0.82)","rgba(107,0,39,0.82)","rgba(255,121,168,0.82)","rgba(184,0,63,0.82)","rgba(245,0,87,0.82)","rgba(128,0,41,0.82)","rgba(255,23,68,0.82)","rgba(216,27,96,0.82)","rgba(240,98,146,0.82)"]

    if chart_type in ("pie", "doughnut"):
        return {
            "labels": labels,
            "datasets": [{"label": y_label, "data": values,
                "backgroundColor": ALPHA[:n], "borderColor": SOLID[:n],
                "borderWidth": 2.5, "hoverOffset": 12}]
        }

    if chart_type == "radar":
        return {
            "labels": labels[:8],
            "datasets": [{"label": y_label, "data": values[:8],
                "backgroundColor": "rgba(157,0,57,0.15)", "borderColor": "#9D0039",
                "borderWidth": 2.5, "pointBackgroundColor": "#9D0039",
                "pointBorderColor": "#fff", "pointRadius": 5}]
        }

    if chart_type in ("line", "area"):
        return {
            "labels": labels,
            "datasets": [{"label": y_label, "data": values,
                "backgroundColor": "rgba(157,0,57,0.10)", "borderColor": "#9D0039",
                "borderWidth": 2.5, "fill": chart_type == "area", "tension": 0.4,
                "pointBackgroundColor": "#9D0039", "pointBorderColor": "#fff",
                "pointBorderWidth": 2, "pointRadius": 5, "pointHoverRadius": 8}]
        }

    # Bar — each bar its own Nykaa color
    return {
        "labels": labels,
        "datasets": [{"label": y_label, "data": values,
            "backgroundColor": ALPHA[:n], "borderColor": SOLID[:n],
            "borderWidth": 0, "borderRadius": 10, "borderSkipped": False}]
    }