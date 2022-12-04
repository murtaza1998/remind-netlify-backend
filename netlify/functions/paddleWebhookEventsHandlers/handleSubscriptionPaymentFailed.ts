import { Db } from "mongodb";
import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY,
} from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { subscriptionPaymentHistory } from "../../definitions/database/paddle/userPaymentHistory";
import {
  PaddleSubscriptionStatus,
  PaymentStatus,
  SubscriptionPaymentFailedRequest,
} from "../../definitions/paddle";
import { PaymentEmailer } from "../lib/email/paymentEmailer";

export const handleSubscriptionPaymentFailed = async (
  db: Db,
  siteUrl: string,
  subscriptionPayFailed: SubscriptionPaymentFailedRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription payment failed event for subscription with id ${subscriptionPayFailed.subscription_id} and alert id ${subscriptionPayFailed.alert_id}`
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

  const upd: Partial<userPaymentData> = {
    subscription: {
      ...existingUserPaymentData.subscription,
      status: subscriptionPayFailed.status,
      // we'll extend the user's subscription until the next retry date
      ...(subscriptionPayFailed.next_retry_date && {
        endDate: subscriptionPayFailed.next_retry_date,
      }),
    },
    alertIds: [
      ...existingUserPaymentData.alertIds,
      subscriptionPayFailed.alert_id,
    ],
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .updateOne({ _id: existingUserPaymentData._id }, { $set: upd });

  if (result.modifiedCount !== 1) {
    console.error(
      `Could not update user payment data for subscription id ${subscriptionPayFailed.subscription_id} when handling subscription cancelled event`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not update user payment data for subscription id ${subscriptionPayFailed.subscription_id} when handling subscription cancelled event`,
      },
    };
  }

  if (subscriptionPayFailed.next_retry_date) {
    // send email to user about payment failure and that we'll extend their subscription until the next retry date
    if (
      [
        PaddleSubscriptionStatus.Active,
        PaddleSubscriptionStatus.PastDue,
      ].includes(subscriptionPayFailed.status)
    ) {
      await PaymentEmailer.sendPaymentFailedEmailWithRetry({
        db,
        siteUrl,
        to: existingUserPaymentData.email,
        subscription: {
          planId: existingUserPaymentData.subscription.planId,
          endDate: new Date(
            subscriptionPayFailed.next_retry_date
          ).toDateString(),
        },
        passthrough: existingUserPaymentData.passthrough,
      });
    }
  } else {
    // send email to user about payment failure and that we'll pause their subscription
    await PaymentEmailer.sendPaymentFailedEmailAndSubsPaused({
      db,
      siteUrl,
      to: existingUserPaymentData.email,
      subscription: {
        planId: existingUserPaymentData.subscription.planId,
      },
    });
  }

  // save payment history
  const paymentHistory: subscriptionPaymentHistory = {
    subscriptionId: subscriptionPayFailed.subscription_id,
    status: PaymentStatus.Error,
    createdAt: subscriptionPayFailed.event_time,
    subscriptionPaymentId: subscriptionPayFailed.subscription_payment_id,
    subscriptionPlanId: subscriptionPayFailed.subscription_plan_id,
    currency: subscriptionPayFailed.currency,

    failedTransaction: {
      attemptNumber: subscriptionPayFailed.attempt_number,
      nextRetryDate: subscriptionPayFailed.next_retry_date,
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

  return {
    statusCode: 200,
    result: {
      message: `Cancelled user subscription with id ${existingUserPaymentData._id}`,
    },
  };
};
