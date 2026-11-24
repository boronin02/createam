export type Security = {
  idSecurity: number;
  ticker: string;
  isin: string;
  name: string;
  currentPrice: number;
  dailyChangeRub: number;
  dailyChangePercent: number;
  typeName: string;
  issuerName: string;
  currencyCode: string;
};

export type SecurityHistory = {
  begin: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
