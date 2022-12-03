import { Handler } from "@netlify/functions";
import { COLLECTION_LMP_USERS, connectToLMPDatabase } from "../database";
import { API_Response } from "../definitions/API";
import { hashOf } from "../hash";

type API_PAYLOAD = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const handler: Handler = async (event, context) => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: "No body",
    };
  }

  const { email, password, firstName, lastName } = JSON.parse(
    body
  ) as API_PAYLOAD;

  const response = await internalHandler({
    email,
    password,
    firstName,
    lastName,
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
  firstName,
  lastName,
}: API_PAYLOAD): Promise<API_Response> => {
  const db = await connectToLMPDatabase();

  if (
    !email ||
    !password ||
    !firstName ||
    !lastName ||
    email.trim() === "" ||
    password.trim() === "" ||
    firstName.trim() === "" ||
    lastName.trim() === ""
  ) {
    return {
      statusCode: 400,
      error: {
        message:
          "Required fields (email, password, firstName, lastName) are missing",
      },
    };
  }

  const { hash, salt } = hashOf(password);

  const doesUserExist = await db
    .collection(COLLECTION_LMP_USERS)
    .findOne({ email });

  if (doesUserExist) {
    return {
      statusCode: 400,
      error: {
        message: "User already exists",
        developerCode: 1,
      },
    };
  }

  const result = await db.collection(COLLECTION_LMP_USERS).insertOne({
    email,
    password: {
      hash,
      salt,
    },
    role: "user",
  });

  if (result.insertedId) {
    return {
      statusCode: 200,
      result: {
        message: "OK",
      },
    };
  } else {
    console.log(`Something went wrong when inserting user ${email}`);
    return {
      statusCode: 500,
      error: {
        message: "Something went wrong",
      },
    };
  }
};

export { handler };
