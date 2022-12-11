import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

// name of database
export const DB_LMP = process.env.DB_LMP;

// name of collections
export const COLLECTION_LARGE_SECRETS = "largeSecrets";
export const COLLECTION_LMP_USERS = "users";
export const COLLECTION_LMP_USER_PAYMENT_DATA = "userPaymentData";
export const COLLECTION_LMP_SUBSCRIPTION_PAYMENT_HISTORY =
  "subscriptionPaymentHistory";
export const COLLECTION_LMP_EMAIL_QUEUE = "emailQueue";
export const COLLECTION_LMP_REMINDER_APP_TRIAL = "reminderAppTrial";
export const COLLECTION_LMP_CONTACT_MESSAGES = "contactMessages";
export const COLLECTION_LMP_LICENSE_SETUP = "licenseSetup";

let cachedDb: Db | null = null;

export const connectToDatabase = async (dbName: string): Promise<Db> => {
  // we can cache the access to our database to speed things up a bit
  // (this is the only thing that is safe to cache here)
  if (cachedDb) return cachedDb;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  const client = (await MongoClient.connect(MONGODB_URI, {
    useUnifiedTopology: true,
  } as any)) as unknown as MongoClient;

  cachedDb = client.db(dbName);

  return cachedDb;
};

export const connectToLMPDatabase = async (): Promise<Db> => {
  if (!DB_LMP) {
    throw new Error("DB_LMP is not set");
  }
  return connectToDatabase(DB_LMP);
};
