import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import { userPaymentData } from "../definitions/database/paddle/userPaymentData";
import {
  COLLECTION_LMP_USER_PAYMENT_DATA,
  connectToLMPDatabase,
} from "./lib/database";
import { CORS_HEADERS, JSON_HEADERS } from "./lib/http";
import { generateLicense } from "./lib/license/generateLicense";

type API_PAYLOAD = {
  checkoutId: string;
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

  const { checkoutId } = JSON.parse(body) as API_PAYLOAD;

  const response = await internalHandler({
    checkoutId,
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

const internalHandler = async ({
  checkoutId,
}: API_PAYLOAD): Promise<API_Response> => {
  const db = await connectToLMPDatabase();
  if (!checkoutId) {
    return {
      statusCode: 400,
      error: {
        message: "Missing checkoutId",
      },
    };
  }

  const userPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({ checkoutId });
  if (!userPaymentData) {
    return {
      statusCode: 404,
      error: {
        message: "No user found with that checkoutId",
      },
    };
  }

  const {
    subscription: { status, endDate },
  } = userPaymentData;
  if (status !== "active") {
    return {
      statusCode: 400,
      error: {
        message: "User subscription is not active",
      },
    };
  }

  const license = await generateLicense({
    workspaceAddress: userPaymentData.passthrough.workspaceAddress,
    expiry: new Date(endDate),
    db,
  });

  return {
    statusCode: 200,
    result: {
      license,
    },
  };
};

export { handler };
