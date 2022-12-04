import { env } from "process";
import { privateEncrypt } from "crypto";
import { IReminderAppLicense } from "../../../definitions/license";
import { Db } from "mongodb";
import { ILargeSecrets } from "../../../definitions/database/largeSecrets";
import { COLLECTION_LARGE_SECRETS } from "../database";

type Props = {
  db: Db;
  workspaceAddress: string;
  expiry: Date;
};

export const generateLicense = async ({
  workspaceAddress,
  expiry,
  db,
}: Props) => {
  console.info(
    `Generating license for workspace address: ${workspaceAddress} with expiry: ${expiry}`
  );

  if (!env.PRIVATE_KEY_PASSPHRASE) {
    throw new Error("private key passphrase not set");
  }

  const dbRecord = await db
    .collection<ILargeSecrets>(COLLECTION_LARGE_SECRETS)
    .findOne({
      key: "license_private_key",
    });
  if (!dbRecord) {
    throw new Error("Unable to find license private key");
  }

  const { PRIVATE_KEY_PASSPHRASE } = env;

  const PRIVATE_KEY = dbRecord.value;

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
