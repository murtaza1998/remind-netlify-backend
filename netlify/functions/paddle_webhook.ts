import { Handler } from "@netlify/functions";
import { connectToDatabase, DB_LMP } from "../database";
import { API_Response } from "../definitions/API";
import { userPaymentData } from "../definitions/database/paddle/userPaymentData";
import {
  AlertName,
  BasePaddleRequest,
  SubscriptionCancelledRequest,
  SubscriptionCreatedRequest,
  SubscriptionPaymentFailedRequest,
  SubscriptionPaymentSucceededRequest,
  SubscriptionUpdatedRequest,
} from "../definitions/paddle";
import { isPaddleWebhookValid } from "../paddleWebhookVerification";
import { parse } from "querystring";
import { handleSubscriptionCreated } from "./paddleWebhookEventsHandlers/handleSubscriptionCreated";
import { handleSubscriptionUpdated } from "./paddleWebhookEventsHandlers/handleSubscriptionUpdated";
import { handleSubscriptionCancelled } from "./paddleWebhookEventsHandlers/handleSubscriptionCancelled";
import { handleSubscriptionPaymentSucceeded } from "./paddleWebhookEventsHandlers/handleSubscriptionPaymentSucceeded";
import { handleSubscriptionPaymentFailed } from "./paddleWebhookEventsHandlers/handleSubscriptionPaymentFailed";

const handler: Handler = async (event, context) => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: "No body",
    };
  }

  let parsedBody: BasePaddleRequest | null = null;
  try {
    parsedBody = parse(body) as unknown as BasePaddleRequest;
    if (!parsedBody) {
      return {
        statusCode: 400,
        body: "Invalid JSON.",
      };
    }

    console.info(
      `Paddle webhook received: ${parsedBody.alert_name} with alert_id ${parsedBody.alert_id}`
    );
  } catch (e) {
    console.error("Error parsing body", e);
    return {
      statusCode: 400,
      body: "Invalid JSON. Error parsing body.",
    };
  }

  if (!isPaddleWebhookValid(parsedBody)) {
    return {
      statusCode: 400,
      body: "Invalid Paddle webhook",
    };
  }

  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  let response: API_Response;
  switch (parsedBody.alert_name) {
    case AlertName.SubscriptionCreated: {
      const subscriptionCreated = parsedBody as SubscriptionCreatedRequest;
      response = await handleSubscriptionCreated(subscriptionCreated);
      break;
    }
    case AlertName.SubscriptionUpdated: {
      const subscriptionUpdated = parsedBody as SubscriptionUpdatedRequest;
      response = await handleSubscriptionUpdated(subscriptionUpdated);
      break;
    }
    case AlertName.SubscriptionCancelled: {
      const subscriptionCancelled = parsedBody as SubscriptionCancelledRequest;
      response = await handleSubscriptionCancelled(subscriptionCancelled);
      break;
    }
    case AlertName.SubscriptionPaymentSucceeded: {
      const subscriptionPaymentSucceeded =
        parsedBody as SubscriptionPaymentSucceededRequest;
      response = await handleSubscriptionPaymentSucceeded(
        subscriptionPaymentSucceeded
      );
      break;
    }
    case AlertName.SubscriptionPaymentFailed: {
      const subscriptionPaymentFailed =
        parsedBody as SubscriptionPaymentFailedRequest;
      response = await handleSubscriptionPaymentFailed(
        subscriptionPaymentFailed
      );
    }
  }

  // TODO: https://github.com/daveagill/verify-paddle-webhook

  // TODO: POSSIBLE TYPING: https://github.com/sarimabbas/paddle-webhook-utils
  // OR: https://gist.github.com/dsumer/5a4b120d6c8bde061b75667b067797c7

  // TODO: https://www.npmjs.com/package/paddle-sdk
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Hello World",
    }),
  };
};

export { handler };
