import { Context } from "@netlify/functions/dist/function/context";

export const extractNetlifySiteFromContext = async (
  context: Context
): Promise<string> => {
  if (!context?.clientContext?.custom?.netlify) {
    console.warn(
      "Unable to extract netlify site from context. Using default site i.e. http://localhost:8888"
    );
    return "http://localhost:8888";
  }

  try {
    const data = context.clientContext.custom.netlify;
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    console.debug(
      `Decoded netlify site from context: ${JSON.stringify(decoded)}`
    );
    return decoded;
  } catch (e) {
    console.error(
      "Error parsing netlify site from context. Using default site i.e. http://localhost:8888. Error:",
      e
    );
    return "http://localhost:8888";
  }
};
