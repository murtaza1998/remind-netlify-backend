import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  COLLECTION_LMP_USER_PAYMENT_DATA_ARCHIVE,
  COLLECTION_LMP_USER_PAYMENT_HISTORY,
  connectToDatabase,
  DB_LMP,
} from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { userPaymentDataArchive } from "../../definitions/database/paddle/userPaymentDataArchive";
import { userPaymentHistory } from "../../definitions/database/paddle/userPaymentHistory";
import {
  AlertName,
  PaymentStatus,
  SubscriptionPaymentSucceededRequest,
} from "../../definitions/paddle";
import { isPositive } from "./utils";

export const handleSubscriptionPaymentSucceeded = async (
  subscriptionSucceeded: SubscriptionPaymentSucceededRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription payment succeeded event for subscription with id ${subscriptionSucceeded.subscription_id} and alert id ${subscriptionSucceeded.alert_id}`
  );

  const db = await connectToDatabase(DB_LMP);

  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionSucceeded.subscription_id,
    });

  if (!existingUserPaymentData) {
    console.error(
      `Could not find user payment data for subscription id ${subscriptionSucceeded.subscription_id}`
    );

    return {
      statusCode: 500,
      error: {
        message: `Could not find user payment data for subscription id ${subscriptionSucceeded.subscription_id}`,
      },
    };
  }

  // update user payment data with new data
  const upd: Partial<userPaymentData> = {
    subscription: {
      ...existingUserPaymentData.subscription,
      status: subscriptionSucceeded.status,
      planId: subscriptionSucceeded.subscription_plan_id,
      endDate: subscriptionSucceeded.next_bill_date,
    },
    debugMetadata: {
      ...existingUserPaymentData.debugMetadata,
      alertId: subscriptionSucceeded.alert_id,
      eventTime: subscriptionSucceeded.event_time,
    },
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .updateOne({ _id: existingUserPaymentData._id }, { $set: upd });

  if (result.modifiedCount !== 1) {
    console.error(
      `Could not update user payment data for subscription id ${subscriptionSucceeded.subscription_id}`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not update user payment data for subscription id ${subscriptionSucceeded.subscription_id}`,
      },
    };
  }

  // save payment history
  const paymentHistory: userPaymentHistory = {
    userId: existingUserPaymentData.userId,
    subscriptionId: subscriptionSucceeded.subscription_id,
    status: PaymentStatus.Success,
    createdAt: subscriptionSucceeded.event_time,
    subscriptionPaymentId: subscriptionSucceeded.subscription_payment_id,
    subscriptionPlanId: subscriptionSucceeded.subscription_plan_id,
    currency: subscriptionSucceeded.currency,

    successTransaction: {
      amount: subscriptionSucceeded.sale_gross,
      amountTax: subscriptionSucceeded.payment_tax,
      paddleFee: subscriptionSucceeded.fee,
      paymentMethod: subscriptionSucceeded.payment_method,
      receiptUrl: subscriptionSucceeded.receipt_url,
      customerName: subscriptionSucceeded.customer_name,
      userCountry: subscriptionSucceeded.country,
      initialPayment: isPositive(subscriptionSucceeded.initial_payment),
      instalments: subscriptionSucceeded.instalments,
    },

    debugMetadata: {
      alertId: subscriptionSucceeded.alert_id,
      eventTime: subscriptionSucceeded.event_time,
    },
  };

  const paymentHistoryResult = await db
    .collection<userPaymentHistory>(COLLECTION_LMP_USER_PAYMENT_HISTORY)
    .insertOne(paymentHistory);
  if (!paymentHistoryResult.insertedId) {
    console.error(
      `Could not save payment history for subscription id ${subscriptionSucceeded.subscription_id}`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not save payment history for subscription id ${subscriptionSucceeded.subscription_id}`,
      },
    };
  }

  // save old data to archives
  const archiveResult = await db
    .collection<userPaymentDataArchive>(
      COLLECTION_LMP_USER_PAYMENT_DATA_ARCHIVE
    )
    .insertOne({
      userId: existingUserPaymentData.userId,
      subscriptionId: existingUserPaymentData.subscription.id,
      action: AlertName.SubscriptionUpdated,
      history: {
        status: existingUserPaymentData.subscription.status,
        planId: existingUserPaymentData.subscription.planId,
        endDate: existingUserPaymentData.subscription.endDate,
        updateUrl: existingUserPaymentData.subscription.updateUrl,
        cancelUrl: existingUserPaymentData.subscription.cancelUrl,
      },
      historyMetadata: {
        alertId: existingUserPaymentData.debugMetadata.alertId,
        eventTime: existingUserPaymentData.debugMetadata.eventTime,
      },
      debugMetadata: {
        alertId: subscriptionSucceeded.alert_id,
        eventTime: subscriptionSucceeded.event_time,
      },
    });
  if (!archiveResult.insertedId) {
    console.error(
      `Could not insert user payment data history for subscription id ${subscriptionSucceeded.subscription_id}`
    );
  }

  // TODO: send email to user incase it's a renewal

  // TODO: Possibly generate a license key for the user and send it to them in case it's a renewal

  return {
    statusCode: 200,
    result: {
      message: `Updated user subscription with id ${existingUserPaymentData._id}`,
    },
  };
};
