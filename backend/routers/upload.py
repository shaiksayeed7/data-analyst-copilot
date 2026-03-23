"""
File upload router.
Accepts CSV and Excel files, returns preview + cleaned data context.
"""

from __future__ import annotations

import io
import json
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.data_service import clean_dataframe, generate_summary, detect_anomalies, get_preview
from services.viz_service import auto_chart

router = APIRouter()

# In-memory session store (keyed by upload session)
# In production use Redis or a database
_sessions: dict[str, dict[str, Any]] = {}


def get_session(session_id: str) -> dict[str, Any]:
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a file first.")
    return _sessions[session_id]


@router.post("/")
async def upload_file(file: UploadFile = File(...)) -> JSONResponse:
    """Upload a CSV or Excel file and return analysis results."""
    filename = file.filename or "upload"
    content = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or Excel.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}") from e

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Clean the data
    df_clean, cleaning_report = clean_dataframe(df)

    # Generate analysis
    summary = generate_summary(df_clean)
    anomalies = detect_anomalies(df_clean)
    preview = get_preview(df_clean)

    # Generate charts
    charts = auto_chart(df_clean)

    # Store session (use filename as session key for simplicity)
    session_id = filename.replace(" ", "_").replace(".", "_")
    _sessions[session_id] = {
        "df_json": df_clean.to_json(orient="split", date_format="iso"),
        "summary": summary,
        "anomalies": anomalies,
        "cleaning_report": cleaning_report,
        "filename": filename,
        "columns": list(df_clean.columns),
    }

    return JSONResponse(content={
        "session_id": session_id,
        "filename": filename,
        "preview": preview,
        "summary": summary,
        "anomalies": anomalies,
        "cleaning_report": cleaning_report,
        "charts": charts,
    })


@router.get("/session/{session_id}")
def get_session_info(session_id: str) -> JSONResponse:
    """Retrieve stored session metadata."""
    session = get_session(session_id)
    return JSONResponse(content={
        "session_id": session_id,
        "filename": session.get("filename"),
        "columns": session.get("columns"),
        "summary": session.get("summary"),
    })
