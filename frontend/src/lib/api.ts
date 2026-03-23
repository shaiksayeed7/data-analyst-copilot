import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

export interface UploadResponse {
  session_id: string;
  filename: string;
  preview: {
    columns: string[];
    rows: Record<string, unknown>[];
    total_rows: number;
    total_columns: number;
  };
  summary: DataSummary;
  anomalies: Anomaly[];
  cleaning_report: CleaningReport;
  charts: ChartData[];
}

export interface DataSummary {
  shape: { rows: number; columns: number };
  columns: { name: string; dtype: string; null_count: number }[];
  numeric_summary: Record<string, NumericStats>;
  categorical_summary: Record<string, CategoricalStats>;
}

export interface NumericStats {
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q25: number | null;
  q75: number | null;
}

export interface CategoricalStats {
  unique_count: number;
  top_values: Record<string, number>;
}

export interface Anomaly {
  column: string;
  outlier_count: number;
  lower_bound: number;
  upper_bound: number;
  sample_outliers: number[];
}

export interface CleaningReport {
  original_rows: number;
  rows_after_cleaning: number;
  duplicates_removed: number;
  nulls_filled: Record<string, number>;
  columns: string[];
}

export interface ChartData {
  type: string;
  figure: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  answer: string;
  charts: ChartData[];
}

export interface InsightsResponse {
  insights: string;
}

export interface SQLResponse {
  sql: string;
  table_name: string;
  columns: string[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<UploadResponse>("/api/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  history: ChatMessage[],
  ceoMode: boolean = false
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>("/api/chat/message", {
    session_id: sessionId,
    message,
    history,
    ceo_mode: ceoMode,
  });
  return res.data;
}

export async function getInsights(
  sessionId: string,
  ceoMode: boolean = false
): Promise<InsightsResponse> {
  const res = await api.post<InsightsResponse>("/api/chat/insights", {
    session_id: sessionId,
    ceo_mode: ceoMode,
  });
  return res.data;
}

export async function generateSQL(
  sessionId: string,
  question: string
): Promise<SQLResponse> {
  const res = await api.post<SQLResponse>("/api/sql/generate", {
    session_id: sessionId,
    question,
  });
  return res.data;
}

export async function downloadPDF(
  sessionId: string,
  ceoMode: boolean = false
): Promise<Blob> {
  const res = await api.post(
    "/api/pdf/download",
    { session_id: sessionId, ceo_mode: ceoMode },
    { responseType: "blob" }
  );
  return res.data as Blob;
}
