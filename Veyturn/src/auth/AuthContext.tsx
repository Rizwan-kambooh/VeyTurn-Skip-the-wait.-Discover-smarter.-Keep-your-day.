import React, {createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState} from 'react';
import * as Keychain from 'react-native-keychain';
import {apiRequest, setTokenRefreshHandler} from '../services/api';

export type AuthUser = {id: string; full_name: string; email: string; phone_number: string};
type Session = {access: string; refresh: string; user: AuthUser};
type SignupData = {full_name: string; email: string; phone_number: string; password: string};
type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  restoring: boolean;
  rememberedIdentifier: string;
  login: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  updateProfile: (data: {full_name: string; current_password?: string; new_password?: string}) => Promise<void>;
  logout: () => Promise<void>;
};

const SERVICE = 'com.veyturn.auth';
const REMEMBER_SERVICE = 'com.veyturn.remembered-login';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [rememberedIdentifier, setRememberedIdentifier] = useState('');

  useEffect(() => {
    Promise.all([
      Keychain.getGenericPassword({service: SERVICE}),
      Keychain.getGenericPassword({service: REMEMBER_SERVICE}),
    ])
      .then(([credentials, remembered]) => {
        if (credentials) setSession(JSON.parse(credentials.password) as Session);
        if (remembered) setRememberedIdentifier(remembered.password);
      })
      .catch(() => Keychain.resetGenericPassword({service: SERVICE}))
      .finally(() => setRestoring(false));
  }, []);

  const saveSession = async (nextSession: Session) => {
    await Keychain.setGenericPassword('veyturn-session', JSON.stringify(nextSession), {service: SERVICE});
    sessionRef.current = nextSession;
    setSession(nextSession);
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    setTokenRefreshHandler(async () => {
      const current = sessionRef.current;
      if (!current?.refresh) throw new Error('Your session has expired. Please sign in again.');
      try {
        const tokens = await apiRequest<{access: string; refresh?: string}>('/auth/token/refresh/', {method: 'POST', body: {refresh: current.refresh}});
        const next = {...current, access: tokens.access, refresh: tokens.refresh || current.refresh};
        await saveSession(next);
        return next.access;
      } catch (error) {
        sessionRef.current = null;
        setSession(null);
        await Keychain.resetGenericPassword({service: SERVICE});
        throw error;
      }
    });
    return () => setTokenRefreshHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    accessToken: session?.access ?? null,
    restoring,
    rememberedIdentifier,
    login: async (identifier, password, rememberMe) => {
      const next = await apiRequest<Session>('/auth/login/', {method: 'POST', body: {identifier, password}});
      await saveSession(next);
      if (rememberMe) {
        const normalizedIdentifier = identifier.trim();
        await Keychain.setGenericPassword('veyturn-login', normalizedIdentifier, {service: REMEMBER_SERVICE});
        setRememberedIdentifier(normalizedIdentifier);
      } else {
        await Keychain.resetGenericPassword({service: REMEMBER_SERVICE});
        setRememberedIdentifier('');
      }
    },
    signup: async data => {
      const next = await apiRequest<Session>('/auth/register/', {method: 'POST', body: data});
      await saveSession(next);
    },
    updateProfile: async data => {
      if (!session) throw new Error('Please sign in again.');
      const user = await apiRequest<AuthUser>('/auth/me/', {method: 'PATCH', accessToken: session.access, body: data});
      await saveSession({...session, user});
    },
    logout: async () => {
      const currentSession = session;
      sessionRef.current = null;
      setSession(null);
      await Keychain.resetGenericPassword({service: SERVICE});
      if (currentSession) {
        apiRequest('/auth/logout/', {
          method: 'POST',
          accessToken: currentSession.access,
          body: {refresh: currentSession.refresh},
        }).catch(() => {
          // Local logout has already completed; remote revocation is best effort.
        });
      }
    },
  }), [rememberedIdentifier, restoring, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}

