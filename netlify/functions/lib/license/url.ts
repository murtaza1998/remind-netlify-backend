export const cleanWorkspaceAddress = (url: string): string => {
  return url.replace(/\/$/, "").replace(/^https?:\/\/(.*)$/, "$1");
};
