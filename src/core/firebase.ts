import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsFile = process.env.FIREBASE_CREDENTIALS_FILE;
const credentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;

if (!admin.apps.length) {
  let credential;

  if (credentialsBase64) {
    const decoded = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    credential = admin.credential.cert(JSON.parse(decoded));
  } else if (credentialsFile) {
    credential = admin.credential.cert(credentialsFile);
  } else {
    // Fallback to default credentials or environment variable
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId,
  });
}

export const db = admin.firestore();
