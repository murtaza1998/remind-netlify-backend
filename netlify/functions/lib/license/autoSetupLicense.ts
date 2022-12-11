import axios, { AxiosError } from "axios";
import { Db } from "mongodb";
import { ILicenseSetupDbRecord } from "../../../definitions/database/licenseSetup";
import { COLLECTION_LMP_LICENSE_SETUP } from "../database";
import { generateRandomId } from "../email/utils";

export const autoSetupLicense = async (
  db: Db,
  siteUrl: string,
  subscriptionId: string,
  event: ILicenseSetupDbRecord["event"]
): Promise<void> => {
  // save record in db
  console.debug(
    `Saving license setup record for ${subscriptionId} in db for queue`
  );
  const randomId = generateRandomId();
  const result = await db
    .collection<ILicenseSetupDbRecord>(COLLECTION_LMP_LICENSE_SETUP)
    .insertOne({
      _id: randomId,
      subscriptionId,
      createdAt: new Date(),
      event,
      status: "pending",
    });
  if (!result.insertedId) {
    throw new Error("Unable to insert license setup record into db for queue");
  }

  console.debug(
    `Inserted license setup record for ${subscriptionId} in db for queue with id ${randomId}`
  );

  // trigger netlify setupLicense function
  // Purposefully not awaiting this because we don't want to block the request
  axios
    .post(new URL("/.netlify/functions/setupLicense", siteUrl).toString(), {
      subscriptionId,
      updateAutoSetupLicenseRecord: true,
    })
    .then((res) => {
      if (!res.status || res.status !== 200) {
        console.error(
          `Unable to trigger setupLicense function for ${subscriptionId}. Response status: ${res.status} and response data: ${res.data}`
        );
      } else {
        console.debug(
          `SetupLicense function triggered successfully for ${subscriptionId}`
        );
      }
    })
    .catch((err: AxiosError) => {
      console.error(
        `Unable to trigger setupLicense function for ${subscriptionId}. Error:`,
        err.message
      );
    });
};

export const markLicenseSetupRecordAsFailed = async (
  db: Db,
  subscriptionId: string,
  error: string
): Promise<void> => {
  console.debug(
    `Marking license setup record for ${subscriptionId} as failed in db for queue with error ${error}`
  );

  try {
    await db
      .collection<ILicenseSetupDbRecord>(COLLECTION_LMP_LICENSE_SETUP)
      .updateOne(
        {
          subscriptionId,
        },
        {
          $set: {
            status: "failed",
            failedReason: error,
          },
        }
      );
  } catch (error) {
    // This is not a critical error. We can still return success to the user
    console.error(
      `Error when updating auto setup license record for subscription id ${subscriptionId}. Error:`,
      error
    );
  }
};

export const markLicenseSetupRecordAsSuccess = async (
  db: Db,
  subscriptionId: string
): Promise<void> => {
  console.debug(
    `Marking license setup record as success for ${subscriptionId}`
  );
  try {
    await db
      .collection<ILicenseSetupDbRecord>(COLLECTION_LMP_LICENSE_SETUP)
      .updateOne(
        {
          subscriptionId,
        },
        {
          $set: {
            status: "success",
          },
        }
      );
  } catch (error) {
    // This is not a critical error. We can still return success to the user
    console.error(
      `Error when updating auto setup license record for subscription id ${subscriptionId}. Error:`,
      error
    );
  }
};
