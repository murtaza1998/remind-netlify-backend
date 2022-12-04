import { userPaymentData } from "../../../definitions/database/paddle/userPaymentData";
import {
  activeSubsUpdatedTemplateProps,
  newSubAddedTemplateProps,
  paymentFailedWithinGracePeriodTemplateProps,
  paymentFailedWithSubsPausedTemplateProps,
  subRenewalSuccessTemplateProps,
  subsCancelEmailTemplateProps,
} from "../../../definitions/email";
import { generateLicense } from "../license/generateLicense";
import { PaddlePlan } from "../paddle/plan";
import { getZohoContactMailer } from "./emailProvider";
import {
  activeSubsUpdatedEmailTemplateBody,
  activeSubsUpdatedEmailTemplateSubject,
} from "./templates/activeSubsUpdatedEmailTemplate";
import {
  newSubAddedEmailTemplateBody,
  newSubAddedEmailTemplateSubject,
} from "./templates/newSubAddedEmailTemplate";
import {
  paymentFailedWithinGracePeriodBody,
  paymentFailedWithinGracePeriodSubject,
} from "./templates/paymentFailedWithinGracePeriod";
import {
  paymentFailedWithSubsPausedBody,
  paymentFailedWithSubsPausedSubject,
} from "./templates/paymentFailedWithSubsPaused";
import {
  subRenewalSuccessEmailTemplateBody,
  subRenewalSuccessEmailTemplateSubject,
} from "./templates/subRenewalSuccessEmailTemplate";
import {
  subsCancelEmailTemplateBody,
  subsCancelEmailTemplateSubject,
} from "./templates/subsCancelEmailTemplate";
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
      console.error(`Failed to send subscription created email to ${to}`);
    }
  }

  async sendSubscriptionRenewedEmail({
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
    renewalDate,
    renewalReceipt,
  }: {
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
    renewalDate: string;
    renewalReceipt: string;
  }): Promise<void> {
    console.info(`Sending subscription renewed email to ${to}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const license = generateLicense({
      workspaceAddress,
      expiry: new Date(endDate),
    });

    const emailBody =
      substituteEmailTemplateParams<subRenewalSuccessTemplateProps>(
        subRenewalSuccessEmailTemplateBody,
        {
          license,
          planDuration,
          licenseExpiration: endDate,
          workspaceAddress,
          renewalDate,
          renewalReceipt,
        }
      );

    console.debug(`Sending email to ${to} at ${new Date()}`);

    try {
      await getZohoContactMailer().sendEmail(
        to,
        subRenewalSuccessEmailTemplateSubject,
        emailBody
      );
      console.info(`Sent subscription renewed email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(
        `Failed to send subscription renewed email to ${to}`,
        error
      );
    }
  }

  async activeSubscriptionsUpdatedEmail({
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
    updatedDate,
  }: {
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
    updatedDate: string;
  }): Promise<void> {
    console.info(`Sending subscription updated email to ${to}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const license = generateLicense({
      workspaceAddress,
      expiry: new Date(endDate),
    });

    const emailBody =
      substituteEmailTemplateParams<activeSubsUpdatedTemplateProps>(
        activeSubsUpdatedEmailTemplateBody,
        {
          license,
          licenseExpiration: endDate,
          workspaceAddress,
          latestPlanDuration: planDuration,
          updatedDate,
        }
      );

    console.debug(`Sending email to ${to} at ${new Date()}`);

    try {
      await getZohoContactMailer().sendEmail(
        to,
        activeSubsUpdatedEmailTemplateSubject,
        emailBody
      );
      console.info(`Sent subscription updated email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(
        `Failed to send subscription updated email to ${to}`,
        error
      );
    }
  }

  async sendSubscriptionCancelledEmail({
    to,
    subscription: { planId, endDate },
  }: {
    to: string;
    subscription: { planId: string; endDate: string };
  }): Promise<void> {
    console.info(
      `Sending subscription cancelled email to ${to} at ${new Date()}`
    );

    const planDuration = PaddlePlan.getPlanName(planId);

    const emailBody =
      substituteEmailTemplateParams<subsCancelEmailTemplateProps>(
        subsCancelEmailTemplateBody,
        {
          planDuration,
          endDate,
        }
      );

    try {
      await getZohoContactMailer().sendEmail(
        to,
        subsCancelEmailTemplateSubject,
        emailBody
      );

      console.info(
        `Sent subscription cancelled email to ${to} at ${new Date()}`
      );
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(
        `Failed to send subscription cancelled email to ${to}`,
        error
      );
    }
  }

  async sendPaymentFailedEmailWithRetry({
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
  }: {
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
  }): Promise<void> {
    console.info(`Sending payment failed email to ${to} at ${new Date()}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const license = generateLicense({
      workspaceAddress,
      expiry: new Date(endDate),
    });

    const emailBody =
      substituteEmailTemplateParams<paymentFailedWithinGracePeriodTemplateProps>(
        paymentFailedWithinGracePeriodBody,
        {
          license,
          licenseExpiration: endDate,
          workspaceAddress,
          nextBillDate: endDate,
          planDuration,
        }
      );

    try {
      await getZohoContactMailer().sendEmail(
        to,
        paymentFailedWithinGracePeriodSubject,
        emailBody
      );

      console.info(`Sent payment failed email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send payment failed email to ${to}`, error);
    }
  }

  async sendPaymentFailedEmailAndSubsPaused({
    to,
    subscription: { planId },
  }: {
    to: string;
    subscription: { planId: string };
  }): Promise<void> {
    console.info(`Sending payment failed email to ${to} at ${new Date()}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const emailBody =
      substituteEmailTemplateParams<paymentFailedWithSubsPausedTemplateProps>(
        paymentFailedWithSubsPausedBody,
        {
          planDuration,
        }
      );

    try {
      await getZohoContactMailer().sendEmail(
        to,
        paymentFailedWithSubsPausedSubject,
        emailBody
      );

      console.info(`Sent payment failed email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send payment failed email to ${to}`, error);
    }
  }
}

export const PaymentEmailer = new PaymentEmailerClass();
