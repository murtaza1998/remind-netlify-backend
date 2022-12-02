export interface PaddlePassthrough {
  userId: string; // the id of the user in our supabase database
}

export enum PaddleSubscriptionStatus {
  Active = "active",
  Trialing = "trialing", // at the moment we don't support trial phases
  PastDue = "past_due", // Payment is pending, we should inform he user that he needs to update his payment method
  Paused = "paused", // at the moment we don't support pausing subscriptions
  Cancelled = "deleted",
}

export enum AlertName {
  SubscriptionCreated = "subscription_created",
  SubscriptionUpdated = "subscription_updated",
  SubscriptionCancelled = "subscription_cancelled",
  SubscriptionPaymentSucceeded = "subscription_payment_succeeded",
  SubscriptionPaymentFailed = "subscription_payment_failed",
  SubscriptionPaymentRefunded = "subscription_payment_refunded",
}

export enum PaymentStatus {
  Success = "success",
  Error = "error",
  Refund = "refund",
}

export interface BasePaddleRequest {
  alert_id: string;
  alert_name: AlertName;
  status: PaddleSubscriptionStatus;
  /**
   * Holds the data we pass to Paddle at the checkout as a JSON string.
   * Take a look at {@link PaddlePassthrough} to see what it contains.
   */
  passthrough: string;
  subscription_id: string;
  subscription_plan_id: string;
  event_time: string;
}

export interface SubscriptionCreatedRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionCreated;
  user_id: string;
  email: string;
  checkout_id: string;
  next_bill_date: string;
  marketing_consent: "0" | "1";
  cancel_url: string;
  update_url: string;
}

export interface SubscriptionUpdatedRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionUpdated;
  next_bill_date: string;
  cancel_url: string;
  update_url: string;
}

export interface SubscriptionCancelledRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionCancelled;
  cancellation_effective_date: string;
}

export interface SubscriptionPaymentSucceededRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionPaymentSucceeded;
  subscription_payment_id: string;
  country: string;
  currency: string;
  customer_name: string;
  fee: string;
  payment_method: string;
  payment_tax: string;
  receipt_url: string;
  sale_gross: string;
  next_bill_date: string;
  initial_payment: "0" | "1" | "true" | "false";
  instalments: string;
}

export interface SubscriptionPaymentFailedRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionPaymentFailed;
  subscription_payment_id: string;
  amount: string;
  currency: string;
  next_retry_date?: string;
  attempt_number: string;
}

export interface SubscriptionPaymentRefundedRequest extends BasePaddleRequest {
  alert_name: AlertName.SubscriptionPaymentRefunded;
  subscription_payment_id: string;
  gross_refund: string;
  fee_refund: string;
  tax_refund: string;
  currency: string;
  refund_reason: string;
  refund_type: string;
}

type PaddleRequest =
  | SubscriptionCreatedRequest
  | SubscriptionUpdatedRequest
  | SubscriptionCancelledRequest
  | SubscriptionPaymentSucceededRequest
  | SubscriptionPaymentFailedRequest
  | SubscriptionPaymentRefundedRequest;
