"""
Data Analyst Copilot - FastAPI Backend
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import upload, chat, analysis, sql_gen, pdf

load_dotenv()

app = FastAPI(
    title="Data Analyst Copilot API",
    description="AI-powered data analysis backend",
    version="1.0.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(sql_gen.router, prefix="/api/sql", tags=["sql"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["pdf"])


@app.get("/")
def root():
    return {"message": "Data Analyst Copilot API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
