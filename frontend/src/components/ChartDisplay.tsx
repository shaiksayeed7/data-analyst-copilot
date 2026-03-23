"use client";

import dynamic from "next/dynamic";
import { ChartData } from "@/lib/api";
import { BarChart2 } from "lucide-react";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  charts: ChartData[];
}

export default function ChartDisplay({ charts }: Props) {
  if (charts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-600 gap-2">
        <BarChart2 className="w-10 h-10" />
        <p className="text-sm">Charts will appear here after upload</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {charts.map((chart, i) => (
        <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider capitalize">
              {chart.type} Chart
            </span>
          </div>
          <div className="p-2">
            <Plot
              data={(chart.figure as { data: Plotly.Data[] }).data}
              layout={{
                ...(chart.figure as { layout: Partial<Plotly.Layout> }).layout,
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                font: { color: "#cbd5e1", family: "Inter, sans-serif", size: 11 },
                margin: { t: 40, r: 16, b: 40, l: 50 },
                legend: { font: { color: "#94a3b8" } },
                xaxis: {
                  gridcolor: "#1e293b",
                  tickcolor: "#334155",
                  linecolor: "#334155",
                  ...(chart.figure as { layout: Record<string, unknown> }).layout?.xaxis as object,
                },
                yaxis: {
                  gridcolor: "#1e293b",
                  tickcolor: "#334155",
                  linecolor: "#334155",
                  ...(chart.figure as { layout: Record<string, unknown> }).layout?.yaxis as object,
                },
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", minHeight: 280 }}
              useResizeHandler
            />
          </div>
        </div>
      ))}
    </div>
  );
}
