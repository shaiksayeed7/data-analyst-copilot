"""
Chat router — AI conversation about the uploaded dataset.
"""

from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routers.upload import get_session
from services.ai_service import answer_question, generate_insights
from services.viz_service import auto_chart

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: list[dict[str, str]] = []
    ceo_mode: bool = False


class InsightsRequest(BaseModel):
    session_id: str
    ceo_mode: bool = False


@router.post("/message")
def chat_message(req: ChatRequest) -> JSONResponse:
    """Send a message about the dataset and get an AI response."""
    session = get_session(req.session_id)

    dataset_context: dict[str, Any] = {
        "summary": session.get("summary", {}),
        "anomalies": session.get("anomalies", []),
        "cleaning_report": session.get("cleaning_report", {}),
    }
    # Merge summary fields for easier AI access
    dataset_context.update(session.get("summary", {}))
    dataset_context["anomalies"] = session.get("anomalies", [])
    dataset_context["cleaning_report"] = session.get("cleaning_report", {})

    try:
        answer = answer_question(
            question=req.message,
            dataset_context=dataset_context,
            history=req.history,
            ceo_mode=req.ceo_mode,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    # Check if the answer implies a chart should be shown
    charts: list[dict] = []
    lower_msg = req.message.lower()
    chart_keywords = ["chart", "graph", "plot", "visuali", "trend", "show me", "bar", "pie", "line"]
    if any(kw in lower_msg for kw in chart_keywords):
        df = _load_df(session)
        charts = auto_chart(df)

    return JSONResponse(content={"answer": answer, "charts": charts})


@router.post("/insights")
def get_insights(req: InsightsRequest) -> JSONResponse:
    """Generate AI business insights for the uploaded dataset."""
    session = get_session(req.session_id)

    dataset_context: dict[str, Any] = {}
    dataset_context.update(session.get("summary", {}))
    dataset_context["anomalies"] = session.get("anomalies", [])
    dataset_context["cleaning_report"] = session.get("cleaning_report", {})

    try:
        insights = generate_insights(dataset_context, ceo_mode=req.ceo_mode)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return JSONResponse(content={"insights": insights})


def _load_df(session: dict[str, Any]) -> pd.DataFrame:
    """Reconstruct dataframe from session JSON."""
    import io
    return pd.read_json(io.StringIO(session["df_json"]), orient="split")
