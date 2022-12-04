import { Handler } from "@netlify/functions";
import { getZohoContactMailer } from "./lib/email/emailProvider";

// since I'm seeing a lot of errors in dev console regarding emailer taking
// time to get initialized, I'm going to try to initialize it here
// Possibly need to call this routinely to keep it alive?
const handler: Handler = async (event, context) => {
  const startTimer = Date.now();
  console.debug(`Starting to send email at ${startTimer}`);

  await getZohoContactMailer().sendEmail(
    "murtaza98.test@gmail.com",
    "Test Email",
    "This is a test email"
  );

  console.debug(
    `Finished sending email at ${Date.now()}. Took ${
      Date.now() - startTimer
    } ms`
  );

  return {
    statusCode: 200,
    body: "Sent email",
  };
};

export { handler };
