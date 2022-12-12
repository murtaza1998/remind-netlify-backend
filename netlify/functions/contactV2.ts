import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import {
  COLLECTION_LMP_CONTACT_MESSAGES,
  connectToLMPDatabase,
} from "./lib/database";
import { GenericEmailer } from "./lib/email/genericEmailer";
import { extractNetlifySiteFromContext } from "./lib/netlify/extractNetlifyUrl";
import { IContactMsg } from "../definitions/database/contactMsg";
import { CORS_HEADERS, JSON_HEADERS } from "./lib/http";

type API_PAYLOAD = {
  email: string;
  contactName: string;
  message: string;
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

  const { email, message, contactName } = JSON.parse(body) as API_PAYLOAD;

  const response = await internalHandler({
    email,
    message,
    contactName,
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
  message,
  contactName,
  siteUrl,
}: API_PAYLOAD & { siteUrl: string }): Promise<API_Response> => {
  const db = await connectToLMPDatabase();

  console.debug(`Received new contact message from ${email}`);

  if (
    !email ||
    !message ||
    !email.trim() ||
    !message.trim() ||
    !contactName ||
    !contactName.trim()
  ) {
    return {
      statusCode: 400,
      error: {
        message: "Invalid/missing email, contact name or message",
      },
    };
  }

  const result = await db
    .collection<IContactMsg>(COLLECTION_LMP_CONTACT_MESSAGES)
    .insertOne({
      email,
      message,
      contactName,
    });
  if (!result.insertedId) {
    return {
      statusCode: 500,
      error: {
        message: "Error! Could not insert contact message",
      },
    };
  }

  console.debug(
    `Successfully inserted contact message with id ${result.insertedId}. Sending email notification now...`
  );

  await GenericEmailer.sendNewContactMessageEmail({
    contactName,
    contactEmail: email,
    message,
    siteUrl,
    db,
  });

  return {
    statusCode: 200,
  };
};

export { handler };
