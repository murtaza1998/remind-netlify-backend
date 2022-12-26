import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import {
  COLLECTION_LMP_NEWSLETTER_SUBSCRIPTIONS,
  connectToLMPDatabase,
} from "./lib/database";
import { GenericEmailer } from "./lib/email/genericEmailer";
import { extractNetlifySiteFromContext } from "./lib/netlify/extractNetlifyUrl";
import { CORS_HEADERS, JSON_HEADERS } from "./lib/http";
import { INewsletterSubscription } from "../definitions/database/newsletterSubscription";

type API_PAYLOAD = {
  email: string;
};

const handler: Handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "Cross site requests allowed!",
    };
  }

  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: "No body",
    };
  }

  const siteUrl = extractNetlifySiteFromContext(context);

  const { email } = JSON.parse(body) as API_PAYLOAD;

  const response = await internalHandler({
    email,
    siteUrl,
  });

  let responseBody: string;
  if (response.statusCode >= 200 && response.statusCode < 300) {
    const result = {
      success: true,
      ...(response.result && { data: response.result }),
    };

    responseBody = JSON.stringify(result);
  } else {
    const result = {
      success: false,
      ...(response.error && { error: response.error }),
    };

    responseBody = JSON.stringify(result);
  }

  return {
    statusCode: response.statusCode,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS,
    },
    body: responseBody,
  };
};

export const internalHandler = async ({
  email,
  siteUrl,
}: API_PAYLOAD & { siteUrl: string }): Promise<API_Response> => {
  const db = await connectToLMPDatabase();

  console.debug(`Received request to sign up for newsletter: ${email}`);

  if (!email || !email.trim()) {
    return {
      statusCode: 400,
      error: {
        message: "Invalid/missing email",
      },
    };
  }

  const result = await db
    .collection<INewsletterSubscription>(
      COLLECTION_LMP_NEWSLETTER_SUBSCRIPTIONS
    )
    .insertOne({
      email,
      createdAt: new Date(),
      isSubscribed: true,
    });
  if (!result.insertedId) {
    return {
      statusCode: 500,
      error: {
        message: "Error! Could not insert newsletter subscription",
      },
    };
  }

  console.debug(
    `Successfully inserted newsletter subscription for email: ${email} with id: ${result.insertedId}. Now sending email confirmation...`
  );

  await GenericEmailer.sendNewsletterSubscriptionCreatedEmail({
    siteUrl,
    db,
    contactEmail: email,
  });

  return {
    statusCode: 200,
    result: {
      message: "Successfully signed up for newsletter",
    },
  };
};

export { handler };
