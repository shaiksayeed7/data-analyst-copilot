"""
SQL generator router — convert natural language to SQL queries.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routers.upload import get_session
from services.ai_service import generate_sql

router = APIRouter()


class SQLRequest(BaseModel):
    session_id: str
    question: str


@router.post("/generate")
def generate_sql_query(req: SQLRequest) -> JSONResponse:
    """Convert a natural language question to a SQL query."""
    session = get_session(req.session_id)
    columns = session.get("columns", [])
    filename = session.get("filename", "dataset")
    # Use filename stem as table name
    table_name = filename.rsplit(".", 1)[0].replace(" ", "_").replace("-", "_").lower()

    try:
        sql = generate_sql(req.question, columns, table_name)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return JSONResponse(content={"sql": sql, "table_name": table_name, "columns": columns})
