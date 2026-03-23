"""
PDF export router.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from routers.upload import get_session
from services.ai_service import generate_insights
from services.pdf_service import generate_insights_pdf

router = APIRouter()


class PDFRequest(BaseModel):
    session_id: str
    ceo_mode: bool = False


@router.post("/download")
def download_pdf(req: PDFRequest) -> Response:
    """Generate and return a PDF insights report."""
    session = get_session(req.session_id)

    dataset_context: dict = {}
    dataset_context.update(session.get("summary", {}))
    dataset_context["anomalies"] = session.get("anomalies", [])
    dataset_context["cleaning_report"] = session.get("cleaning_report", {})

    try:
        insights_text = generate_insights(dataset_context, ceo_mode=req.ceo_mode)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    filename = session.get("filename", "dataset")
    pdf_bytes = generate_insights_pdf(insights_text, session.get("summary", {}), filename=filename)

    safe_name = filename.rsplit(".", 1)[0].replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_insights.pdf"'},
    )
