"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { setFirestoreDoc } from "@/lib/firestoreWrite";
import { getFirestoreDoc } from "@/lib/firestoreData";
import { claimPendingInvitesForEmail } from "@/data/tenancies";

export type UserRole = "tenant" | "landlord" | "business";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  // Extended profile fields
  businessName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  lastOnline?: string;
  // Tour booking preferences (landlords)
  bookingMode?: "internal" | "external";
  bookingLink?: string;
  /** Availability for the built-in tour calendar. days: 0=Sun..6=Sat. Hours 24h. */
  tourAvailability?: { days: number[]; startHour: number; endHour: number };
}

export type DashboardView = "tenant" | "landlord";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authEnabled: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ ok: true } | { ok: false; error: string }>;
  logIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

const VIEW_STORAGE_KEY = "bestplaceng:activeView";

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyAuthError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authEnabled = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(authEnabled);
  const [activeView, setActiveViewState] = useState<DashboardView>("landlord");
  const [viewInitialized, setViewInitialized] = useState(false);

  useEffect(() => {
    if (!authEnabled) return;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const doc = await getFirestoreDoc<UserProfile>("users", firebaseUser.uid);
        setProfile(doc);
        // Update lastOnline silently — don't await, best-effort
        setFirestoreDoc("users", firebaseUser.uid, { lastOnline: new Date().toISOString() }).catch(() => {});
        if (firebaseUser.email) {
          claimPendingInvitesForEmail(firebaseUser.uid, firebaseUser.email).catch((e) =>
            console.error("[auth] claimPendingInvitesForEmail failed:", e)
          );
        }
        if (!viewInitialized) {
          const stored = typeof window !== "undefined" ? window.localStorage.getItem(VIEW_STORAGE_KEY) : null;
          setActiveViewState(stored === "tenant" || stored === "landlord" ? stored : doc?.role === "tenant" ? "tenant" : "landlord");
          setViewInitialized(true);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEnabled]);

  function setActiveView(view: DashboardView) {
    setActiveViewState(view);
    if (typeof window !== "undefined") window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }

  async function signUp(email: string, password: string, displayName: string, role: UserRole) {
    if (!authEnabled) return { ok: false as const, error: "Accounts aren't available right now." };
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(cred.user, { displayName });
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        displayName,
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      await setFirestoreDoc("users", cred.user.uid, { ...newProfile });
      setProfile(newProfile);
      return { ok: true as const };
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      return { ok: false as const, error: friendlyAuthError(code) };
    }
  }

  async function logIn(email: string, password: string) {
    if (!authEnabled) return { ok: false as const, error: "Accounts aren't available right now." };
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      return { ok: true as const };
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      return { ok: false as const, error: friendlyAuthError(code) };
    }
  }

  async function logOut() {
    if (!authEnabled) return;
    await signOut(getFirebaseAuth());
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, authEnabled, signUp, logIn, logOut, activeView, setActiveView }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
