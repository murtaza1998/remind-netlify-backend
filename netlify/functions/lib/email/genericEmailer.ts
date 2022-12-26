import { Db } from "mongodb";
import {
  contactMessageTemplateProps,
  remindAppNewTrialTemplateProps,
} from "../../../definitions/email";
import { ENV_VARIABLES } from "../configs/envVariables";
import {
  contactMessageEmailTemplateBody,
  contactMessageEmailTemplateSubject,
} from "./templates/contactMessageEmailTemplate";
import {
  remindAppNewsletterSubscriptionTemplateBody,
  remindAppNewsletterSubscriptionTemplateSubject,
} from "./templates/newsletterSubscriptionTemplate";
import {
  remindAppNewTrialEmailTemplateBody,
  remindAppNewTrialEmailTemplateSubject,
} from "./templates/remindAppNewTrialEmailTemplate";
import { substituteEmailTemplateParams } from "./utils";
import { ZohoEmailQueue } from "./ZohoEmailQueue";

class GenericEmailerClass {
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

  async sendNewContactMessageEmail({
    db,
    contactEmail,
    message,
    contactName,
    siteUrl,
  }: {
    db: Db;
    contactEmail: string;
    contactName: string;
    message: string;
    siteUrl: string;
  }): Promise<void> {
    console.info(`Sending new contact message email from ${contactEmail}`);

    const emailBody =
      substituteEmailTemplateParams<contactMessageTemplateProps>(
        contactMessageEmailTemplateBody,
        {
          contactName,
          contactEmail,
          message,
        }
      );

    console.debug(`Pushing email to queue for ${contactEmail}`);

    try {
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        subject: contactMessageEmailTemplateSubject,
        html: emailBody,
      });

      console.debug(
        `Email pushed to queue for ${ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL}`
      );
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(
        `Failed to send email contact message from ${contactEmail}`,
        error
      );
    }
  }

  async sendNewsletterSubscriptionCreatedEmail({
    db,
    contactEmail,
    siteUrl,
  }: {
    db: Db;
    contactEmail: string;
    siteUrl: string;
  }): Promise<void> {
    console.info(
      `Sending new newsletter subscription email from ${contactEmail}`
    );

    const emailBody = remindAppNewsletterSubscriptionTemplateBody;

    console.debug(`Pushing email to queue for ${contactEmail}`);

    try {
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to: contactEmail,
        subject: remindAppNewsletterSubscriptionTemplateSubject,
        html: emailBody,
      });

      console.debug(`Email pushed to queue for ${contactEmail}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(
        `Failed to send email contact message from ${contactEmail}`,
        error
      );
    }
  }
}

export const GenericEmailer = new GenericEmailerClass();
