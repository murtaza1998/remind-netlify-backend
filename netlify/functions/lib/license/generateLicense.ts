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

export const getPrivateKeyAndPassphrase = async (
  db: Db
): Promise<{
  privateKey: string;
  passphrase: string;
}> => {
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

  return {
    privateKey: PRIVATE_KEY,
    passphrase: PRIVATE_KEY_PASSPHRASE,
  };
};

export const encodeDataWithPrivateKey = async (
  data: string,
  { privateKey, passphrase }: { privateKey: string; passphrase: string }
): Promise<string> =>
  privateEncrypt(
    {
      key: Buffer.from(privateKey, "base64"),
      passphrase,
    },
    Buffer.from(data, "utf8")
  ).toString("base64");

export const generateLicense = async ({
  workspaceAddress,
  expiry,
  db,
}: Props) => {
  console.info(
    `Generating license for workspace address: ${workspaceAddress} with expiry: ${expiry}`
  );

  const privateData = await getPrivateKeyAndPassphrase(db);

  const licenseData: IReminderAppLicense = {
    schemaVersion: 2,
    url: workspaceAddress,
    expiry,
  };

  const license = await encodeDataWithPrivateKey(
    JSON.stringify(licenseData),
    privateData
  );

  console.debug(
    `Generated license: ${license} for workspace: ${workspaceAddress}`
  );

  return license;
};

export const generateLicenseWithPrivateKeyData = async (
  workspaceAddress: string,
  expiry: Date,
  { privateKey, passphrase }: { privateKey: string; passphrase: string }
): Promise<string> => {
  console.info(
    `Generating license for workspace address: ${workspaceAddress} with expiry: ${expiry}`
  );

  const licenseData: IReminderAppLicense = {
    schemaVersion: 2,
    url: workspaceAddress,
    expiry,
  };

  const license = await encodeDataWithPrivateKey(JSON.stringify(licenseData), {
    privateKey,
    passphrase,
  });

  console.debug(
    `Generated license: ${license} for workspace: ${workspaceAddress}`
  );

  return license;
};
