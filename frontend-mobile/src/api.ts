import type { FundKind, FundOverview, FundSummary } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
};

export const fetchFunds = async (
  kind: FundKind = "YAT"
): Promise<FundSummary[]> => {
  const response = await fetch(`${API_BASE}/api/funds?kind=${kind}`);
  const payload = await handleResponse<{ funds: FundSummary[] }>(response);
  return payload.funds;
};

export const fetchFundDetails = async (
  code: string,
  kind: FundKind = "YAT",
  days?: number
): Promise<FundOverview> => {
  const url = new URL(`${API_BASE}/api/fund-history`, window.location.origin);
  url.searchParams.append("code", code);
  url.searchParams.append("kind", kind);
  if (days) url.searchParams.append("days", days.toString());

  const response = await fetch(url.toString());
  const payload = await handleResponse<{ fund: FundOverview }>(response);
  return payload.fund;
};
