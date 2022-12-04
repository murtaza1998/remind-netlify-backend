const MongoClient = require("mongodb").MongoClient;
const nodemailer = require("nodemailer");
const { ENV_VARIABLES } = require("./lib/configs/envVariables");

// Database configurations
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "remind-website";
const CONTACT_COLLECTION = "contactUs";

// email configuration
const MAIL_SENDER = ENV_VARIABLES.MAIL_SENDER;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const CONTACT_US_EMAIL_NOTIFICATION =
  ENV_VARIABLES.CONTACT_US_EMAIL_NOTIFICATION;

let cachedDb = null;

const connectToDatabase = async (uri) => {
  // we can cache the access to our database to speed things up a bit
  // (this is the only thing that is safe to cache here)
  if (cachedDb) return cachedDb;

  const client = await MongoClient.connect(uri, {
    useUnifiedTopology: true,
  });

  cachedDb = client.db(DB_NAME);

  return cachedDb;
};

const saveUserContactMessage = async (db, { name, email, message }) => {
  console.log(
    `Saving contact message from ${email} with name ${name} and message ${message}`
  );
  await db.collection(CONTACT_COLLECTION).insertMany([
    {
      email,
      name,
      message,
      createdAt: new Date(),
      createdBy: "netlify-functions",
    },
  ]);
};

const sendEmail = async ({ name, email, message }) => {
  console.log(
    `Sending contact message received email from ${email} to ${CONTACT_US_EMAIL_NOTIFICATION}`
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_SENDER,
      pass: MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: MAIL_SENDER,
    to: CONTACT_US_EMAIL_NOTIFICATION,
    subject: `[Reminder App] New contact message received from ${name}`,
    text: `Hey, Hey, Hey... Guess what, We've made it ;) Folks are actually using something we build!!\n\nWe received a new contact message from ${name} with email ${email} and message\n ${message}`,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(
    `Email for contact message notification sent: ${JSON.stringify(result)}`
  );
};

module.exports.handler = async (event, context) => {
  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await connectToDatabase(MONGODB_URI);

  // enable CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "Cross site requests allowed!",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 400, body: "Method not allowed" };
  }

  const data = JSON.parse(event.body);
  const { name, email, message } = data;
  if (!name || !email || !message) {
    return {
      statusCode: 422,
      body: "Missing required params - name or email or message",
    };
  }

  await saveUserContactMessage(db, data);

  try {
    await sendEmail(data);
  } catch (err) {
    console.log("Error sending contact message notification email: " + err);
  }

  console.log(`Successfully saved contact message: ${JSON.stringify(data)}`);

  return {
    statusCode: 200,
    headers: corsHeaders,
  };
};
