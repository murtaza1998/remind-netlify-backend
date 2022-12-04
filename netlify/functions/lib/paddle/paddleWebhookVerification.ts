import { verifyPaddleWebhook } from "verify-paddle-webhook";
import { env } from "process";
import { Buffer } from "buffer";

export const isPaddleWebhookValid = (
  paddleWebhookData: Record<string, any>
) => {
  if (!env.PADDLE_PUBLIC_KEY) {
    throw new Error("PADDLE_PUBLIC_KEY env not set");
  }

  // base64 decode the public key
  const publicKey = Buffer.from(env.PADDLE_PUBLIC_KEY, "base64").toString();

  return verifyPaddleWebhook(publicKey, paddleWebhookData);
};
