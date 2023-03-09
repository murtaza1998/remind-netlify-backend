export const removeTrailingSlashFromUrl = (url: string): string => {
  return url.replace(/\/$/, "");
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const addDaysToDate = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};
