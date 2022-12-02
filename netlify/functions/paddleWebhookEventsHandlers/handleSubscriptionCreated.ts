import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  connectToDatabase,
  DB_LMP,
} from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { SubscriptionCreatedRequest } from "../../definitions/paddle";
import { isPositive } from "./utils";

export const handleSubscriptionCreated = async (
  subscriptionCreated: SubscriptionCreatedRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription created event for user ${subscriptionCreated.email} with subscription id ${subscriptionCreated.subscription_id} and alert id ${subscriptionCreated.alert_id}`
  );
  const db = await connectToDatabase(DB_LMP);

  const upd: Omit<userPaymentData, "_id"> = {
    userId: subscriptionCreated.user_id,
    email: subscriptionCreated.email,
    subscription: {
      id: subscriptionCreated.subscription_id,
      planId: subscriptionCreated.subscription_plan_id,
      status: subscriptionCreated.status,
      endDate: subscriptionCreated.next_bill_date,
      updateUrl: subscriptionCreated.update_url,
      cancelUrl: subscriptionCreated.cancel_url,
    },
    checkoutId: subscriptionCreated.checkout_id,
    marketingConsent: isPositive(subscriptionCreated.marketing_consent),
    debugMetadata: {
      alertId: subscriptionCreated.alert_id,
      eventTime: subscriptionCreated.event_time,
    },
  };

  const result = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .insertOne(upd);

  if (!result.insertedId) {
    return {
      statusCode: 500,
      error: {
        message: "Could not insert user payment data",
      },
    };
  }

  return {
    statusCode: 200,
    result: {
      message: `Inserted user payment data with id ${result.insertedId}`,
    },
  };
};
