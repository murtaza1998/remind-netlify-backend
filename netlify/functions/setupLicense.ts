import { Handler } from "@netlify/functions";
import axios, { AxiosError } from "axios";
import { Db } from "mongodb";
import { API_Response } from "../definitions/API";
import { ILicenseSetupDbRecord } from "../definitions/database/licenseSetup";
import { userPaymentData } from "../definitions/database/paddle/userPaymentData";
import { ENV_VARIABLES } from "./lib/configs/envVariables";
import {
  COLLECTION_LMP_LICENSE_SETUP,
  COLLECTION_LMP_USER_PAYMENT_DATA,
  connectToLMPDatabase,
} from "./lib/database";
import {
  markLicenseSetupRecordAsFailed,
  markLicenseSetupRecordAsSuccess,
} from "./lib/license/autoSetupLicense";
import {
  encodeDataWithPrivateKey,
  generateLicenseWithPrivateKeyData,
  getPrivateKeyAndPassphrase,
} from "./lib/license/generateLicense";
import { removeTrailingSlashFromUrl } from "./lib/utils";

type API_PAYLOAD = {
  subscriptionId: string;
  updateAutoSetupLicenseRecord?: boolean;
};

enum GET_API_PAYLOAD_ACTION {
  INSTALLATION_CHECK = "installationCheck",
  LICENSE_CHECK = "licenseCheck",
}

type GET_API_PAYLOAD = {
  action: GET_API_PAYLOAD_ACTION;
};

const handler: Handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
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

  const { subscriptionId, updateAutoSetupLicenseRecord = false } = JSON.parse(
    body
  ) as API_PAYLOAD;
  if (!subscriptionId) {
    return {
      statusCode: 400,
      body: "No subscriptionId",
    };
  }

  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await connectToLMPDatabase();

  const response = await internalHandler(db, subscriptionId);

  let responseBody: string;
  if (response.statusCode >= 200 && response.statusCode < 300) {
    const result = {
      success: true,
      ...(response.result && { data: response.result }),
    };

    responseBody = JSON.stringify(result);

    if (updateAutoSetupLicenseRecord) {
      await markLicenseSetupRecordAsSuccess(db, subscriptionId);
    }
  } else {
    const result = {
      success: false,
      ...(response.error && { error: response.error }),
    };

    responseBody = JSON.stringify(result);

    if (updateAutoSetupLicenseRecord) {
      await markLicenseSetupRecordAsFailed(
        db,
        subscriptionId,
        response.error?.message || "Unknown error"
      );
    }
  }

  return {
    statusCode: response.statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: responseBody,
  };
};

