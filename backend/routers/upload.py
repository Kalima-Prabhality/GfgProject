from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os, csv, io, json, re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.database import User, get_db, engine
from services.auth_service import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploaded_csvs")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_SIZE = 1 * 1024 * 1024 * 1024


def csv_to_table_name(filename: str) -> str:
    name = filename.replace(".csv", "")
    name = re.sub(r"[^a-zA-Z0-9]", "_", name).lower()
    return f"csv_{name[:40]}"


def infer_type(values: list[str]) -> str:
    for v in values:
        if v.strip() == "":
            continue
        try:
            int(v.strip())
            return "BIGINT"
        except ValueError:
            pass
        try:
            float(v.strip())
            return "FLOAT"
        except ValueError:
            pass
    return "TEXT"


def load_csv_to_postgres(content: bytes, table_name: str, columns: list[str]):
    for encoding in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            text_content = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    reader = csv.DictReader(io.StringIO(text_content))
    rows = list(reader)
    if not rows:
        return

    # Sanitize column names
    safe_cols = [re.sub(r"[^a-zA-Z0-9]", "_", c).lower()[:50] for c in columns]

    # Infer types
    col_types = {}
    for i, col in enumerate(safe_cols):
        sample = [str(r.get(columns[i], "")) for r in rows[:100]]
        col_types[col] = infer_type(sample)

    with engine.connect() as conn:
        # Drop and recreate table
        conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
        col_defs = ", ".join(f'"{c}" {col_types[c]}' for c in safe_cols)
        conn.execute(text(f'CREATE TABLE "{table_name}" ({col_defs})'))

        # Insert rows in batches
        batch = []
        for row in rows:
            vals = {}
            for i, col in enumerate(safe_cols):
                raw = str(row.get(columns[i], "") or "").strip()
                if raw == "":
                    vals[col] = None
                elif col_types[col] == "BIGINT":
                    try: vals[col] = int(raw)
                    except: vals[col] = None
                elif col_types[col] == "FLOAT":
                    try: vals[col] = float(raw)
                    except: vals[col] = None
                else:
                    vals[col] = raw
            batch.append(vals)

            if len(batch) >= 500:
                placeholders = ", ".join(
                    f"({', '.join(f':{c}_{j}' for c in safe_cols)})"
                    for j in range(len(batch))
                )
                flat = {f"{c}_{j}": batch[j][c] for j in range(len(batch)) for c in safe_cols}
                insert_sql = f'INSERT INTO "{table_name}" ({", ".join(f"{chr(34)}{c}{chr(34)}" for c in safe_cols)}) VALUES ' + \
                    ", ".join(f"({', '.join(f':{c}_{j}' for c in safe_cols)})" for j in range(len(batch)))
                conn.execute(text(insert_sql), flat)
                batch = []

        if batch:
            flat = {f"{c}_{j}": batch[j][c] for j in range(len(batch)) for c in safe_cols}
            insert_sql = f'INSERT INTO "{table_name}" ({", ".join(f"{chr(34)}{c}{chr(34)}" for c in safe_cols)}) VALUES ' + \
                ", ".join(f"({', '.join(f':{c}_{j}' for c in safe_cols)})" for j in range(len(batch)))
            conn.execute(text(insert_sql), flat)

        conn.commit()


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are allowed.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(400, "Uploaded file is empty.")
    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum allowed size is 1 GB.")

    try:
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                text_content = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue

        reader  = csv.DictReader(io.StringIO(text_content))
        columns = list(reader.fieldnames or [])
        if not columns:
            raise HTTPException(400, "CSV has no column headers.")
        row_count = sum(1 for _ in reader)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {str(e)}")

    safe_name = "".join(c if (c.isalnum() or c in "._-") else "_" for c in file.filename)
    if not safe_name.lower().endswith(".csv"):
        safe_name += ".csv"

    save_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(content)

    # Load into PostgreSQL
    table_name = csv_to_table_name(safe_name)
    safe_cols  = [re.sub(r"[^a-zA-Z0-9]", "_", c).lower()[:50] for c in columns]

    try:
        load_csv_to_postgres(content, table_name, columns)
    except Exception as e:
        raise HTTPException(500, f"Failed to load CSV into database: {str(e)}")

    meta = {
        "name":        safe_name,
        "rows":        row_count,
        "columns":     safe_cols,
        "orig_columns": columns,
        "table_name":  table_name,
        "size_bytes":  len(content),
        "uploaded_at": datetime.now().isoformat(),
    }
    with open(save_path + ".meta.json", "w") as f:
        json.dump(meta, f)

    return {
        "name":       safe_name,
        "rows":       row_count,
        "columns":    safe_cols,
        "table_name": table_name,
        "size_mb":    round(len(content) / (1024 * 1024), 2),
    }


@router.get("/list")
async def list_uploads(current_user: User = Depends(get_current_user)):
    files = []
    try:
        for fname in os.listdir(UPLOAD_DIR):
            if fname.endswith(".meta.json"):
                try:
                    with open(os.path.join(UPLOAD_DIR, fname)) as f:
                        files.append(json.load(f))
                except Exception:
                    pass
    except Exception:
        pass
    return {"files": sorted(files, key=lambda x: x.get("uploaded_at", ""), reverse=True)}


@router.get("/meta/{filename}")
async def get_meta(filename: str, current_user: User = Depends(get_current_user)):
    safe = "".join(c if (c.isalnum() or c in "._-") else "_" for c in filename)
    path = os.path.join(UPLOAD_DIR, safe + ".meta.json")
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    with open(path) as f:
        return json.load(f)


@router.delete("/csv/{filename}")
async def delete_upload(filename: str, current_user: User = Depends(get_current_user)):
    safe = "".join(c if (c.isalnum() or c in "._-") else "_" for c in filename)
    meta_path = os.path.join(UPLOAD_DIR, safe + ".meta.json")

    # Drop table from postgres
    if os.path.exists(meta_path):
        try:
            with open(meta_path) as f:
                meta = json.load(f)
            table_name = meta.get("table_name")
            if table_name:
                with engine.connect() as conn:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
                    conn.commit()
        except Exception:
            pass

    for path in [os.path.join(UPLOAD_DIR, safe), meta_path]:
        if os.path.exists(path):
            os.remove(path)
    return {"deleted": safe}