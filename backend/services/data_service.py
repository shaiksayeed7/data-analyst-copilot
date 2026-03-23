"""
Data analysis service using pandas.
Handles cleaning, statistics, and pattern detection.
"""

from __future__ import annotations

import json
from typing import Any

import numpy as np
import pandas as pd


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Remove duplicates, fill or drop nulls, and report changes."""
    original_rows = len(df)
    original_cols = list(df.columns)

    df = df.drop_duplicates().copy()
    duplicates_removed = original_rows - len(df)

    null_counts: dict[str, int] = df.isnull().sum().to_dict()
    null_counts = {k: int(v) for k, v in null_counts.items() if v > 0}

    # Fill numeric nulls with column median, categorical with mode
    for col in df.columns:
        if df[col].isnull().any():
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(df[col].median())
            else:
                mode_vals = df[col].mode()
                if not mode_vals.empty:
                    df[col] = df[col].fillna(mode_vals.iloc[0])
                else:
                    df[col] = df[col].fillna("Unknown")

    cleaning_report = {
        "original_rows": original_rows,
        "rows_after_cleaning": len(df),
        "duplicates_removed": duplicates_removed,
        "nulls_filled": null_counts,
        "columns": original_cols,
    }

    return df, cleaning_report


def generate_summary(df: pd.DataFrame) -> dict[str, Any]:
    """Generate summary statistics for a dataframe."""
    summary: dict[str, Any] = {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": [],
        "numeric_summary": {},
        "categorical_summary": {},
    }

    for col in df.columns:
        dtype = str(df[col].dtype)
        col_info: dict[str, Any] = {"name": col, "dtype": dtype, "null_count": int(df[col].isnull().sum())}
        summary["columns"].append(col_info)

        if pd.api.types.is_numeric_dtype(df[col]):
            desc = df[col].describe()
            summary["numeric_summary"][col] = {
                "mean": _safe_float(desc.get("mean")),
                "median": _safe_float(df[col].median()),
                "std": _safe_float(desc.get("std")),
                "min": _safe_float(desc.get("min")),
                "max": _safe_float(desc.get("max")),
                "q25": _safe_float(desc.get("25%")),
                "q75": _safe_float(desc.get("75%")),
            }
        else:
            vc = df[col].value_counts()
            summary["categorical_summary"][col] = {
                "unique_count": int(df[col].nunique()),
                "top_values": vc.head(5).to_dict(),
            }

    return summary


def detect_anomalies(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Detect anomalies in numeric columns using IQR method."""
    anomalies: list[dict[str, Any]] = []

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outlier_mask = (df[col] < lower) | (df[col] > upper)
        outlier_count = int(outlier_mask.sum())
        if outlier_count > 0:
            anomalies.append({
                "column": col,
                "outlier_count": outlier_count,
                "lower_bound": _safe_float(lower),
                "upper_bound": _safe_float(upper),
                "sample_outliers": df.loc[outlier_mask, col].head(3).tolist(),
            })

    return anomalies


def get_preview(df: pd.DataFrame, rows: int = 10) -> dict[str, Any]:
    """Return first N rows plus column names for table preview."""
    preview_df = df.head(rows)
    # Convert to JSON-safe types
    records = json.loads(preview_df.to_json(orient="records", date_format="iso"))
    return {
        "columns": list(df.columns),
        "rows": records,
        "total_rows": len(df),
        "total_columns": len(df.columns),
    }


def _safe_float(val: Any) -> float | None:
    if val is None:
        return None
    try:
        f = float(val)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 4)
    except (TypeError, ValueError):
        return None
