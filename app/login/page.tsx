"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup, signOut } from "firebase/auth";
import { Suspense, useEffect, useMemo, useState } from "react";
import HexPanel from "../components/HexPanel";

import LoadingAnimation from "@/components/LoadingAnimation";
import { createGoogleProvider, getFirebaseClientAuth, isFirebaseClientConfigured } from "@/lib/firebase-client";

type SessionResponse = {
  user?: {
    uid: string;
    email: string;
    role: "admin" | "student";
    hubDomain: string;
    displayName: string | null;
  };
  redirectTo?: string;
  error?: string;
};

function readSafePath(path: string | null) {
  if (!path) {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}

function normalizeNextPath(nextPath: string | null, role: "admin" | "student") {
  const safePath = readSafePath(nextPath);
  if (!safePath) {
    return role === "admin" ? "/admin" : "/student/inventory";
  }

  if (role !== "admin" && safePath.startsWith("/admin")) {
    return "/student/inventory";
  }

  return safePath;
}

async function readApiPayload(response: Response): Promise<{
  json: Record<string, unknown> | null;
  text: string;
}> {
  const rawText = await response.text();
  if (!rawText) {
    return { json: null, text: "" };
  }

  try {
    return { json: JSON.parse(rawText) as Record<string, unknown>, text: rawText };
  } catch {
    return { json: null, text: rawText };
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionResponse["user"] | null>(null);

  const nextPath = useMemo(() => readSafePath(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setIsLoadingSession(true);
      setError("");

      try {
        const response = await fetch("/api/auth/session", { method: "GET" });
        const { json } = await readApiPayload(response);
        const payload = (json || {}) as SessionResponse;

        if (!response.ok) {
          if (!cancelled) {
            setSessionUser(null);
          }
          return;
        }

        if (!payload.user) {
          if (!cancelled) {
            setSessionUser(null);
          }
          return;
        }

        if (!cancelled) {
          setSessionUser(payload.user);
          const destination = normalizeNextPath(nextPath, payload.user.role);
          router.replace(destination);
        }
      } catch {
        if (!cancelled) {
          setError("Could not check your existing session.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  const handleGoogleLogin = async () => {
    setError("");
    setStatus("");
    setIsLoggingIn(true);

    try {
      const auth = getFirebaseClientAuth();
      const credential = await signInWithPopup(auth, createGoogleProvider());
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const { json, text } = await readApiPayload(response);
      const payload = (json || {}) as SessionResponse;

      if (!response.ok || !payload.user) {
        const message =
          payload.error ||
          (text.trim().startsWith("<!DOCTYPE")
            ? "Received HTML instead of JSON while creating session."
            : text.slice(0, 160));
        throw new Error(message || "Login failed.");
      }

      setSessionUser(payload.user);
      setStatus(`Signed in as ${payload.user.email}`);

      const destination = normalizeNextPath(nextPath, payload.user.role);
      router.replace(destination);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not complete sign-in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    setStatus("");
    setIsLoggingOut(true);

    try {
      const auth = getFirebaseClientAuth();
      await signOut(auth);
    } catch {
      // Continue clearing server session even if client SDK sign-out fails.
    }

    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      });
      setSessionUser(null);
      setStatus("Signed out.");
    } catch {
      setError("Could not clear session.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const firebaseConfigured = isFirebaseClientConfigured();

  const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <HexPanel contentStyle={{ padding: "28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Hub Access</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 800, margin: "0 0 8px" }}>Sign in with your school account</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Admins must be manually assigned by Firebase UID. Students can sign in when their school email domain is linked to an admin-managed Hub.
            </p>
          </div>

          <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "12px 16px" }}>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 13, margin: "0 0 4px" }}>Admin routes are protected by role checks on both page access and API actions.</p>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 13, margin: 0 }}>Student access is scoped to your connected university domain.</p>
          </HexPanel>

          {!firebaseConfigured && (
            <p style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#fca5a5", fontSize: 13, margin: 0 }}>
              Firebase web config is missing. Add FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, and FIREBASE_APP_ID.
            </p>
          )}
          {error && (
            <p style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#fca5a5", fontSize: 13, margin: 0 }}>{error}</p>
          )}
          {status && (
            <p style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(104,148,102,0.4)", background: "rgba(104,148,102,0.08)", color: "#86efac", fontSize: 13, margin: 0 }}>{status}</p>
          )}

          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/" style={navLink}>Home</Link>
            <Link href="/student/inventory" style={navLink}>Student Inventory</Link>
            <Link href="/admin" style={navLink}>Admin Dashboard</Link>
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoadingSession && (
              <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: 8 }}>
                <LoadingAnimation message="Checking your session..." className="py-2" iconClassName="h-20 w-20" messageClassName="mt-2 text-sm font-medium text-slate-300" />
              </HexPanel>
            )}
            <button
              type="button"
              disabled={!firebaseConfigured || isLoggingIn || isLoadingSession}
              onClick={() => void handleGoogleLogin()}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "none", background: isLoggingIn || isLoadingSession ? "#334155" : "#e2e8f0", color: "#0f1825", fontSize: 15, fontWeight: 700, cursor: !firebaseConfigured || isLoggingIn || isLoadingSession ? "not-allowed" : "pointer", opacity: !firebaseConfigured || isLoggingIn || isLoadingSession ? 0.6 : 1 }}
            >
              {isLoadingSession ? "Checking session…" : isLoggingIn ? "Signing in…" : "Continue with Google"}
            </button>
            <button
              type="button"
              disabled={!firebaseConfigured || isLoggingOut || !sessionUser}
              onClick={() => void handleLogout()}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-secondary)", fontSize: 15, fontWeight: 700, cursor: !firebaseConfigured || isLoggingOut || !sessionUser ? "not-allowed" : "pointer", opacity: !firebaseConfigured || isLoggingOut || !sessionUser ? 0.5 : 1 }}
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </HexPanel>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LoadingAnimation message="Loading login…" className="py-2" iconClassName="h-20 w-20" messageClassName="mt-2 text-sm font-medium" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
