export enum AppState {
  AWAITING_CONFIG,
  INITIAL,
  AUTHENTICATED_IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export interface Email {
  id: string;
  from: string;
  subject: string;
  date: string; // ISO 8601 format
  body: string;
}

export interface Headline {
  headline: string;
  summary: string;
  why_it_matters: string;
  url: string;
}

export interface Tool {
  name: string;
  description: string;
  url: string;
}

export interface Tip {
  name: string;
  description: string;
  url: string;
}

export interface Stats {
  newsletters_scanned: number;
  unique_sources: number;
  time_range: string;
}

export interface AiBrief {
  top_headlines: Headline[];
  tools_to_try: Tool[];
  tips_to_try: Tip[];
  quick_stats: Stats;
}
