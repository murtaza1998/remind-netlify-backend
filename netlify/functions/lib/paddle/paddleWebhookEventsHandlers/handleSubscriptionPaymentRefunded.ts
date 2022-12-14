import { Db } from "mongodb";
import {
  COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY,
  COLLECTION_LMP_USER_PAYMENT_DATA,
} from "../../database";
import { API_Response } from "../../../../definitions/API";
import { userPaymentData } from "../../../../definitions/database/paddle/userPaymentData";
import { subscriptionPaymentHistory } from "../../../../definitions/database/paddle/userPaymentHistory";
import {
  PaymentStatus,
  SubscriptionPaymentRefundedRequest,
} from "../../../../definitions/paddle";

export const handleSubscriptionPaymentRefunded = async (
  db: Db,
  subscriptionPayFailed: SubscriptionPaymentRefundedRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription payment refunded event for subscription with id ${subscriptionPayFailed.subscription_id} and alert id ${subscriptionPayFailed.alert_id}`
  );

  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionPayFailed.subscription_id,
    });

  if (!existingUserPaymentData) {
    console.error(
      `Could not find user payment data for subscription id ${subscriptionPayFailed.subscription_id}`
    );

    return {
      statusCode: 500,
      error: {
        message: `Could not find user payment data for subscription id ${subscriptionPayFailed.subscription_id}`,
      },
    };
  }

  // save payment history
  const paymentHistory: subscriptionPaymentHistory = {
    status: PaymentStatus.Refund,
    subscriptionId: subscriptionPayFailed.subscription_id,
    createdAt: subscriptionPayFailed.event_time,
    subscriptionPaymentId: subscriptionPayFailed.subscription_payment_id,
    subscriptionPlanId: subscriptionPayFailed.subscription_plan_id,
    currency: subscriptionPayFailed.currency,

    refundedTransaction: {
      refundReason: subscriptionPayFailed.refund_reason,
      refundType: subscriptionPayFailed.refund_type,
      amount: subscriptionPayFailed.gross_refund,
      amountTax: subscriptionPayFailed.tax_refund,
      paddleFee: subscriptionPayFailed.fee_refund,
    },

    debugMetadata: {
      alertId: subscriptionPayFailed.alert_id,
      eventTime: subscriptionPayFailed.event_time,
    },
  };

  const paymentHistoryResult = await db
    .collection<subscriptionPaymentHistory>(
      COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY
    )
    .insertOne(paymentHistory);
  if (!paymentHistoryResult.insertedId) {
    console.error(
      `Could not save payment history for subscription id ${subscriptionPayFailed.subscription_id}`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not save payment history for subscription id ${subscriptionPayFailed.subscription_id}`,
      },
    };
  }

  // TODO: Need to check if we need to send any email to user here
  // because likely paddle will send email to user about this

  return {
    statusCode: 200,
    result: {
      message: `Successfully handled subscription payment refunded event for subscription with id ${subscriptionPayFailed.subscription_id} and alert id ${subscriptionPayFailed.alert_id}`,
    },
  };
};
