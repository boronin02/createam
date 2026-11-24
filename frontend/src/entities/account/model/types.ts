export type Account = {
  idAccount: number;
  accountNumber: string;
  name: string;
  currencyCode: string;
};

export type CreateAccountDto = {
  accountNumber: string;
  name: string;
  currencyId: number;
};
