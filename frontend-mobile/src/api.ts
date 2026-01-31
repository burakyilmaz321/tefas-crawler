import type { FundKind, FundOverview, FundSummary } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const REQUEST_TIMEOUT_MS = 30000;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
};

const fetchWithTimeout = async <T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchFunds = async (
  kind: FundKind = "YAT"
): Promise<FundSummary[]> => {
  const response = await fetchWithTimeout<{ funds: FundSummary[] }>(
    `${API_BASE}/api/funds?kind=${kind}`
  );
  return response.funds;
};

export const fetchFundDetails = async (
  code: string,
  kind: FundKind = "YAT",
  days?: number
): Promise<FundOverview> => {
  const url = new URL(`${API_BASE}/api/fund-history`);
  url.searchParams.append("code", code);
  url.searchParams.append("kind", kind);
  if (days) url.searchParams.append("days", days.toString());

  const response = await fetchWithTimeout<{ fund: FundOverview }>(
    url.toString()
  );
  return response.fund;
};
