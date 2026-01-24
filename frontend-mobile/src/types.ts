export type Fund = {
  code: string;
  name: string;
  delta: string;
  risk?: string;
  category?: string;
};

export type FundKind = "YAT" | "EMK" | "BYF";

export type FundSummary = {
  code: string;
  title: string;
  kind: FundKind;
  latestDate: string;
};

export type HistoricalPoint = {
  date: string;
  value: number;
};

export type AllocationSlice = {
  label: string;
  value: number;
};

export type FundOverview = {
  code: string;
  title: string;
  kind: FundKind;
  priceHistory: HistoricalPoint[];
  marketCapHistory: HistoricalPoint[];
  investorHistory: HistoricalPoint[];
  allocation: AllocationSlice[];
  latestPrice: number;
  latestDate: string;
};
