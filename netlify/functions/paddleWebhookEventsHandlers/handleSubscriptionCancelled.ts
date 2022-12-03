import { Db } from "mongodb";
import { COLLECTION_LMP_USER_PAYMENT_DATA } from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { SubscriptionCancelledRequest } from "../../definitions/paddle";

export const handleSubscriptionCancelled = async (
  db: Db,
  subscriptionCancelled: SubscriptionCancelledRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription cancelled event for subscription with id ${subscriptionCancelled.subscription_id} and alert id ${subscriptionCancelled.alert_id}`
  );

  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionCancelled.subscription_id,
    });

  if (!existingUserPaymentData) {
    console.error(
      `Could not find user payment data for subscription id ${subscriptionCancelled.subscription_id}`
    );

    return {
      statusCode: 500,
      error: {
        message: `Could not find user payment data for subscription id ${subscriptionCancelled.subscription_id}`,
      },
    };
  }

  // update user payment data with new data
  const upd: Partial<userPaymentData> = {
    subscription: {
      ...existingUserPaymentData.subscription,
      status: subscriptionCancelled.status,
      endDate: subscriptionCancelled.cancellation_effective_date,
    },
    alertIds: [
      ...existingUserPaymentData.alertIds,
      subscriptionCancelled.alert_id,
    ],
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .updateOne({ _id: existingUserPaymentData._id }, { $set: upd });

  if (result.modifiedCount !== 1) {
    console.error(
      `Could not update user payment data for subscription id ${subscriptionCancelled.subscription_id} when handling subscription cancelled event`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not update user payment data for subscription id ${subscriptionCancelled.subscription_id} when handling subscription cancelled event`,
      },
    };
  }

  // TODO: send email to user

  return {
    statusCode: 200,
    result: {
      message: `Cancelled user subscription with id ${existingUserPaymentData._id}`,
    },
  };
};
