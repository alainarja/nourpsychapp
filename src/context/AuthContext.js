import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { db, useCollection } from '../db/db';
import { seedIfNeeded } from '../db/seed';
import { hashPassword } from '../utils/hash';

const AuthContext = createContext(null);

// UI-only stand-in for codes that the backend will email/SMS (verification, reset, 2FA).
export const DEMO_CODE = '123456';

export const HOME_BY_ROLE = { client: '/client', pro: '/pro', org: '/org', admin: '/admin' };

// Where a signed-in user must go before reaching their home (null = nothing pending).
export function onboardingRoute(user) {
  if (!user) return '/welcome';
  if (!user.emailVerified) return '/verify-email';
  if (!user.consentedAt) return '/consent';
  return null;
}

export const homeFor = (user) => onboardingRoute(user) ?? HOME_BY_ROLE[user.role] ?? '/welcome';

// Collections holding per-user data, removed on account deletion.
const USER_DATA = {
  appointments: (r, id) => r.clientId === id || r.proId === id,
  moods: (r, id) => r.userId === id,
  goals: (r, id) => r.userId === id,
  chats: (r, id) => r.userId === id,
  assessments: (r, id) => r.userId === id,
  favorites: (r, id) => r.userId === id,
  notifications: (r, id) => r.userId === id,
  messages: (r, id) => r.fromId === id || r.toId === id,
  paymentMethods: (r, id) => r.userId === id,
  notes: (r, id) => r.proId === id || r.clientId === id,
  medications: (r, id) => r.clientId === id || r.proId === id,
  reviews: (r, id) => r.clientId === id,
  medLogs: (r, id) => r.userId === id,
  medReminders: (r, id) => r.userId === id,
  prescriptions: (r, id) => r.clientId === id || r.proId === id,
  clinicalProfiles: (r, id) => r.clientId === id || r.proId === id,
  payouts: (r, id) => r.proId === id,
  orgMembers: (r, id) => r.userId === id || r.orgId === id,
};

const pwError = (pw) => (pw.length < 6 ? 'Password must be at least 6 characters.' : null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [pending2FA, setPending2FA] = useState(null); // user id awaiting a 2FA code
  const { data: users, loading: usersLoading } = useCollection('users');

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      setUserId(await db.getMeta('session'));
      setReady(true);
    })();
  }, []);

  // Derived from the live collection so profile edits show up everywhere immediately.
  const user = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  const startSession = useCallback(async (id) => {
    await db.setMeta('session', id);
    setUserId(id);
  }, []);

  const signUp = useCallback(async ({ name, email, password, role, ...profile }) => {
    const normalized = email.trim().toLowerCase();
    const existing = await db.where('users', (u) => u.email?.toLowerCase() === normalized);
    if (existing.length) throw new Error('An account with this email already exists.');
    const base = { name: name.trim(), email: normalized, password: hashPassword(password), role, emailVerified: false, consentedAt: null };
    const proDefaults = role === 'pro'
      ? {
          rating: null, reviews: 0, verified: false, verificationStatus: 'not_submitted', price: 60, sessionLength: 45, about: '',
          specialties: [], languages: ['English'], sessionTypes: ['online'], cancellationHours: 24,
          availability: { 0: [], 1: ['10:00', '11:00', '14:00', '15:00'], 2: ['10:00', '11:00', '14:00', '15:00'], 3: ['10:00', '11:00', '14:00', '15:00'], 4: ['10:00', '11:00', '14:00', '15:00'], 5: [], 6: [] },
        }
      : {};
    const created = await db.insert('users', { ...proDefaults, ...base, ...profile });
    await startSession(created.id);
    return created;
  }, [startSession]);

  // Resolves to the user, or to { needs2FA: true } when a code is required first.
  const signIn = useCallback(async (email, password) => {
    const normalized = email.trim().toLowerCase();
    const [found] = await db.where('users', (u) => u.email?.toLowerCase() === normalized);
    if (!found || !found.password || found.password !== hashPassword(password)) {
      throw new Error('Incorrect email or password.');
    }
    if (found.suspended) throw new Error('This account has been suspended. Contact support.');
    if (found.twoFactor) {
      setPending2FA(found.id);
      return { needs2FA: true };
    }
    await startSession(found.id);
    return found;
  }, [startSession]);

  const verifyTwoFactor = useCallback(async (code) => {
    if (!pending2FA) throw new Error('Your sign-in expired. Please sign in again.');
    if (code.trim() !== DEMO_CODE) throw new Error('That code is incorrect.');
    const id = pending2FA;
    setPending2FA(null);
    await startSession(id);
    return db.get('users', id);
  }, [pending2FA, startSession]);

  const verifyEmail = useCallback(async (code) => {
    if (code.trim() !== DEMO_CODE) throw new Error('That code is incorrect.');
    return db.update('users', userId, { emailVerified: true });
  }, [userId]);

  const recordConsent = useCallback(
    (consents) => db.update('users', userId, { consents, consentedAt: new Date().toISOString() }),
    [userId],
  );

  // Always "succeeds" so the UI never reveals whether an email is registered.
  const requestPasswordReset = useCallback(async () => true, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    if (code.trim() !== DEMO_CODE) throw new Error('That code is incorrect.');
    const err = pwError(newPassword);
    if (err) throw new Error(err);
    const normalized = email.trim().toLowerCase();
    const [found] = await db.where('users', (u) => u.email?.toLowerCase() === normalized);
    if (found) await db.update('users', found.id, { password: hashPassword(newPassword) });
  }, []);

  const changePassword = useCallback(async (current, next) => {
    if (user?.password !== hashPassword(current)) throw new Error('Your current password is incorrect.');
    const err = pwError(next);
    if (err) throw new Error(err);
    await db.update('users', userId, { password: hashPassword(next) });
  }, [user, userId]);

  const signOut = useCallback(async () => {
    await db.setMeta('session', null);
    setUserId(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    const id = userId;
    for (const [name, belongs] of Object.entries(USER_DATA)) {
      for (const row of await db.where(name, (r) => belongs(r, id))) await db.remove(name, row.id);
    }
    await signOut();
    await db.remove('users', id);
  }, [userId, signOut]);

  const updateProfile = useCallback((patch) => db.update('users', userId, patch), [userId]);

  const value = useMemo(
    () => ({
      ready: ready && (!userId || !!user || !usersLoading),
      user, pending2FA: !!pending2FA,
      signUp, signIn, verifyTwoFactor, verifyEmail, recordConsent, requestPasswordReset, resetPassword,
      changePassword, signOut, deleteAccount, updateProfile,
    }),
    [ready, userId, user, usersLoading, pending2FA, signUp, signIn, verifyTwoFactor, verifyEmail, recordConsent,
      requestPasswordReset, resetPassword, changePassword, signOut, deleteAccount, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
