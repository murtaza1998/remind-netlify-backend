import { PaymentStatus } from "../../paddle";

export type subscriptionPaymentHistory = {
  subscriptionId: string;
  createdAt: string;
  status: PaymentStatus;
  subscriptionPaymentId: string;
  subscriptionPlanId: string; // - to store from which subscription plan this payment was made (yearly / monthly in our case)
  currency: string; // - which currency the customer used to pay

  successTransaction?: {
    amount: string; // - the amount the customer paid
    amountTax: string; // - the amount of taxes which were paid
    paddleFee: string; // - how much Paddle earned for the payment
    paymentMethod: string; // - which payment method was used (e.g. paypal)
    receiptUrl: string; // - the url where the customer can see the invoice for the payment
    customerName: string; // - just for the record, we also store the name of the customer of the corresponding payment
    userCountry: string; // - plus the country where he’s coming from

    initialPayment?: boolean; // - if the payment was the initial payment for the subscription
    /*
		Typo expected for "instalments"
	*/
    instalments: string; // - how many installments the customer paid for (e.g. 1 for a one-time payment, 12 for a yearly subscription)
  };
  failedTransaction?: {
    attemptNumber: string; // - for failed payments, we store how often it was already retried
    nextRetryDate?: string; // - we also store when the next retry will take place
  };
  refundedTransaction?: {
    refundReason: string; // - for refunds we store the reason
    refundType: string; // - and the type we get from Paddle
    amount: string; // - the amount the customer paid
    amountTax: string; // - the amount of taxes which were paid
    paddleFee: string; // - how much Paddle earned for the payment
  };

  debugMetadata: {
    alertId: string;
    eventTime: string;
  };
};
