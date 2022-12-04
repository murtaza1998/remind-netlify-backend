const MongoClient = require("mongodb").MongoClient;
const nodemailer = require("nodemailer");
import { connectToLMPDatabase } from "../database";
import { ENV_VARIABLES } from "./lib/configs/envVariables";
import { generateLicense } from "./lib/license/generateLicense";

// Database configurations
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "remind-website";
const LICENSE_COLLECTION = "license";

// email configuration
const MAIL_SENDER = ENV_VARIABLES.MAIL_SENDER;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

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

const saveUserData = async (db, { email, workspaceAddress, license }) => {
  console.log(
    `Saving license for email: ${email} and workspace address: ${workspaceAddress}`
  );
  await db.collection(LICENSE_COLLECTION).insertMany([
    {
      email,
      workspaceAddress,
      license,
      createdAt: new Date(),
      createdBy: "netlify-functions",
    },
  ]);
};

const sendEmail = async (email, workspaceAddress, license, licenseExpiry) => {
  console.log(`Sending email to ${email}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_SENDER,
      pass: MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: MAIL_SENDER,
    to: email,
    subject: `Here's your Reminder App License`,
    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
		<div style="margin:50px auto;width:70%;padding:20px 0">
		  <div style="border-bottom:1px solid #eee">
			<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Reminder App for Rocket.Chat</a>
		  </div>
		  <p style="font-size:1.1em">Hi,</p>
		  <p>Thank you for choosing Reminder App. Here's your Premium License which you can setup following these steps. This license is valid until ${licenseExpiry.toDateString()}.</p>
		  <h3>Premium License</h3>
		<table cellpadding="0" cellspacing="0" style="background: pink;">
		  	<tr>
				<td style="background: pink; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; padding: 10px 15px;">
					<pre style="-moz-tab-size: 2; -ms-hyphens: none; -o-tab-size: 2; -webkit-hyphens: none; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; hyphens: none; line-height: 1.5; overflow: auto; tab-size: 2; text-align: left; white-space: pre; word-break: break-all; word-spacing: normal; word-wrap: normal;">${license}</pre>
				</td>
			</tr>
		</table>
		  <h3>License Setup Guide</h3>
		  <ol type="1">
			<li>Login to your Rocket.Chat server - <a href="${workspaceAddress}">${workspaceAddress}</a></li>
			<li>Goto Apps Setting (<i>Administration</i> -> <i>Apps</i> -> Click on <i>Add Reminder</i>)</li>
			<li>Once you're on the app setting page, there locate the <i>Premium License</i> Setting and there add the above mentioned license key. Then just click on Save Settings and that's it. Your License has now been activated</li>
			<li>(Optional) To verify if the license is set, just try out any Premium features like creating more than 5 reminders or sending reminders to channels or users</li>
		  </ol>
			<h4> Facing any problems?</h4>
			Feel free to contact us anytime at this email - remindersinchat@gmail.com - and we'd be happy to help you
		<p style="font-size:0.9em;">Regards,<br />Reminder App Team</p>
		  <hr style="border:none;border-top:1px solid #eee" />
		</div>
	  </div>`,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`Email sent: ${JSON.stringify(result)}`);
};

module.exports.handler = async (event, context) => {
  // otherwise the connection will never complete, since
  // we keep the DB connection alive
  context.callbackWaitsForEmptyEventLoop = false;

  const db = await connectToDatabase(MONGODB_URI);
  const lmpDb = await connectToLMPDatabase();

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
  if (!data.email || !data.workspaceAddress) {
    return { statusCode: 422, body: "Missing email or workspace address" };
  }

  const expiry = new Date("12-31-2022");
  const license = await generateLicense({
    db: lmpDb,
    workspaceAddress: data.workspaceAddress,
    expiry,
  });

  await sendEmail(data.email, data.workspaceAddress, license, expiry);

  await saveUserData(db, data);

  console.log(
    `Successfully generated license & email it to: ${JSON.stringify(data)}`
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
  };
};
