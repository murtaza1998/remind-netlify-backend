import { Handler } from "@netlify/functions";
import { connectToLMPDatabase } from "./lib/database";
import {
  encodeDataWithPrivateKey,
  getPrivateKeyAndPassphrase,
} from "./lib/license/generateLicense";

// since I'm seeing a lot of errors in dev console regarding emailer taking
// time to get initialized, I'm going to try to initialize it here
// Possibly need to call this routinely to keep it alive?
const handler: Handler = async (event, context) => {
  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await connectToLMPDatabase();

  const privateData = await getPrivateKeyAndPassphrase(db);

  const msg = `Some message`;

  const data = await encodeDataWithPrivateKey(msg, privateData);

  // url encode data
  const urlEncodedData = encodeURIComponent(data);

  return {
    statusCode: 200,
    body: JSON.stringify({ data: urlEncodedData }),
  };
};

export { handler };
