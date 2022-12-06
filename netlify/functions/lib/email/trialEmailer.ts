import { Db } from "mongodb";
import { remindAppNewTrialTemplateProps } from "../../../definitions/email";
import { ENV_VARIABLES } from "../configs/envVariables";
import {
  remindAppNewTrialEmailTemplateBody,
  remindAppNewTrialEmailTemplateSubject,
} from "./templates/remindAppNewTrialEmailTemplate";
import { substituteEmailTemplateParams } from "./utils";
import { ZohoEmailQueue } from "./ZohoEmailQueue";

class TrialEmailerClass {
  async sendNewTrialEmail({
    db,
    toEmail,
    expiryDate: trialExpiry,
    license,
    workspaceAddress,
    contactName,
    siteUrl,
  }: {
    db: Db;
    toEmail: string;
    contactName: string;
    workspaceAddress: string;
    expiryDate: string;
    license: string;
    siteUrl: string;
  }): Promise<void> {
    console.info(`Sending new trial email to ${toEmail}`);

    const emailBody =
      substituteEmailTemplateParams<remindAppNewTrialTemplateProps>(
        remindAppNewTrialEmailTemplateBody,
        {
          license,
          contactName,
          workspaceAddress,
          trialExpiry,
          purchaseLink: ENV_VARIABLES.REMINDER_LICENSE_UPGRADE,
        }
      );

    console.debug(`Pushing email to queue for ${toEmail}`);

    try {
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to: toEmail,
        subject: remindAppNewTrialEmailTemplateSubject,
        html: emailBody,
      });

      console.debug(`Email pushed to queue for ${toEmail}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send email to ${toEmail}`, error);
    }
  }
}

export const TrialEmailer = new TrialEmailerClass();
