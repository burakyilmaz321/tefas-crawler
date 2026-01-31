import {
  FundKind,
  FundOverview,
  FundSummary,
  FundRiskResponse,
  FundScreenResult,
  MacroSeries,
  PortfolioHoldingInput,
  PortfolioValuation,
  TechnicalScanResult,
  MarketEvent,
} from './types';

const DEFAULT_API_BASE = 'http://localhost:8000';
const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;
const REQUEST_TIMEOUT_MS = 30000;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
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
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchFunds = async (kind: FundKind = 'YAT'): Promise<FundSummary[]> => {
  if (!API_BASE) {
    throw new Error('API base URL is not configured');
  }
  const response = await fetchWithTimeout<{ funds: FundSummary[] }>(
    `${API_BASE}/api/funds?kind=${kind}`
  );
  return response.funds;
};

export const fetchFundDetails = async (
  code: string,
  kind: FundKind = 'YAT',
  days?: number
): Promise<FundOverview> => {
  if (!API_BASE) {
    throw new Error('API base URL is not configured');
  }
  const url = new URL(`${API_BASE}/api/fund-history`);
  url.searchParams.append('code', code);
  url.searchParams.append('kind', kind);
  if (days) url.searchParams.append('days', days.toString());

  const response = await fetchWithTimeout<{ fund: FundOverview }>(url.toString());
  return response.fund;
};

export const fetchFundRisk = async (code: string, days = 365): Promise<FundRiskResponse> => {
  const url = new URL(`${API_BASE}/api/fund-risk`);
  url.searchParams.append('code', code);
  url.searchParams.append('days', days.toString());
  const response = await fetchWithTimeout<Response>(url.toString());
  return handleResponse<FundRiskResponse>(response);
};

export const fetchFundScreen = async (kind: FundKind, minReturn1y?: number, minReturn1m?: number) => {
  const url = new URL(`${API_BASE}/api/fund-screen`);
  url.searchParams.append('kind', kind);
  if (minReturn1y !== undefined) url.searchParams.append('minReturn1y', String(minReturn1y));
  if (minReturn1m !== undefined) url.searchParams.append('minReturn1m', String(minReturn1m));
  const response = await fetchWithTimeout<Response>(url.toString());
  const payload = await handleResponse<{ results: FundScreenResult[] }>(response);
  return payload.results;
};

export const fetchPortfolioValuation = async (holdings: PortfolioHoldingInput[]): Promise<PortfolioValuation> => {
  const response = await fetchWithTimeout<Response>(`${API_BASE}/api/portfolio-valuation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdings }),
  });
  return handleResponse<PortfolioValuation>(response);
};

export const fetchMacroSeries = async (symbol = 'USDTRY', days = 365): Promise<MacroSeries> => {
  const url = new URL(`${API_BASE}/api/macro-series`);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('days', days.toString());
  const response = await fetchWithTimeout<Response>(url.toString());
  return handleResponse<MacroSeries>(response);
};

export const fetchTechnicalScan = async (kind: FundKind, rsiBelow = 30) => {
  const url = new URL(`${API_BASE}/api/fund-technical-scan`);
  url.searchParams.append('kind', kind);
  url.searchParams.append('rsiBelow', rsiBelow.toString());
  const response = await fetchWithTimeout<Response>(url.toString());
  const payload = await handleResponse<{ results: TechnicalScanResult[] }>(response);
  return payload.results;
};

export const fetchMarketEvents = async (): Promise<MarketEvent[]> => {
  const response = await fetchWithTimeout<Response>(`${API_BASE}/api/market-events`);
  const payload = await handleResponse<{ events: MarketEvent[] }>(response);
  return payload.events;
};
