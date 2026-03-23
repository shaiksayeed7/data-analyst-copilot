"""
Visualization service using Plotly.
Auto-selects the best chart type based on data.
"""

from __future__ import annotations

import json
from typing import Any

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def _df_to_json(fig) -> dict[str, Any]:
    """Convert plotly figure to JSON-safe dict."""
    return json.loads(fig.to_json())


def auto_chart(df: pd.DataFrame) -> list[dict[str, Any]]:
    """
    Auto-generate up to 3 relevant charts based on column types.
    Returns a list of Plotly figure dicts.
    """
    charts: list[dict[str, Any]] = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

    # Try to detect date-like string columns
    if not date_cols:
        for col in categorical_cols:
            try:
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() / len(df) > 0.8:
                    df = df.copy()
                    df[col] = parsed
                    date_cols.append(col)
                    categorical_cols.remove(col)
                    break
            except Exception:
                pass

    # 1. Line chart: date vs first numeric
    if date_cols and numeric_cols:
        date_col = date_cols[0]
        num_col = numeric_cols[0]
        grouped = df.groupby(date_col)[num_col].sum().reset_index()
        fig = px.line(grouped, x=date_col, y=num_col, title=f"{num_col} over Time")
        charts.append({"type": "line", "figure": _df_to_json(fig)})

    # 2. Bar chart: categorical vs first numeric
    if categorical_cols and numeric_cols:
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        top_n = df.groupby(cat_col)[num_col].sum().nlargest(10).reset_index()
        fig = px.bar(top_n, x=cat_col, y=num_col, title=f"Top {cat_col} by {num_col}")
        charts.append({"type": "bar", "figure": _df_to_json(fig)})

    # 3. Pie chart: second categorical or distribution of first numeric
    if len(categorical_cols) > 1 and numeric_cols:
        cat_col = categorical_cols[1]
        num_col = numeric_cols[0]
        grouped = df.groupby(cat_col)[num_col].sum().nlargest(7).reset_index()
        fig = px.pie(grouped, names=cat_col, values=num_col, title=f"{num_col} by {cat_col}")
        charts.append({"type": "pie", "figure": _df_to_json(fig)})
    elif numeric_cols and not charts:
        # Histogram of first numeric column
        fig = px.histogram(df, x=numeric_cols[0], title=f"Distribution of {numeric_cols[0]}")
        charts.append({"type": "histogram", "figure": _df_to_json(fig)})

    # 4. Scatter: if two or more numeric columns
    if len(numeric_cols) >= 2 and len(charts) < 3:
        fig = px.scatter(df, x=numeric_cols[0], y=numeric_cols[1], title=f"{numeric_cols[0]} vs {numeric_cols[1]}")
        charts.append({"type": "scatter", "figure": _df_to_json(fig)})

    return charts[:4]


def chart_from_query(df: pd.DataFrame, chart_type: str, x_col: str, y_col: str | None = None) -> dict[str, Any]:
    """Generate a specific chart based on user request."""
    chart_type = chart_type.lower()

    if chart_type == "bar":
        if y_col and y_col in df.columns:
            grouped = df.groupby(x_col)[y_col].sum().reset_index()
            fig = px.bar(grouped, x=x_col, y=y_col, title=f"{y_col} by {x_col}")
        else:
            vc = df[x_col].value_counts().reset_index()
            vc.columns = [x_col, "count"]
            fig = px.bar(vc, x=x_col, y="count", title=f"Count by {x_col}")

    elif chart_type == "pie":
        if y_col and y_col in df.columns:
            grouped = df.groupby(x_col)[y_col].sum().reset_index()
            fig = px.pie(grouped, names=x_col, values=y_col, title=f"{y_col} by {x_col}")
        else:
            vc = df[x_col].value_counts().reset_index()
            vc.columns = [x_col, "count"]
            fig = px.pie(vc, names=x_col, values="count", title=f"Distribution of {x_col}")

    elif chart_type == "line":
        if y_col and y_col in df.columns:
            fig = px.line(df, x=x_col, y=y_col, title=f"{y_col} over {x_col}")
        else:
            fig = px.line(df, x=x_col, title=f"Line chart of {x_col}")

    elif chart_type == "scatter":
        if y_col and y_col in df.columns:
            fig = px.scatter(df, x=x_col, y=y_col, title=f"{x_col} vs {y_col}")
        else:
            fig = px.scatter(df, x=x_col, title=f"Scatter of {x_col}")

    else:
        fig = px.histogram(df, x=x_col, title=f"Distribution of {x_col}")

    return {"type": chart_type, "figure": _df_to_json(fig)}
