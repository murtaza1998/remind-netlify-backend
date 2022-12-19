export const removeTrailingSlashFromUrl = (url: string): string => {
  return url.replace(/\/$/, "");
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
