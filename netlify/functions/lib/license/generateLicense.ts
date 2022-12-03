import { env } from "process";
import { privateEncrypt } from "crypto";
import { IReminderAppLicense } from "../../../definitions/license";

type Props = {
  workspaceAddress: string;
  expiry: Date;
};

export const generateLicense = ({ workspaceAddress, expiry }: Props) => {
  console.info(
    `Generating license for workspace address: ${workspaceAddress} with expiry: ${expiry}`
  );

  if (!env.PRIVATE_KEY || !env.PRIVATE_KEY_PASSPHRASE) {
    throw new Error("Private key or passphrase not set");
  }

  const { PRIVATE_KEY, PRIVATE_KEY_PASSPHRASE } = env;

  const licenseData: IReminderAppLicense = {
    schemaVersion: 2,
    url: workspaceAddress,
    expiry,
  };

  const license = privateEncrypt(
    {
      key: Buffer.from(PRIVATE_KEY, "base64"),
      passphrase: PRIVATE_KEY_PASSPHRASE,
    },
    Buffer.from(JSON.stringify(licenseData), "utf8")
  ).toString("base64");

  console.debug(
    `Generated license: ${license} for workspace: ${workspaceAddress}`
  );

  return license;
};
