"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

function readPublicEnv(value: string | undefined) {
  return value?.trim() || "";
}

function getFirebasePublicConfig(): FirebasePublicConfig | null {
  const apiKey = readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const authDomain = readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const projectId = readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const appId = readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || undefined,
    messagingSenderId: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || undefined,
  };
}

export function isFirebaseClientConfigured() {
  return Boolean(getFirebasePublicConfig());
}

export function getFirebaseClientAuth() {
  const config = getFirebasePublicConfig();
  if (!config) {
    throw new Error(
      "Missing Firebase web config. Set FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, and FIREBASE_APP_ID."
    );
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
