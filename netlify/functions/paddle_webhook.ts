import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import {
  AlertName,
  BasePaddleRequest,
  SubscriptionCancelledRequest,
  SubscriptionCreatedRequest,
  SubscriptionPaymentFailedRequest,
  SubscriptionPaymentRefundedRequest,
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
import { connectToLMPDatabase } from "../database";
import { handleSubscriptionPaymentRefunded } from "./paddleWebhookEventsHandlers/handleSubscriptionPaymentRefunded";

/**
 *
 * References:
 * - https://github.com/daveagill/verify-paddle-webhook
 * - https://gist.github.com/dsumer/5a4b120d6c8bde061b75667b067797c7
 * - https://snappify.io/blog/step-by-step-guide-for-paddle-integration
 * - https://github.com/sarimabbas/paddle-webhook-utils
 * - https://www.npmjs.com/package/paddle-sdk
 */

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

  const db = await connectToLMPDatabase();

  let response: API_Response;
  switch (parsedBody.alert_name) {
    case AlertName.SubscriptionCreated: {
      const subscriptionCreated = parsedBody as SubscriptionCreatedRequest;
      response = await handleSubscriptionCreated(db, subscriptionCreated);
      break;
    }
    case AlertName.SubscriptionUpdated: {
      const subscriptionUpdated = parsedBody as SubscriptionUpdatedRequest;
      response = await handleSubscriptionUpdated(db, subscriptionUpdated);
      break;
    }
    case AlertName.SubscriptionCancelled: {
      const subscriptionCancelled = parsedBody as SubscriptionCancelledRequest;
      response = await handleSubscriptionCancelled(db, subscriptionCancelled);
      break;
    }
    case AlertName.SubscriptionPaymentSucceeded: {
      const subscriptionPaymentSucceeded =
        parsedBody as SubscriptionPaymentSucceededRequest;
      response = await handleSubscriptionPaymentSucceeded(
        db,
        subscriptionPaymentSucceeded
      );
      break;
    }
    case AlertName.SubscriptionPaymentFailed: {
      const subscriptionPaymentFailed =
        parsedBody as SubscriptionPaymentFailedRequest;
      response = await handleSubscriptionPaymentFailed(
        db,
        subscriptionPaymentFailed
      );
      break;
    }
    case AlertName.SubscriptionPaymentRefunded: {
      const subscriptionPaymentRefunded =
        parsedBody as SubscriptionPaymentRefundedRequest;
      response = await handleSubscriptionPaymentRefunded(
        db,
        subscriptionPaymentRefunded
      );
      break;
    }
    default: {
      console.error(
        `Unknown Paddle webhook received: ${parsedBody.alert_name} with alert_id ${parsedBody.alert_id}`
      );
      response = {
        statusCode: 400,
        error: {
          message: "Unknown Paddle webhook received",
        },
      };
    }
  }

  return response;
};

export { handler };