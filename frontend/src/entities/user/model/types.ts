export type CurrentUser = {
  id_investor: number;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  email: string;
  phone: string | null;
  username: string;
  inn: string | null;
};
