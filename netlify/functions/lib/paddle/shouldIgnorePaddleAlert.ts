import { env } from "process";

export const shouldIgnorePaddleAlert = (alertId: string): boolean => {
  const ignoredAlerts = env.IGNORED_PADDLE_ALERTS_IDS?.split(",") ?? [];
  return ignoredAlerts.includes(alertId);
};
