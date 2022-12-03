import { Db } from "mongodb";
import { COLLECTION_LMP_USER_PAYMENT_DATA } from "../../database";
import { API_Response } from "../../definitions/API";
import { userPaymentData } from "../../definitions/database/paddle/userPaymentData";
import { SubscriptionCreatedRequest } from "../../definitions/paddle";
import { PaymentEmailer } from "../lib/email/paymentEmailer";
import { isPositive } from "./utils";

export const handleSubscriptionCreated = async (
  db: Db,
  subscriptionCreated: SubscriptionCreatedRequest
): Promise<API_Response> => {
  console.info(
    `Handling subscription created event for user ${subscriptionCreated.email} with subscription id ${subscriptionCreated.subscription_id} and alert id ${subscriptionCreated.alert_id}`
  );

  const { passthrough: passthroughString } = subscriptionCreated;
  let passthrough: userPaymentData["passthrough"];
  try {
    passthrough = JSON.parse(
      passthroughString
    ) as userPaymentData["passthrough"];
  } catch (error) {
    console.error(
      `Failed to parse passthrough string ${passthroughString} into JSON`
    );
    return {
      statusCode: 500,
      error: {
        message: "Failed to parse passthrough string into JSON",
      },
    };
  }

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
    passthrough,
    checkoutId: subscriptionCreated.checkout_id,
    marketingConsent: isPositive(subscriptionCreated.marketing_consent),
    alertIds: [subscriptionCreated.alert_id],
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

  console.info(
    `Inserted user payment data for user ${subscriptionCreated.email} with subscription id ${subscriptionCreated.subscription_id} and alert id ${subscriptionCreated.alert_id}`
  );

  if (subscriptionCreated.status === "active") {
    await PaymentEmailer.sendNewSubscriptionCreatedEmail(
      subscriptionCreated.email,
      upd
    );
  }

  return {
    statusCode: 200,
    result: {
      message: `Inserted user payment data with id ${result.insertedId}`,
    },
  };
};