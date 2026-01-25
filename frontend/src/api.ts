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

const API_BASE = import.meta.env.VITE_API_BASE || '';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json() as Promise<T>;
};

export const fetchFunds = async (kind: FundKind = 'YAT'): Promise<FundSummary[]> => {
  const response = await fetch(`${API_BASE}/api/funds?kind=${kind}`);
  const payload = await handleResponse<{ funds: FundSummary[] }>(response);
  return payload.funds;
};

export const fetchFundDetails = async (code: string, kind: FundKind = 'YAT', days?: number): Promise<FundOverview> => {
  const url = new URL(`${API_BASE}/api/fund-history`, window.location.origin);
  url.searchParams.append('code', code);
  url.searchParams.append('kind', kind);
  if (days) url.searchParams.append('days', days.toString());

  const response = await fetch(url.toString());
  const payload = await handleResponse<{ fund: FundOverview }>(response);
  return payload.fund;
};

export const fetchFundRisk = async (code: string, days = 365): Promise<FundRiskResponse> => {
  const url = new URL(`${API_BASE}/api/fund-risk`, window.location.origin);
  url.searchParams.append('code', code);
  url.searchParams.append('days', days.toString());
  const response = await fetch(url.toString());
  return handleResponse<FundRiskResponse>(response);
};

export const fetchFundScreen = async (kind: FundKind, minReturn1y?: number, minReturn1m?: number) => {
  const url = new URL(`${API_BASE}/api/fund-screen`, window.location.origin);
  url.searchParams.append('kind', kind);
  if (minReturn1y !== undefined) url.searchParams.append('minReturn1y', String(minReturn1y));
  if (minReturn1m !== undefined) url.searchParams.append('minReturn1m', String(minReturn1m));
  const response = await fetch(url.toString());
  const payload = await handleResponse<{ results: FundScreenResult[] }>(response);
  return payload.results;
};

export const fetchPortfolioValuation = async (holdings: PortfolioHoldingInput[]): Promise<PortfolioValuation> => {
  const response = await fetch(`${API_BASE}/api/portfolio-valuation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdings }),
  });
  return handleResponse<PortfolioValuation>(response);
};

export const fetchMacroSeries = async (symbol = 'USDTRY', days = 365): Promise<MacroSeries> => {
  const url = new URL(`${API_BASE}/api/macro-series`, window.location.origin);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('days', days.toString());
  const response = await fetch(url.toString());
  return handleResponse<MacroSeries>(response);
};

export const fetchTechnicalScan = async (kind: FundKind, rsiBelow = 30) => {
  const url = new URL(`${API_BASE}/api/fund-technical-scan`, window.location.origin);
  url.searchParams.append('kind', kind);
  url.searchParams.append('rsiBelow', rsiBelow.toString());
  const response = await fetch(url.toString());
  const payload = await handleResponse<{ results: TechnicalScanResult[] }>(response);
  return payload.results;
};

export const fetchMarketEvents = async (): Promise<MarketEvent[]> => {
  const response = await fetch(`${API_BASE}/api/market-events`);
  const payload = await handleResponse<{ events: MarketEvent[] }>(response);
  return payload.events;
};
