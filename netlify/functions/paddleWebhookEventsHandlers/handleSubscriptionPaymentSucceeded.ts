import { Db } from "mongodb";
import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY,
} from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { subscriptionPaymentHistory } from "../../definitions/database/paddle/userPaymentHistory";
import {
  PaymentStatus,
  SubscriptionPaymentSucceededRequest,
} from "../../definitions/paddle";
import { isPositive } from "./utils";

export const handleSubscriptionPaymentSucceeded = async (
  db: Db,
  subscriptionSucceeded: SubscriptionPaymentSucceededRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription payment succeeded event for subscription with id ${subscriptionSucceeded.subscription_id} and alert id ${subscriptionSucceeded.alert_id}`
  );

  const { initial_payment } = subscriptionSucceeded;
  if (isPositive(initial_payment)) {
    await handleInitialPayment(subscriptionSucceeded, db);
  } else {
    try {
      await handleRenewalPayment(subscriptionSucceeded, db);
    } catch (e) {
      console.error("Error handling renewal payment", e);
      return {
        statusCode: 500,
        error: {
          message: e.message,
        },
      };
    }
  }

  // save payment history
  const paymentHistory: subscriptionPaymentHistory = {
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
    .collection<subscriptionPaymentHistory>(
      COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY
    )
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

  // TODO: send email to user incase it's a renewal
  if (isPositive(subscriptionSucceeded.initial_payment)) {
    // No need to send email for initial payment since we're already sending an email on "handleSubscriptionCreate" event
  } else {
    // send email to user with their license key
  }

  return {
    statusCode: 200,
    result: {
      message: `Updated user payment data for subscription id ${subscriptionSucceeded.subscription_id}`,
    },
  };
};

const handleInitialPayment = async (
  subscriptionSucceeded: SubscriptionPaymentSucceededRequest,
  db: Db
) => {
  // TODO: Not sure what to do here yet
};

const handleRenewalPayment = async (
  subscriptionSucceeded: SubscriptionPaymentSucceededRequest,
  db: Db
) => {
  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionSucceeded.subscription_id,
    });

  if (!existingUserPaymentData) {
    throw new Error(
      `Could not find user payment data for subscription id ${subscriptionSucceeded.subscription_id}`
    );
  }

  // update user payment data with new data
  const upd: Partial<userPaymentData> = {
    subscription: {
      ...existingUserPaymentData.subscription,
      status: subscriptionSucceeded.status,
      planId: subscriptionSucceeded.subscription_plan_id,
      endDate: subscriptionSucceeded.next_bill_date,
    },
    alertIds: [
      ...existingUserPaymentData.alertIds,
      subscriptionSucceeded.alert_id,
    ],
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .updateOne({ _id: existingUserPaymentData._id }, { $set: upd });

  if (result.modifiedCount !== 1) {
    throw new Error(
      `Could not update user payment data for subscription id ${subscriptionSucceeded.subscription_id}`
    );
  }
};
