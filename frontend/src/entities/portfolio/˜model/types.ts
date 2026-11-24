export type PortfolioItem = {
  idAccount: number;
  accountNumber: string;
  idSecurity: number;
  ticker: string;
  securityName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
};

export type PortfolioSummary = {
  totalAssets: number;
  totalValue: number;
  totalPnl: number;
};
