import { Db } from "mongodb";
import { userPaymentData } from "../../../definitions/database/paddle/userPaymentData";
import {
  activeSubsUpdatedTemplateProps,
  newSubAddedTemplateProps,
  paymentFailedWithinGracePeriodTemplateProps,
  paymentFailedWithSubsPausedTemplateProps,
  subRenewalSuccessTemplateProps,
  subsCancelEmailTemplateProps,
} from "../../../definitions/email";
import { ENV_VARIABLES } from "../configs/envVariables";
import { generateLicense } from "../license/generateLicense";
import { PaddlePlan } from "../paddle/plan";
import { addDaysToDate } from "../utils";
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
import { ZohoEmailQueue } from "./ZohoEmailQueue";

class PaymentEmailerClass {
  async sendNewSubscriptionCreatedEmail(
    db: Db,
    siteUrl: string,
    to: string,
    userPaymentData: userPaymentData
  ): Promise<void> {
    console.info(`Sending new subscription created email to ${to}`);

    const {
      subscription: { planId, endDate },
      passthrough: { workspaceAddress },
    } = userPaymentData;

    const planDuration = PaddlePlan.getPlanName(planId);

    // add 7 days buffer so user can renew before license expires
    const licenseEndDatePlus7Days = addDaysToDate(new Date(endDate), 7);

    const license = await generateLicense({
      db,
      workspaceAddress,
      expiry: licenseEndDatePlus7Days,
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: newSubAddedEmailTemplateSubject,
        html: emailBody,
      });
      console.info(
        `Sent new subscription created email to ${to} at ${new Date()}`
      );
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send subscription created email to ${to}`);
    }
  }

  async sendSubscriptionRenewedEmail({
    db,
    siteUrl,
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
    renewalDate,
    renewalReceipt,
  }: {
    db: Db;
    siteUrl: string;
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
    renewalDate: string;
    renewalReceipt: string;
  }): Promise<void> {
    console.info(`Sending subscription renewed email to ${to}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const licenseEndDatePlus7Days = addDaysToDate(new Date(endDate), 7);

    const license = await generateLicense({
      db,
      workspaceAddress,
      expiry: licenseEndDatePlus7Days,
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: subRenewalSuccessEmailTemplateSubject,
        html: emailBody,
      });
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
    db,
    siteUrl,
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
    updatedDate,
  }: {
    db: Db;
    siteUrl: string;
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
    updatedDate: string;
  }): Promise<void> {
    console.info(`Sending subscription updated email to ${to}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const licenseEndDatePlus7Days = addDaysToDate(new Date(endDate), 7);

    const license = await generateLicense({
      db,
      workspaceAddress,
      expiry: licenseEndDatePlus7Days,
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: activeSubsUpdatedEmailTemplateSubject,
        html: emailBody,
      });
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
    db,
    siteUrl,
    to,
    subscription: { planId, endDate },
  }: {
    db: Db;
    siteUrl: string;
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: subsCancelEmailTemplateSubject,
        html: emailBody,
      });

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
    db,
    siteUrl,
    to,
    subscription: { planId, endDate },
    passthrough: { workspaceAddress },
  }: {
    db: Db;
    siteUrl: string;
    to: string;
    subscription: { planId: string; endDate: string };
    passthrough: { workspaceAddress: string };
  }): Promise<void> {
    console.info(`Sending payment failed email to ${to} at ${new Date()}`);

    const planDuration = PaddlePlan.getPlanName(planId);

    const license = await generateLicense({
      db,
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: paymentFailedWithinGracePeriodSubject,
        html: emailBody,
      });

      console.info(`Sent payment failed email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send payment failed email to ${to}`, error);
    }
  }

  async sendPaymentFailedEmailAndSubsPaused({
    db,
    siteUrl,
    to,
    subscription: { planId },
  }: {
    db: Db;
    siteUrl: string;
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
      await ZohoEmailQueue.sendEmail(db, siteUrl, {
        from: ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL,
        to,
        subject: paymentFailedWithSubsPausedSubject,
        html: emailBody,
      });

      console.info(`Sent payment failed email to ${to} at ${new Date()}`);
    } catch (error) {
      // Let's not fail the whole request if the email fails
      console.error(`Failed to send payment failed email to ${to}`, error);
    }
  }
}

export const PaymentEmailer = new PaymentEmailerClass();
