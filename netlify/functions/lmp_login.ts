import { Handler } from "@netlify/functions";
import { connectToDatabase, DB_LMP, COLLECTION_LMP_USERS } from "../database";
import { API_Response } from "../definitions/API";
import { lmpUser } from "../definitions/database/lmpUser";
import { verifyHash } from "../hash";
import { createJwt } from "../jwt";

type API_PAYLOAD = {
  email: string;
  password: string;
};

const handler: Handler = async (event, context) => {
  const db = await connectToDatabase(DB_LMP);

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
      "Content-Type": "application/json",
    },
    body: bodyString,
  };
};

const internalHandler = async ({
  email,
  password,
}: API_PAYLOAD): Promise<API_Response> => {
  const db = await connectToDatabase(DB_LMP);

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
