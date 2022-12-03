import { Db } from "mongodb";
import { COLLECTION_LMP_USER_PAYMENT_DATA } from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import {
  PaddleSubscriptionStatus,
  SubscriptionUpdatedRequest,
} from "../../definitions/paddle";

export const handleSubscriptionUpdated = async (
  db: Db,
  subscriptionUpdated: SubscriptionUpdatedRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription updated event for subscription with id ${subscriptionUpdated.subscription_id} and alert id ${subscriptionUpdated.alert_id}`
  );

  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionUpdated.subscription_id,
    });

  if (!existingUserPaymentData) {
    console.error(
      `Could not find user payment data for subscription id ${subscriptionUpdated.subscription_id}`
    );

    return {
      statusCode: 500,
      error: {
        message: `Could not find user payment data for subscription id ${subscriptionUpdated.subscription_id}`,
      },
    };
  }

  // update user payment data with new data
  const upd: Partial<userPaymentData> = {
    subscription: {
      ...existingUserPaymentData.subscription,
      status: subscriptionUpdated.status,
      planId: subscriptionUpdated.subscription_plan_id,
      endDate: subscriptionUpdated.next_bill_date,
      updateUrl: subscriptionUpdated.update_url,
      cancelUrl: subscriptionUpdated.cancel_url,
    },
    alertIds: [
      ...existingUserPaymentData.alertIds,
      subscriptionUpdated.alert_id,
    ],
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .updateOne({ _id: existingUserPaymentData._id }, { $set: upd });

  if (result.modifiedCount !== 1) {
    console.error(
      `Could not update user payment data for subscription id ${subscriptionUpdated.subscription_id}`
    );
    return {
      statusCode: 500,
      error: {
        message: `Could not update user payment data for subscription id ${subscriptionUpdated.subscription_id}`,
      },
    };
  }

  if (subscriptionUpdated.status === PaddleSubscriptionStatus.Active) {
    // TODO: send email to user with updated license key
  }

  return {
    statusCode: 200,
    result: {
      message: `Updated user subscription with id ${existingUserPaymentData._id}`,
    },
  };
};
