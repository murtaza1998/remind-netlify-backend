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
