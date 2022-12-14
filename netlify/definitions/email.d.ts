export type newSubAddedTemplateProps = {
  planDuration: "Monthly" | "Yearly";
  license: string;
  workspaceAddress: string;
  licenseExpiration: string;
};

export type subRenewalSuccessTemplateProps = {
  renewalDate: string;
  planDuration: "Monthly" | "Yearly";
  license: string;
  workspaceAddress: string;
  licenseExpiration: string;
  renewalReceipt: string;
};

export type activeSubsUpdatedTemplateProps = {
  updatedDate: string;
  latestPlanDuration: "Monthly" | "Yearly";
  license: string;
  workspaceAddress: string;
  licenseExpiration: string;
};

export type subsCancelEmailTemplateProps = {
  planDuration: "Monthly" | "Yearly";
  endDate: string;
};

export type paymentFailedWithinGracePeriodTemplateProps = {
  nextBillDate: string;
  planDuration: "Monthly" | "Yearly";
  license: string;
  workspaceAddress: string;
  licenseExpiration: string;
};

export type paymentFailedWithSubsPausedTemplateProps = {
  planDuration: "Monthly" | "Yearly";
};

export type remindAppNewTrialTemplateProps = {
  contactName: string;
  workspaceAddress: string;
  trialExpiry: string;
  license: string;
  purchaseLink: string;
};

export type contactMessageTemplateProps = {
  contactName: string;
  contactEmail: string;
  message: string;
};
