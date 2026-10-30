/**
 * Minimal React Native flow: an anonymous user gets a pseudonym on first
 * launch, keeps it across restarts, and keeps it after signing in with email.
 *
 * Identifiers (kept separate on purpose):
 *   installationId - random UUID for this install; a technical identifier
 *   userId         - server-issued UUID for the account; a technical identifier
 *   pseudonym      - display label only ("Pier Pressure"); never used as a key
 *
 * The pseudonym is generated ONCE, reserved on the server, and stored. It is
 * never re-derived from a seed, so dictionary updates can't rename anyone.
 *
 * Illustrative example: the API endpoints are placeholders for your backend.
 * Dependencies: unique-boat-name-generator, @react-native-async-storage/async-storage,
 * expo-crypto (or any UUID source).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { claimName } from 'unique-boat-name-generator';

const API = 'https://api.example.com';

export interface Profile {
  userId: string; // server UUID
  pseudonym: string; // display label, e.g. "Pier Pressure"
  username: string; // compact unique handle, e.g. "pierpressure"
  email: string | null; // null while anonymous
}

async function getInstallationId(): Promise<string> {
  let id = await AsyncStorage.getItem('installationId');
  if (!id) {
    id = Crypto.randomUUID();
    await AsyncStorage.setItem('installationId', id);
  }
  return id;
}

/** First launch: create an anonymous profile with a freshly claimed pseudonym. */
async function createAnonymousProfile(installationId: string): Promise<Profile> {
  let profile = null as Profile | null;
  await claimName(async (name) => {
    // Server does: INSERT INTO profiles (id, installation_id, pseudonym, username, ...)
    // with UNIQUE(username). 201 = reserved, 409 = taken -> try the next name.
    // Make it idempotent per installationId (UNIQUE(installation_id); return the
    // existing profile with 200) so a crash before caching can't create a second one.
    const res = await fetch(`${API}/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installationId,
        pseudonym: name.display,
        username: name.username,
        dictionaryVersion: name.dictionaryVersion, // optional, for support/debugging
      }),
    });
    if (res.status === 409) return false;
    if (!res.ok) throw new Error(`Profile creation failed: ${res.status}`);
    profile = (await res.json()) as Profile;
    return true;
  });
  return profile!;
}

export function usePseudonym() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem('profile');
      if (cached) return setProfile(JSON.parse(cached) as Profile);
      const created = await createAnonymousProfile(await getInstallationId());
      await AsyncStorage.setItem('profile', JSON.stringify(created));
      setProfile(created);
    })().catch(console.warn);
  }, []);

  /**
   * Later: the user verifies an email. The server attaches the email to the
   * EXISTING profile row (same userId), so the pseudonym stays the same.
   */
  async function linkEmail(email: string, verificationCode: string) {
    if (!profile) return;
    const res = await fetch(`${API}/profiles/${profile.userId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, verificationCode }),
    });
    if (!res.ok) throw new Error(`Linking failed: ${res.status}`);
    const updated = { ...profile, email };
    await AsyncStorage.setItem('profile', JSON.stringify(updated));
    setProfile(updated);
  }

  return { profile, linkEmail };
}
