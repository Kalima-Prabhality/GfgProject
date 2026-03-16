export interface AppChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
    fill?: boolean;
    tension?: number;
    borderRadius?: number;
    pointBackgroundColor?: string;
    pointRadius?: number;
  }[];
}

export interface ChatResponse {
  question: string;
  generated_sql: string;
  chart_type: "bar" | "line" | "pie" | "doughnut" | "area" | "radar" | "table";
  chart_data: AppChartData | null;
  table_data: Record<string, unknown>[] | null;
  insights: string;
  row_count: number;
  execution_time_ms: number;
  history_id: number;
  csv_name?: string;
}

export interface HistoryItem {
  id: number;
  question: string;
  generated_sql: string;
  chart_type: string;
  insights: string;
  timestamp: string;
}

export interface HistoryDetail extends HistoryItem {
  result_json: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
  loading?: boolean;
  error?: string;
  timestamp: Date;
}

export interface UploadedCSV {
  name: string;
  rows: number;
  columns: string[];
  uploaded_at: string;
}
