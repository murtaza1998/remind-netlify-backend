import { Handler } from "@netlify/functions";
import {
  COLLECTION_LMP_EMAIL_QUEUE,
  connectToLMPDatabase,
} from "./lib/database";
import { IEmailDbRecord } from "../definitions/database/email";
import { ENV_VARIABLES } from "./lib/configs/envVariables";
import { getZohoContactMailer } from "./lib/email/emailProvider";

type API_PAYLOAD = {
  emailId: string;
};

const handler: Handler = async (event, context) => {
  const { body } = event;
  if (!body) {
    return {
      statusCode: 400,
      body: "No body",
    };
  }

  const { emailId } = JSON.parse(body) as API_PAYLOAD;
  console.debug(`sendEmail received emailId: ${emailId}`);

  const db = await connectToLMPDatabase();

  const emailQueueRecord = await db
    .collection<IEmailDbRecord>(COLLECTION_LMP_EMAIL_QUEUE)
    .findOne({
      _id: emailId,
    });

  if (!emailQueueRecord) {
    return {
      statusCode: 400,
      body: `Unable to find email with id ${emailId}`,
    };
  }

  const { to, from, subject, html } = emailQueueRecord;
  if (from !== ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL) {
    return {
      statusCode: 400,
      body: `Unable to send email with id ${emailId} because from email is not ${ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL}`,
    };
  }

  try {
    const startTimestamp = Date.now();
    console.debug(`Sending email to ${to} at ${startTimestamp}`);

    await getZohoContactMailer().sendEmail(to, subject, html);

    console.debug(
      `Email sent to ${to} at ${Date.now()}. Took ${
        Date.now() - startTimestamp
      } ms`
    );
  } catch (err) {
    console.error(`Unable to send email with id ${emailId}. Error:`, err);

    return {
      statusCode: 500,
      body: `Unable to send email with id ${emailId}. Error: ${err?.message}`,
    };
  }

  // delete email from queue
  try {
    const result = await db
      .collection<IEmailDbRecord>(COLLECTION_LMP_EMAIL_QUEUE)
      .deleteOne({ _id: emailId });
    if (!result.deletedCount || result.deletedCount !== 1) {
      throw new Error(
        `Unable to delete email with id ${emailId} from queue. Deleted count: ${result.deletedCount}`
      );
    }
  } catch (err) {
    console.error(
      `Unable to delete email with id ${emailId} from queue after sending. Error:`,
      err
    );
  }

  return {
    statusCode: 200,
    body: "OK",
  };
};

export { handler };
