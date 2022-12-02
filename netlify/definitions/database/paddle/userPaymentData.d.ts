import { PaddleSubscriptionStatus } from "../../paddle";

export type userPaymentData = {
  userId: string;
  email: string;
  subscription: {
    id: string;
    status: PaddleSubscriptionStatus;
    planId: string;
    endDate: string;
    updateUrl: string;
    cancelUrl: string;
  };
  checkoutId: string;
  marketingConsent: boolean;
  debugMetadata: {
    alertId: string;
    eventTime: string;
  };
};
