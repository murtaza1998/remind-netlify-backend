import { AlertName } from "../paddle";

export type ILicenseSetupDbRecord = {
  _id: string;
  subscriptionId: string;
  event: AlertName | "trial";
  createdAt: Date;
  status: "pending" | "success" | "failed";
  failedReason?: string;
};
