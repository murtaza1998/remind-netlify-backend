import { userPaymentData } from "../../../definitions/database/paddle/userPaymentData";
import { newSubAddedTemplateProps } from "../../../definitions/email";
import { generateLicense } from "../license/generateLicense";
import { PaddlePlan } from "../paddle/plan";
import { getZohoContactMailer } from "./emailProvider";
import {
  newSubAddedEmailTemplateBody,
  newSubAddedEmailTemplateSubject,
} from "./templates/newSubAddedEmailTemplate";
import { substituteEmailTemplateParams } from "./utils";

class PaymentEmailerClass {
  async sendNewSubscriptionCreatedEmail(
    to: string,
    userPaymentData: userPaymentData
  ): Promise<void> {
    console.info(`Sending new subscription created email to ${to}`);

    const {
      subscription: { planId, endDate },
      passthrough: { workspaceAddress },
    } = userPaymentData;

    const planDuration = PaddlePlan.getPlanName(planId);

    const license = generateLicense({
      workspaceAddress,
      expiry: new Date(endDate),
    });

    const emailBody = substituteEmailTemplateParams<newSubAddedTemplateProps>(
      newSubAddedEmailTemplateBody,
      {
        license,
        planDuration,
        licenseExpiration: endDate,
        workspaceAddress,
      }
    );

    console.debug(`Sending email to ${to} at ${new Date()}`);

    try {
      await getZohoContactMailer().sendEmail(
        to,
        newSubAddedEmailTemplateSubject,
        emailBody
      );
      console.info(
        `Sent new subscription created email to ${to} at ${new Date()}`
      );
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send email to ${to}`, error);
    }
  }
}

export const PaymentEmailer = new PaymentEmailerClass();