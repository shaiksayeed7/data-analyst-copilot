"""
AI service: OpenAI integration for chat, insights, and SQL generation.
"""

from __future__ import annotations

import os
from typing import Any

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key)
    return _client


def _chat(system: str, user: str, model: str = "gpt-4o-mini") -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def answer_question(
    question: str,
    dataset_context: dict[str, Any],
    history: list[dict[str, str]] | None = None,
    ceo_mode: bool = False,
) -> str:
    """Answer a user question about the dataset."""
    system = (
        "You are an expert data analyst assistant. "
        "The user has uploaded a dataset and is asking questions about it. "
        "You have access to the dataset summary below. "
        "Be concise, accurate, and helpful. "
        "If the user asks for charts or visualizations, describe what chart would best answer the question. "
    )
    if ceo_mode:
        system += (
            "\n\nIMPORTANT: The user clicked 'Explain like I'm CEO'. "
            "Give a high-level, executive summary in plain business language. "
            "Focus on business impact, key numbers, and actionable decisions. "
            "Avoid technical jargon. Use bullet points for clarity."
        )

    context_str = _format_context(dataset_context)
    full_user = f"Dataset context:\n{context_str}\n\nQuestion: {question}"

    client = _get_client()
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history[-8:])  # Keep last 8 turns for context
    messages.append({"role": "user", "content": full_user})

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,  # type: ignore[arg-type]
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def generate_insights(dataset_context: dict[str, Any], ceo_mode: bool = False) -> str:
    """Generate AI business insights from the dataset."""
    system = (
        "You are a senior business analyst. "
        "Analyze the provided dataset summary and generate actionable business insights. "
        "Structure your response with these sections:\n"
        "1. **Key Trends** - What patterns are emerging?\n"
        "2. **Unusual Patterns / Anomalies** - What stands out as unusual?\n"
        "3. **Actionable Recommendations** - What should the business do?\n"
        "Be specific, use numbers from the data, and keep it professional."
    )
    if ceo_mode:
        system = (
            "You are advising a CEO. Provide a crisp executive summary of the dataset. "
            "Use plain English, focus on business impact and decisions. "
            "Structure:\n"
            "1. **Executive Summary** (2-3 sentences)\n"
            "2. **Top 3 Opportunities**\n"
            "3. **Top 3 Risks**\n"
            "4. **Recommended Actions**\n"
            "No technical jargon. Be direct and concise."
        )

    context_str = _format_context(dataset_context)
    user = f"Dataset summary:\n{context_str}\n\nGenerate comprehensive insights."

    return _chat(system, user)


def generate_sql(question: str, columns: list[str], table_name: str = "dataset") -> str:
    """Convert natural language to SQL query."""
    system = (
        "You are an expert SQL developer. Convert the user's natural language question into a valid SQL query. "
        "Return ONLY the SQL query, no explanation. "
        f"The table is named '{table_name}' and has these columns: {', '.join(columns)}. "
        "Use standard SQL syntax compatible with SQLite."
    )
    user = f"Question: {question}\n\nWrite a SQL query to answer this question."
    return _chat(system, user)


def _format_context(ctx: dict[str, Any]) -> str:
    """Format dataset context dict into a readable string for the AI."""
    parts: list[str] = []

    shape = ctx.get("shape", {})
    if shape:
        parts.append(f"Dataset: {shape.get('rows', '?')} rows × {shape.get('columns', '?')} columns")

    columns = ctx.get("columns", [])
    if columns:
        col_names = [c.get("name", "") if isinstance(c, dict) else str(c) for c in columns]
        parts.append(f"Columns: {', '.join(col_names)}")

    num_summary = ctx.get("numeric_summary", {})
    if num_summary:
        parts.append("Numeric column statistics:")
        for col, stats in list(num_summary.items())[:6]:
            parts.append(
                f"  {col}: mean={stats.get('mean')}, min={stats.get('min')}, max={stats.get('max')}, std={stats.get('std')}"
            )

    cat_summary = ctx.get("categorical_summary", {})
    if cat_summary:
        parts.append("Categorical columns:")
        for col, info in list(cat_summary.items())[:4]:
            top = list(info.get("top_values", {}).keys())[:3]
            parts.append(f"  {col}: {info.get('unique_count')} unique values, top: {', '.join(str(v) for v in top)}")

    anomalies = ctx.get("anomalies", [])
    if anomalies:
        parts.append("Detected anomalies:")
        for a in anomalies[:3]:
            parts.append(f"  {a.get('column')}: {a.get('outlier_count')} outliers")

    cleaning = ctx.get("cleaning_report", {})
    if cleaning:
        parts.append(
            f"Data cleaning: removed {cleaning.get('duplicates_removed', 0)} duplicates, "
            f"filled nulls in {len(cleaning.get('nulls_filled', {}))} columns"
        )

    return "\n".join(parts)
