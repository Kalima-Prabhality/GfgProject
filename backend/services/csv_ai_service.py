import json
import re
import logging
from services.gemini_service import _gemini

logger = logging.getLogger(__name__)


async def csv_natural_language_to_sql(question: str, table_name: str, columns: list[str]) -> dict:
    cols_str = ", ".join(columns)
    prompt = f"""You are a PostgreSQL expert analyzing a custom dataset.

TABLE: {table_name}
COLUMNS: {cols_str}

QUESTION: "{question}"

RULES:
1. Only SELECT queries
2. Use exact column names from the list above
3. For aggregations use aliases: SUM(col) AS total_col, AVG(col) AS avg_col
4. Always GROUP BY for aggregations
5. ORDER BY main metric DESC
6. LIMIT 20 max
7. ROUND floats to 2 decimal places
8. Return ONLY this JSON — no markdown no explanation

CHART RULES:
- bar: comparing categories
- line: time trends
- pie: proportions 3-6 items
- doughnut: proportions 4-8 items
- table: raw records

RESPOND ONLY WITH:
{{
  "sql": "<SELECT query>",
  "chart_type": "<bar|line|pie|doughnut|area|radar|table>",
  "x_axis": "<first column in SELECT>",
  "y_axis": "<numeric metric column>",
  "chart_title": "<short title>"
}}"""

    raw = await _gemini(prompt)
    clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    m = re.search(r'\{.*"sql".*\}', clean, re.DOTALL)
    if m:
        clean = m.group(0)

    result = json.loads(clean)
    sql = result.get("sql", "").strip()
    if not sql.upper().startswith("SELECT"):
        raise ValueError(f"Non-SELECT returned: {sql[:60]}")

    # Fix table name in case AI used wrong name
    result["sql"] = re.sub(
        r'\bFROM\s+\w+', f'FROM "{table_name}"', result["sql"], flags=re.IGNORECASE
    )
    return result