import { AlertName, PaddleSubscriptionStatus } from "../../paddle";

export type userPaymentDataArchive = {
  userId: string;
  subscriptionId: string;

  action: AlertName.SubscriptionUpdated | AlertName.SubscriptionCancelled;

  history: {
    status: PaddleSubscriptionStatus;
    planId: string;
    endDate: string;
    updateUrl: string;
    cancelUrl: string;
  };

  historyMetadata: {
    alertId: string;
    eventTime: string;
  };

  debugMetadata: {
    alertId: string;
    eventTime: string;
  };
};
