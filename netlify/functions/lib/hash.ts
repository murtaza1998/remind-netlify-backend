import { env } from "process";
import { createHmac, randomBytes } from "crypto";

export const hashOf = (password: string) => {
  if (!env.LMS_PASSWORD_SECRET) {
    throw new Error("PASSWORD_SECRET env not set");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha512", env.LMS_PASSWORD_SECRET)
    .update(password + salt)
    .digest("hex");

  return { salt, hash };
};

export const verifyHash = (password: string, salt: string, hash: string) => {
  if (!env.LMS_PASSWORD_SECRET) {
    throw new Error("PASSWORD_SECRET env not set");
  }

  const newHash = createHmac("sha512", env.LMS_PASSWORD_SECRET)
    .update(password + salt)
    .digest("hex");

  return newHash === hash;
};

export const uid = () => randomBytes(256).toString("hex");
