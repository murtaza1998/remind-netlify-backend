export type API_Response = {
  statusCode: number;
  result?: object;
  error?: {
    developerCode?: number;
    message: string;
  };
};
