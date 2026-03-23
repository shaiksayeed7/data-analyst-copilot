"use client";

import { DataSummary, Anomaly, CleaningReport } from "@/lib/api";
import { Table2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  totalColumns: number;
  summary: DataSummary;
  anomalies: Anomaly[];
  cleaningReport: CleaningReport;
}

export default function DataPreview({
  columns,
  rows,
  totalRows,
  totalColumns,
  summary,
  anomalies,
  cleaningReport,
}: Props) {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Cleaning summary */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Data Cleaning Report</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <Stat label="Total Rows" value={totalRows.toLocaleString()} />
          <Stat label="Total Columns" value={totalColumns} />
          <Stat
            label="Duplicates Removed"
            value={cleaningReport.duplicates_removed}
            highlight={cleaningReport.duplicates_removed > 0}
          />
          <Stat
            label="Nulls Filled"
            value={Object.keys(cleaningReport.nulls_filled).length}
            highlight={Object.keys(cleaningReport.nulls_filled).length > 0}
          />
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-amber-950/40 rounded-xl p-4 border border-amber-800/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">
              {anomalies.length} Anomal{anomalies.length === 1 ? "y" : "ies"} Detected
            </h3>
          </div>
          <div className="space-y-1">
            {anomalies.map((a) => (
              <div key={a.column} className="text-xs text-amber-200/80">
                <span className="font-mono text-amber-300">{a.column}</span>: {a.outlier_count}{" "}
                outlier{a.outlier_count !== 1 ? "s" : ""} (range:{" "}
                {a.lower_bound?.toFixed(2)} – {a.upper_bound?.toFixed(2)})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats toggle */}
      <button
        onClick={() => setShowStats((v) => !v)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showStats ? "Hide" : "Show"} column statistics
      </button>

      {showStats && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Numeric Columns
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Column</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Mean</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Min</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Max</th>
                  <th className="px-3 py-2 text-right text-slate-400 font-medium">Std</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.numeric_summary || {}).map(([col, stats]) => (
                  <tr key={col} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-3 py-2 font-mono text-slate-300">{col}</td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {stats.mean?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {stats.min?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {stats.max?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300">
                      {stats.std?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data table preview */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
          <Table2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dataset Preview
          </span>
          <span className="ml-auto text-xs text-slate-500">
            Showing 10 of {totalRows.toLocaleString()} rows
          </span>
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-slate-700/90 backdrop-blur">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left text-slate-300 font-medium border-b border-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-slate-400 max-w-[150px] truncate">
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-semibold ${highlight ? "text-amber-300" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}
