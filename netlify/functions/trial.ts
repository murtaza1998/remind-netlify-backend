import { Handler } from "@netlify/functions";
import { API_Response } from "../definitions/API";
import { IReminderAppTrial } from "../definitions/database/trial";
import {
  COLLECTION_LMP_REMINDER_APP_TRIAL,
  connectToLMPDatabase,
} from "./lib/database";
import { cleanWorkspaceAddress } from "./lib/license/url";
import moment from "moment";
import { ENV_VARIABLES } from "./lib/configs/envVariables";
import { generateLicense } from "./lib/license/generateLicense";
import { GenericEmailer } from "./lib/email/genericEmailer";
import { extractNetlifySiteFromContext } from "./lib/netlify/extractNetlifyUrl";

type API_PAYLOAD = {
  email: string;
  contactName: string;
  workspaceAddress: string;
};

const handler: Handler = async (event, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
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

  const { email, workspaceAddress, contactName } = JSON.parse(
    body
  ) as API_PAYLOAD;

  const response = await internalHandler({
    email,
    workspaceAddress,
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
      "Content-Type": "application/json",
      ...corsHeaders,
    },
    body: responseBody,
  };
};

export const internalHandler = async ({
  email,
  workspaceAddress,
  contactName,
  siteUrl,
}: API_PAYLOAD & { siteUrl: string }): Promise<API_Response> => {
  const db = await connectToLMPDatabase();

  console.debug(`Received trial request for ${email} at ${workspaceAddress}`);

  if (
    !email ||
    !workspaceAddress ||
    !email.trim() ||
    !workspaceAddress.trim() ||
    !contactName ||
    !contactName.trim()
  ) {
    return {
      statusCode: 400,
      error: {
        message: "Invalid/missing email, contact name or workspace address",
      },
    };
  }

  const cleanedWorkspaceAddress = cleanWorkspaceAddress(workspaceAddress);

  const workspace = await db
    .collection<IReminderAppTrial>(COLLECTION_LMP_REMINDER_APP_TRIAL)
    .findOne({
      workspaceAddress: new RegExp(`.*${cleanedWorkspaceAddress}.*`),
    });
  if (workspace) {
    console.debug(
      `Found existing trial for ${email} at ${workspaceAddress}. Existing trial record id: ${workspace._id}`
    );

    return {
      statusCode: 400,
      error: {
        message: `Error! Workspace ${workspaceAddress} already has someone signed up for a trial! Please contact us if you think this is a mistake.`,
      },
    };
  }

  const trialEndDate = moment()
    .add(ENV_VARIABLES.TRIAL_MONTH, "months")
    .toDate();

  const license = await generateLicense({
    workspaceAddress,
    db,
    expiry: trialEndDate,
  });

  const result = await db
    .collection<IReminderAppTrial>(COLLECTION_LMP_REMINDER_APP_TRIAL)
    .insertOne({
      email,
      workspaceAddress: workspaceAddress,
      contactName,
      trialStartDate: new Date(),
      trialEndDate,
    });
  if (!result.insertedId) {
    return {
      statusCode: 500,
      error: {
        message: "Error! Could not insert trial into database",
      },
    };
  }

  console.debug(
    `Successfully inserted trial for ${email} at ${workspaceAddress}. Trial record id: ${result.insertedId}. Sending email...`
  );

  await GenericEmailer.sendNewTrialEmail({
    contactName,
    toEmail: email,
    workspaceAddress,
    license,
    siteUrl,
    db,
    expiryDate: trialEndDate.toDateString(),
  });

  return {
    statusCode: 200,
    result: {
      license,
      expiryDate: trialEndDate.toDateString(),
    },
  };
};

export { handler };
