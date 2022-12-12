import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import { lmpUser } from "../definitions/database/lmpUser";
import { verifyHash } from "./lib/hash";
import { createJwt } from "./lib/jwt";
import { connectToLMPDatabase, COLLECTION_LMP_USERS } from "./lib/database";
import { CORS_HEADERS, JSON_HEADERS } from "./lib/http";

type API_PAYLOAD = {
  email: string;
  password: string;
};

const handler: Handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: JSON_HEADERS,
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

  const { email, password } = JSON.parse(body) as API_PAYLOAD;

  const response = await internalHandler({
    email,
    password,
  });

  let bodyString = "";
  if (response.result) {
    bodyString = JSON.stringify(response.result);
  } else if (response.error) {
    bodyString = JSON.stringify(response.error);
  }

  return {
    statusCode: response.statusCode,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS,
    },
    body: bodyString,
  };
};

const internalHandler = async ({
  email,
  password,
}: API_PAYLOAD): Promise<API_Response> => {
  const db = await connectToLMPDatabase();

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    return {
      statusCode: 400,
      error: {
        message: "Required fields (email, password) are missing",
      },
    };
  }

  const user = await db.collection<lmpUser>(COLLECTION_LMP_USERS).findOne({
    email,
  });

  if (!user) {
    return {
      statusCode: 400,
      error: {
        message: "Email not found",
        developerCode: 2,
      },
    };
  }

  const {
    password: { hash, salt },
  } = user;

  if (!verifyHash(password, salt, hash)) {
    return {
      statusCode: 400,
      error: {
        message: "Incorrect password",
        developerCode: 3,
      },
    };
  }

  const jwtToken = createJwt(email, user.role);

  return {
    statusCode: 200,
    result: {
      jwtToken,
    },
  };
};

export { handler };
