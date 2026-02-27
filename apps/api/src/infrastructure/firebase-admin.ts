import { cert, getApps, initializeApp, type App, applicationDefault } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { loadEnv } from "../config/env.js";

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

const buildCredential = () => {
  const env = loadEnv();

  if (env.firebaseServiceAccountJson) {
    const parsed = JSON.parse(env.firebaseServiceAccountJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
      });
    }
  }

  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n"),
    });
  }

  return applicationDefault();
};

export const getFirebaseApp = (): App => {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const env = loadEnv();
  cachedApp = initializeApp({
    credential: buildCredential(),
    projectId: env.firebaseProjectId || undefined,
  });
  return cachedApp;
};

export const getFirebaseDb = (): Firestore => {
  if (cachedDb) {
    return cachedDb;
  }

  const db = getFirestore(getFirebaseApp());
  db.settings({ ignoreUndefinedProperties: true });
  cachedDb = db;
  return cachedDb;
};

export const getFirebaseAuth = (): Auth => {
  if (cachedAuth) {
    return cachedAuth;
  }

  cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
};
