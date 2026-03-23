"""
Analysis router — serve dataset statistics and charts.
"""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routers.upload import get_session
from services.data_service import get_preview
from services.viz_service import auto_chart, chart_from_query

router = APIRouter()


class ChartRequest(BaseModel):
    session_id: str
    chart_type: str
    x_col: str
    y_col: str | None = None


@router.get("/summary/{session_id}")
def get_summary(session_id: str) -> JSONResponse:
    session = get_session(session_id)
    return JSONResponse(content=session.get("summary", {}))


@router.get("/preview/{session_id}")
def get_data_preview(session_id: str, rows: int = 10) -> JSONResponse:
    session = get_session(session_id)
    df = _load_df(session)
    return JSONResponse(content=get_preview(df, rows=rows))


@router.get("/charts/{session_id}")
def get_charts(session_id: str) -> JSONResponse:
    session = get_session(session_id)
    df = _load_df(session)
    charts = auto_chart(df)
    return JSONResponse(content={"charts": charts})


@router.post("/chart")
def custom_chart(req: ChartRequest) -> JSONResponse:
    """Generate a specific chart based on user selection."""
    session = get_session(req.session_id)
    df = _load_df(session)

    if req.x_col not in df.columns:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Column '{req.x_col}' not found in dataset.")

    chart = chart_from_query(df, req.chart_type, req.x_col, req.y_col)
    return JSONResponse(content=chart)


def _load_df(session: dict) -> pd.DataFrame:
    import io
    return pd.read_json(io.StringIO(session["df_json"]), orient="split")
