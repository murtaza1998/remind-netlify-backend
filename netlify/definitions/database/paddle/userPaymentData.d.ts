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
  passthrough: paddlePassthrough;
  checkoutId: string;
  marketingConsent: boolean;
  alertIds: string[];
};

export type paddlePassthrough = {
  workspaceAddress: string;
};