import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminApp() {
  const config = getAdminConfig();
  if (!config) return null;

  if (getApps().length) return getApp();

  return initializeApp({
    credential: cert(config),
    projectId: config.projectId
  });
}

export function getFirestoreAdmin() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export async function verifyRequestUser(request: Request) {
  const auth = getFirebaseAdminAuth();
  const header = request.headers.get("authorization");
  if (!auth || !header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length);
  try {
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}
