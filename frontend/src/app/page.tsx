"use client";

import { useState } from "react";
import {
  UploadCloud,
  Download,
  Briefcase,
  RefreshCw,
  BarChart2,
  Table2,
  X,
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ChatPanel from "@/components/ChatPanel";
import ChartDisplay from "@/components/ChartDisplay";
import DataPreview from "@/components/DataPreview";
import { UploadResponse, ChartData, downloadPDF } from "@/lib/api";

type RightTab = "charts" | "data";

export default function HomePage() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [latestInsights, setLatestInsights] = useState<string>("");
  const [rightTab, setRightTab] = useState<RightTab>("charts");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [ceoMode, setCeoMode] = useState(false);

  const handleUpload = (data: UploadResponse) => {
    setUploadData(data);
    setCharts(data.charts);
    setLatestInsights("");
  };

  const handleChartsUpdate = (newCharts: ChartData[]) => {
    setCharts(newCharts);
    setRightTab("charts");
  };

  const handleInsightGenerated = (text: string) => {
    setLatestInsights(text);
  };

  const handleDownloadPDF = async () => {
    if (!uploadData) return;
    setPdfLoading(true);
    try {
      const blob = await downloadPDF(uploadData.session_id, ceoMode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${uploadData.filename.replace(/\.[^.]+$/, "")}_insights.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF. Please generate insights first.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (!uploadData) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Minimal header */}
        <header className="h-14 border-b border-slate-800 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-slate-200">Data Analyst Copilot</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <FileUpload onUpload={handleUpload} />
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top nav */}
      <header className="h-14 border-b border-slate-800 flex items-center px-4 gap-4 shrink-0 bg-slate-950/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-slate-200 hidden sm:block">Data Analyst Copilot</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 min-w-0 max-w-xs truncate">
          <UploadCloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{uploadData.filename}</span>
          <span className="text-slate-500 shrink-0">
            ({uploadData.preview.total_rows.toLocaleString()} rows)
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCeoMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${ceoMode ? "bg-amber-600 text-white shadow-lg" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            title="Explain like I'm CEO"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Explain like I&apos;m CEO</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
            title="Download insights as PDF"
          >
            {pdfLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:block">Download PDF</span>
          </button>

          <button
            onClick={() => setUploadData(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            title="Upload new file"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:block">New File</span>
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat panel */}
        <div className="w-full sm:w-[420px] lg:w-[480px] border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
          <ChatPanel
            sessionId={uploadData.session_id}
            onChartsUpdate={handleChartsUpdate}
            onInsightGenerated={handleInsightGenerated}
          />
        </div>

        {/* Right: Charts + Data */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setRightTab("charts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${rightTab === "charts" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Charts
            </button>
            <button
              onClick={() => setRightTab("data")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${rightTab === "data" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Data
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {rightTab === "charts" ? (
              <ChartDisplay charts={charts} />
            ) : (
              <DataPreview
                columns={uploadData.preview.columns}
                rows={uploadData.preview.rows}
                totalRows={uploadData.preview.total_rows}
                totalColumns={uploadData.preview.total_columns}
                summary={uploadData.summary}
                anomalies={uploadData.anomalies}
                cleaningReport={uploadData.cleaning_report}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
