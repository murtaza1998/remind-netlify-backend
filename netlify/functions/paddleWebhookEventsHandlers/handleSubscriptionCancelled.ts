import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  COLLECTION_LMP_USER_PAYMENT_DATA_ARCHIVE,
  connectToDatabase,
  DB_LMP,
} from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { userPaymentDataArchive } from "../../definitions/database/paddle/userPaymentDataArchive";
import {
  AlertName,
  SubscriptionCancelledRequest,
} from "../../definitions/paddle";

export const handleSubscriptionCancelled = async (
  subscriptionCancelled: SubscriptionCancelledRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription cancelled event for subscription with id ${subscriptionCancelled.subscription_id} and alert id ${subscriptionCancelled.alert_id}`
  );

  const db = await connectToDatabase(DB_LMP);

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
    debugMetadata: {
      ...existingUserPaymentData.debugMetadata,
      alertId: subscriptionCancelled.alert_id,
      eventTime: subscriptionCancelled.event_time,
    },
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

  // save old data to history
  const history = await db
    .collection<userPaymentDataArchive>(
      COLLECTION_LMP_USER_PAYMENT_DATA_ARCHIVE
    )
    .insertOne({
      userId: existingUserPaymentData.userId,
      subscriptionId: existingUserPaymentData.subscription.id,
      action: AlertName.SubscriptionCancelled,
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
        alertId: subscriptionCancelled.alert_id,
        eventTime: subscriptionCancelled.event_time,
      },
    });

  if (!history.insertedId) {
    console.error(
      `Could not insert user payment data history for subscription id ${subscriptionCancelled.subscription_id} when handling subscription cancelled event`
    );
  }

  // TODO: send email to user

  // TODO: Possibly generate a license key for the user and send it to them

  return {
    statusCode: 200,
    result: {
      message: `Cancelled user subscription with id ${existingUserPaymentData._id}`,
    },
  };
};
