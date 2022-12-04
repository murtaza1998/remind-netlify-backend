import { sign, verify } from "jsonwebtoken";
import { env } from "process";

type JWT_PAYLOAD = {
  email: string;
  role: string;
};

export const createJwt = (email: string, role: string) => {
  if (!env.LMS_JWT_SECRET) {
    throw new Error("JWT_SECRET env not set");
  }
  const token = sign({ email, role } as JWT_PAYLOAD, env.LMS_JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

export const verifyJwt = async (token: string): Promise<JWT_PAYLOAD | null> => {
  if (!env.LMS_JWT_SECRET) {
    throw new Error("JWT_SECRET env not set");
  }

  try {
    const decoded = verify(token, env.LMS_JWT_SECRET) as string;
    return JSON.parse(decoded) as JWT_PAYLOAD;
  } catch (err) {
    return null;
  }
};
