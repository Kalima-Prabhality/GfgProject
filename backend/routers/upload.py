from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os, csv, io, json
from datetime import datetime
from models.database import User
from services.auth_service import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploaded_csvs")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_SIZE = 1 * 1024 * 1024 * 1024  # 1 GB


@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are allowed.")

    # ── Read entire file into memory first ──────────────────
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    if len(content) > MAX_SIZE:
        raise HTTPException(400, "File too large. Maximum allowed size is 1 GB.")

    # ── Parse CSV to get columns + row count ────────────────
    try:
        # Try utf-8-sig first (handles BOM), then fallback to latin-1
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                text = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise HTTPException(400, "Could not decode CSV file. Please save it as UTF-8.")

        # Get column headers
        reader  = csv.DictReader(io.StringIO(text))
        columns = list(reader.fieldnames or [])

        if not columns:
            raise HTTPException(400, "CSV has no column headers in the first row.")

        # Count rows by iterating (memory-efficient)
        row_count = sum(1 for _ in reader)   # counts data rows only

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {str(e)}")

    # ── Save file ────────────────────────────────────────────
    safe_name = "".join(
        c if (c.isalnum() or c in "._-") else "_"
        for c in file.filename
    )
    if not safe_name.lower().endswith(".csv"):
        safe_name += ".csv"

    save_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(save_path, "wb") as f:
        f.write(content)

    # ── Save metadata ────────────────────────────────────────
    meta = {
        "name":        safe_name,
        "rows":        row_count,
        "columns":     columns,
        "size_bytes":  len(content),
        "uploaded_at": datetime.now().isoformat(),
    }
    with open(save_path + ".meta.json", "w") as f:
        json.dump(meta, f)

    return {
        "name":    safe_name,
        "rows":    row_count,
        "columns": columns,
        "size_mb": round(len(content) / (1024 * 1024), 2),
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


@router.delete("/csv/{filename}")
async def delete_upload(filename: str, current_user: User = Depends(get_current_user)):
    safe = "".join(c if (c.isalnum() or c in "._-") else "_" for c in filename)
    for path in [
        os.path.join(UPLOAD_DIR, safe),
        os.path.join(UPLOAD_DIR, safe + ".meta.json"),
    ]:
        if os.path.exists(path):
            os.remove(path)
    return {"deleted": safe}