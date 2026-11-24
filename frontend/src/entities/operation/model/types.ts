export type CreateOperationDto = {
  idAccount: number;
  idSecurity: number;
  idOperationType: 1 | 2;
  quantity: number;
  price: number;
  commission: number;
};

export const OPERATION_TYPES = {
  BUY: 1,
  SELL: 2,
} as const;
