const MongoClient = require("mongodb").MongoClient;

// Database configurations
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'usage';
const CONTACT_COLLECTION = "remind-app";

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

const saveUsageData = async (db,  { siteUrl, appVersion, validLicense, usage }) => {
	console.log(`Saving usage data from site ${siteUrl}`);
	await db.collection(CONTACT_COLLECTION).insertMany([{
		siteUrl,
        appVersion,
        validLicense,
        usage,
		createdAt: new Date(),
		createdBy: 'netlify-functions',
	}]);
};

module.exports.handler = async (event, context) => {
		// otherwise the connection will never complete, since
		// we keep the DB connection alive
		context.callbackWaitsForEmptyEventLoop = false;

		const db = await connectToDatabase(MONGODB_URI);

		// enable CORS
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
		}
		if (event.httpMethod === "OPTIONS") {
			return {
				statusCode: 200,
				headers: corsHeaders,
				body: 'Cross site requests allowed!'
			}
		}

		if (event.httpMethod !== "POST") {
			return { statusCode: 400, body: "Method not allowed" };
		}

		const data = JSON.parse(event.body);
		const { siteUrl, appVersion, validLicense, usage } = data;
        if (!siteUrl) {
            throw new Error("Site URL is required");
        }

		await saveUsageData(db, data);

		try {
			await sendEmail(data);
		} catch (err) {
			console.log('Error sending contact message notification email: ' + err);
		}

		console.log(`Successfully saved contact message: ${JSON.stringify(data)}`);

		return {
			statusCode: 200,
			headers: corsHeaders,
		};
};