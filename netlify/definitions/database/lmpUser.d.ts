export type lmpUser = {
  _id: string;
  email: string;
  password: {
    salt: string;
    hash: string;
  };
  firstName: string;
  lastName: string;
  role: string;
};
