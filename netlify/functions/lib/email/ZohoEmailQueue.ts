// this is to make email sending totally async because nodemailer takes a while to send email
// and paddle requires response within 10 seconds

import { Db, WithoutId } from "mongodb";
import { IEmailDbRecord } from "../../../definitions/database/email";
import { generateRandomId } from "./utils";
import axios, { AxiosError } from "axios";
import { COLLECTION_LMP_EMAIL_QUEUE } from "../database";
import { sleep } from "../utils";

class ZohoEmailQueueClass {
  async sendEmail(
    db: Db,
    siteUrl: string,
    emailInfo: WithoutId<IEmailDbRecord>
  ) {
    const randomId = generateRandomId();

    const result = await db
      .collection<IEmailDbRecord>(COLLECTION_LMP_EMAIL_QUEUE)
      .insertOne({
        _id: randomId,
        ...emailInfo,
      });

    if (!result.insertedId) {
      throw new Error("Unable to insert email into queue");
    }

    const emailEndpoint = new URL(
      "/.netlify/functions/sendEmail",
      siteUrl
    ).toString();

    console.debug(
      `Inserted email into queue with id ${randomId} with subject ${emailInfo.subject} and to ${emailInfo.to} using endpoint ${emailEndpoint}`
    );

    // trigger netlify function to send email
    // Purposefully not awaiting this because we don't want to block the request
    axios
      .post(emailEndpoint.toString(), {
        emailId: randomId,
      })
      .then((res) => {
        if (!res.status || res.status !== 200) {
          console.error(
            `Unable to send email ${randomId}. Response status: ${res.status} and response data: ${res.data}`
          );
        } else {
          console.info(`Email ${randomId} sent`);
        }
      })
      .catch((err: AxiosError) => {
        console.error(`Unable to send email ${randomId}. Error:`, err.message);
      });

    // wait for 1.5 seconds before returning so that the above axios call has time to finish
    await sleep(1500);
  }
}

export const ZohoEmailQueue = new ZohoEmailQueueClass();
