export type FundKind = 'YAT' | 'EMK' | 'BYF';

export interface FundSummary {
  code: string;
  title: string;
  kind: FundKind;
  latestDate: string;
  isTefasAvailable?: boolean; // Only applicable to YAT funds
}

export interface HistoricalPoint {
  date: string; // ISO date string
  value: number;
}

export interface AllocationSlice {
  label: string;
  value: number;
}

export interface FundOverview {
  code: string;
  title: string;
  kind: FundKind;
  priceHistory: HistoricalPoint[];
  marketCapHistory: HistoricalPoint[];
  investorHistory: HistoricalPoint[];
  allocation: AllocationSlice[];
  latestPrice: number;
  latestDate: string;
}

export interface FundRiskMetrics {
  sharpe: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  return1m: number | null;
  return3m: number | null;
  return1y: number | null;
}

export interface FundRiskResponse {
  code: string;
  range: { start: string; end: string };
  metrics: FundRiskMetrics;
}

export interface FundScreenResult {
  code: string;
  title: string;
  kind: FundKind;
  return1m: number | null;
  return1y: number | null;
  sharpe: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
}

export interface PortfolioHoldingInput {
  code: string;
  shares: number;
  cost: number;
}

export interface PortfolioHolding extends PortfolioHoldingInput {
  latestPrice: number;
  latestDate: string | null;
  value: number;
  pnl: number;
  weight: number;
}

export interface PortfolioValuation {
  totalValue: number;
  totalCost: number;
  pnl: number;
  pnlPct: number | null;
  holdings: PortfolioHolding[];
}

export interface MacroSeries {
  symbol: string;
  range: { start: string; end: string };
  series: HistoricalPoint[];
  source?: string;
}

export interface TechnicalScanResult {
  code: string;
  title: string;
  kind: FundKind;
  rsi: number | null;
  shortSma: number | null;
  longSma: number | null;
  smaCross: boolean;
}

export interface MarketEvent {
  date: string;
  type: string;
  title: string;
  impact: 'low' | 'medium' | 'high';
  note?: string;
}
