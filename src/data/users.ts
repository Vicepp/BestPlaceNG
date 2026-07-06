import { queryFirestoreCollection } from "@/lib/firestoreWrite";
import { getFirestoreCollection } from "@/lib/firestoreData";
import type { UserProfile } from "@/context/AuthContext";

/** Look up a user by email (users collection is public-read). Used for
 * landlord-to-landlord property transfers and tenant invites. Tries an exact
 * match first, then a case-insensitive scan (older accounts stored mixed case).
 * Returns null if no account uses that email. */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  const exact = await queryFirestoreCollection<UserProfile>("users", [["email", email.trim()]]);
  if (exact && exact.length > 0) return exact[0];

  const all = await getFirestoreCollection<UserProfile>("users");
  return all?.find((u) => (u.email ?? "").trim().toLowerCase() === target) ?? null;
}
