import re, time, logging
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)

BLOCKED = ["INSERT","UPDATE","DELETE","DROP","CREATE","ALTER","TRUNCATE",
           "GRANT","REVOKE","EXECUTE","EXEC","xp_cmdshell","COPY","pg_read_file"]


def is_safe_query(sql: str) -> tuple[bool, str]:
    up = sql.upper().strip()
    if not up.startswith("SELECT"):
        return False, "Only SELECT queries allowed."
    for kw in BLOCKED:
        if re.search(r'\b' + re.escape(kw) + r'\b', up):
            return False, f"Blocked keyword: {kw}"
    if "PG_" in up or "INFORMATION_SCHEMA" in up:
        return False, "System tables blocked."
    tables = re.findall(r'\bFROM\s+([a-zA-Z_]+)', up) + re.findall(r'\bJOIN\s+([a-zA-Z_]+)', up)
    for t in tables:
        if t.lower() not in ("campaigns",):
            return False, f"Table '{t}' not allowed."
    return True, ""


def execute_query_sync(db: Session, sql: str) -> tuple[list[dict], float]:
    ok, reason = is_safe_query(sql)
    if not ok:
        raise ValueError(reason)
    if "LIMIT" not in sql.upper():
        sql = sql.rstrip(";") + " LIMIT 50"
    start = time.time()
    try:
        result  = db.execute(text(sql))
        rows    = result.fetchall()
        columns = list(result.keys())
        elapsed = (time.time() - start) * 1000
        data = []
        for row in rows:
            rd = {}
            for col, val in zip(columns, row):
                if val is None:
                    rd[col] = None
                elif hasattr(val, "isoformat"):
                    rd[col] = val.isoformat()
                elif isinstance(val, (int, float)):
                    rd[col] = round(float(val), 4)
                else:
                    rd[col] = str(val)
            data.append(rd)
        logger.info(f"Query OK: {len(data)} rows in {elapsed:.1f}ms | {sql[:80]}")
        return data, elapsed
    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise ValueError(f"Query failed: {str(e)}")


# Alias so both names work
async def execute_query(db: Session, sql: str) -> tuple[list[dict], float]:
    return execute_query_sync(db, sql)