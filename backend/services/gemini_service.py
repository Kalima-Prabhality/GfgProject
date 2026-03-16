# backend/services/gemini_service.py

import json
import re
import logging
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_KEY:
    raise ValueError("GROQ_API_KEY missing in .env")

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

# ---------------- GROQ CALL ---------------- #
async def _gemini(prompt: str) -> str:
    if not GROQ_KEY:
        raise ValueError("GROQ_API_KEY missing in .env")
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq error: {e}")
        raise ValueError(f"Groq request failed: {e}")


# ---------------- NATURAL LANGUAGE TO SQL ---------------- #
async def natural_language_to_sql(question: str) -> dict:
    prompt = f"""You are a PostgreSQL expert for Nykaa beauty brand analytics.

DATABASE:
{SCHEMA}

QUESTION: "{question}"

STRICT AGGREGATION RULES — FOLLOW EXACTLY:
- revenue question → ROUND(SUM(revenue)::numeric, 2) AS total_revenue
- roi question     → ROUND(AVG(roi)::numeric, 2) AS avg_roi
- conversions      → SUM(conversions) AS total_conversions
- clicks           → SUM(clicks) AS total_clicks
- impressions      → SUM(impressions) AS total_impressions
- leads            → SUM(leads) AS total_leads
- acquisition_cost → ROUND(AVG(acquisition_cost)::numeric, 2) AS avg_acquisition_cost
- engagement_score → ROUND(AVG(engagement_score)::numeric, 2) AS avg_engagement_score
- NEVER use bare column names without aggregation when GROUP BY is present
- ALWAYS GROUP BY the category column
- ALWAYS ORDER BY the metric column DESC
- LIMIT 10

TIME TREND RULE:
If question involves time/trend/monthly:
  SELECT DATE_TRUNC('month', date) AS month, ROUND(SUM(revenue)::numeric, 2) AS total_revenue
  FROM campaigns
  GROUP BY DATE_TRUNC('month', date)
  ORDER BY DATE_TRUNC('month', date)

CHART TYPE RULES:
- bar: comparing categories (campaign_type, channel_used, language, target_audience, customer_segment)
- line: time trend (date column)
- pie: share/proportion 3-6 items
- doughnut: share/proportion 4-8 items
- radar: multiple metrics across categories
- area: cumulative over time
- table: raw records

RESPOND ONLY WITH THIS EXACT JSON — no markdown, no explanation, no extra text:

{{
  "sql": "<your SELECT query here>",
  "chart_type": "<bar|line|pie|doughnut|area|radar|table>",
  "x_axis": "<first column name in SELECT>",
  "y_axis": "<metric column alias like total_revenue>",
  "chart_title": "<short title>"
}}"""

    raw = await _gemini(prompt)
    logger.info(f"Groq raw: {raw[:300]}")

    clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    m = re.search(r'\{.*"sql".*\}', clean, re.DOTALL)
    if m:
        clean = m.group(0)

    result = json.loads(clean)
    sql = result.get("sql", "").strip()
    if not sql.upper().startswith("SELECT"):
        raise ValueError(f"Non-SELECT returned: {sql[:60]}")

    logger.info(f"SQL={sql} | chart={result.get('chart_type')} | x={result.get('x_axis')} | y={result.get('y_axis')}")
    return result


# ---------------- GENERATE INSIGHTS ---------------- #
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


# ---------------- DETERMINE CHART DATA ---------------- #
def determine_chart_data(data: list[dict], chart_type: str, x_axis: str, y_axis: str) -> dict:
    if not data:
        return None

    if chart_type == "table":
        return {"labels": [], "datasets": []}

    keys = list(data[0].keys())
    logger.info(f"Columns available: {keys}")
    logger.info(f"x_axis hint: '{x_axis}', y_axis hint: '{y_axis}'")

    # Pick x column — prefer text/category column
    x_col = x_axis if x_axis in keys else next(
        (k for k in keys if not is_number(str(data[0].get(k, "")))), keys[0]
    )

    # Pick y column — prefer the alias like total_revenue, avg_roi etc.
    preferred_y = ["total_revenue", "avg_roi", "total_conversions", "total_clicks",
                   "total_impressions", "total_leads", "avg_acquisition_cost", "avg_engagement_score"]

    y_col = None
    if y_axis in keys:
        y_col = y_axis
    else:
        for p in preferred_y:
            if p in keys:
                y_col = p
                break
    if not y_col:
        y_col = next((k for k in keys if k != x_col and is_number(str(data[0].get(k, 0)))), keys[-1])

    logger.info(f"Using x_col={x_col}, y_col={y_col}")

    labels, values = [], []
    for row in data:
        labels.append(str(row.get(x_col, ""))[:32])
        try:
            values.append(round(float(str(row.get(y_col, 0)).replace(",", "").strip()), 2))
        except Exception:
            values.append(0.0)

    logger.info(f"Final labels: {labels}")
    logger.info(f"Final values: {values}")

    # Nykaa color palettes
    SOLID = ["#9D0039","#C4004A","#E8005A","#FF4D8F","#6B0027","#FF79A8","#B8003F","#F50057","#800029","#FF1744","#D81B60","#F06292"]
    ALPHA = ["rgba(157,0,57,0.82)","rgba(196,0,74,0.82)","rgba(232,0,90,0.82)","rgba(255,77,143,0.82)","rgba(107,0,39,0.82)","rgba(255,121,168,0.82)","rgba(184,0,63,0.82)","rgba(245,0,87,0.82)","rgba(128,0,41,0.82)","rgba(255,23,68,0.82)","rgba(216,27,96,0.82)","rgba(240,98,146,0.82)"]

    if chart_type in ("pie", "doughnut"):
        return {
            "labels": labels,
            "datasets": [{"label": y_col, "data": values,
                          "backgroundColor": ALPHA[:len(values)],
                          "borderColor": SOLID[:len(values)],
                          "borderWidth": 2.5, "hoverOffset": 12}]
        }
    if chart_type == "radar":
        return {
            "labels": labels[:8],
            "datasets": [{"label": y_col, "data": values[:8],
                          "backgroundColor": "rgba(157,0,57,0.15)",
                          "borderColor": "#9D0039", "borderWidth": 2.5,
                          "pointBackgroundColor": "#9D0039",
                          "pointBorderColor": "#fff", "pointRadius": 5}]
        }
    if chart_type in ("line", "area"):
        return {
            "labels": labels,
            "datasets": [{"label": y_col, "data": values,
                          "backgroundColor": "rgba(157,0,57,0.10)",
                          "borderColor": "#9D0039", "borderWidth": 2.5,
                          "fill": chart_type == "area", "tension": 0.4,
                          "pointBackgroundColor": "#9D0039",
                          "pointBorderColor": "#fff", "pointBorderWidth": 2,
                          "pointRadius": 5, "pointHoverRadius": 8}]
        }
    # bar (default)
    return {
        "labels": labels,
        "datasets": [{"label": y_col, "data": values,
                      "backgroundColor": ALPHA[:len(values)],
                      "borderColor": SOLID[:len(values)],
                      "borderWidth": 0, "borderRadius": 10,
                      "borderSkipped": False}]
    }


# ---------------- HELPERS ---------------- #
def is_number(s):
    try:
        float(s)
        return True
    except Exception:
        return False