const internalHandler = async (
  db: Db,
  subscriptionId: string
): Promise<API_Response> => {
  // find existing user payment data by subscription id
  const existingUserPaymentData = await db
    .collection<userPaymentData>(COLLECTION_LMP_USER_PAYMENT_DATA)
    .findOne({
      "subscription.id": subscriptionId,
    });
  if (!existingUserPaymentData) {
    console.error(
      `Could not find user payment data for subscription id ${subscriptionId}`
    );

    return {
      statusCode: 400,
      error: {
        message: `Could not find user payment data for subscription id ${subscriptionId}`,
      },
    };
  }

  const {
    subscription: { status, endDate },
    passthrough: { workspaceAddress },
  } = existingUserPaymentData;

  // verify that the user subscription is active
  if (status !== "active") {
    console.error(
      `User subscription is not active for subscription id ${subscriptionId}`
    );

    return {
      statusCode: 400,
      error: {
        message: `User subscription is not active for subscription id ${subscriptionId}`,
      },
    };
  }

  // send request to workspace's /api/info endpoint to check if the workspace is accessible
  if (!workspaceAddress) {
    console.error(
      `Workspace address is not defined for subscription id ${subscriptionId}`
    );

    return {
      statusCode: 400,
      error: {
        message: `Workspace address is not defined for subscription id ${subscriptionId}`,
      },
    };
  }

  const workspaceInfoApiUrl = `${removeTrailingSlashFromUrl(
    workspaceAddress
  )}/api/info`;

  try {
    console.debug(
      `Verifying if workspace is accessible for subscription id ${subscriptionId} with url ${workspaceInfoApiUrl}`
    );

    const workspaceInfoResponse = await axios.get<{
      success: boolean;
      version: number;
    }>(workspaceInfoApiUrl);

    if (!workspaceInfoResponse.data.success) {
      throw new Error(
        `Workspace info api returned success false for subscription id ${subscriptionId}. Response from api: ${JSON.stringify(
          workspaceInfoResponse.data
        )}`
      );
    }
  } catch (error: AxiosError | unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error when calling workspace info api for subscription id ${subscriptionId}. Likely the workspace address is incorrect or the workspace is behind a firewall. Error:`,
        error.message,
        error.response?.data
      );

      return {
        statusCode: 400,
        error: {
          message: `Error when calling workspace info api for subscription id ${subscriptionId}. Likely the workspace address is incorrect or the workspace is behind a firewall. Error: ${error.message}`,
        },
      };
    } else {
      console.error(
        `Error when calling workspace info api for subscription id ${subscriptionId}. Error:`,
        error
      );

      return {
        statusCode: 400,
        error: {
          message: `Error when calling workspace info api for subscription id ${subscriptionId}. Error: ${error}`,
        },
      };
    }
  }

  // send request to workspace's app api to check if the app is installed
  const workspaceAppApiUrl = `${removeTrailingSlashFromUrl(
    workspaceAddress
  )}/api/apps/public/${ENV_VARIABLES.REMINDER_APP_ID}/license`;

  const preCheckPayload: GET_API_PAYLOAD = {
    action: GET_API_PAYLOAD_ACTION.INSTALLATION_CHECK,
  };

  const privateData = await getPrivateKeyAndPassphrase(db);

  try {
    console.debug(
      `Verifying if workspace app is installed for subscription id ${subscriptionId} with url ${workspaceAppApiUrl}`
    );

    const payload = await encodeDataWithPrivateKey(
      JSON.stringify(preCheckPayload),
      privateData
    );

    const workspaceAppResponse = await axios.get<{
      success: boolean;
      message: string;
    }>(workspaceAppApiUrl, {
      params: {
        payload,
      },
    });

    if (!workspaceAppResponse.data.success) {
      throw new Error(
        `Workspace app api returned success false for subscription id ${subscriptionId}. Message: ${workspaceAppResponse.data.message}. Likely the app is not installed.`
      );
    }
  } catch (error: AxiosError | unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error when calling workspace app api for subscription id ${subscriptionId}. Likely the app is not installed. Error:`,
        error.message,
        error.response?.data
      );

      return {
        statusCode: 400,
        error: {
          message: `Error when calling workspace app api for subscription id ${subscriptionId}. Likely the app is not installed. Error: ${error.message}`,
        },
      };
    } else {
      console.error(
        `Error when calling workspace app api for subscription id ${subscriptionId}. Error:`,
        error
      );

      return {
        statusCode: 400,
        error: {
          message: `Error when calling workspace app api for subscription id ${subscriptionId}. Error: ${error}`,
        },
      };
    }
  }

  // create a license for the user
  const license = await generateLicenseWithPrivateKeyData(
    workspaceAddress,
    new Date(endDate),
    privateData
  );

  // send request to license server to create a license
  try {
    // TODO: Send a hashed along with the license to verify it's authenticity. make sure to include timestamp in the hash
    const licenseServerResponse = await axios.post<{
      success: boolean;
      error?: string;
    }>(workspaceAppApiUrl, {
      license,
    });

    if (!licenseServerResponse.data.success) {
      throw new Error(
        `License server returned success false for subscription id ${subscriptionId}. Error: ${licenseServerResponse.data.error}`
      );
    }
  } catch (error: AxiosError | unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Error when sending license to workspace app api for subscription id ${subscriptionId}. Error:`,
        error.message,
        error.response?.data
      );

      return {
        statusCode: 500,
        error: {
          message: `Error when sending license to workspace app api for subscription id ${subscriptionId}. Error: ${error.message}`,
        },
      };
    } else {
      console.error(
        `Error when sending license to workspace app api for subscription id ${subscriptionId}. Error:`,
        error
      );

      return {
        statusCode: 500,
        error: {
          message: `Error when sending license to workspace app api for subscription id ${subscriptionId}. Error: ${error}`,
        },
      };
    }
  }

  return {
    statusCode: 200,
    result: {
      success: true,
    },
  };
};

export { handler };
