import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ data?: any, error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, address, avatar_url, wallet_balance, role, is_banned, created_at, updated_at')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        if (data.is_banned) {
          // Immediate sign out and redirection for banned users
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return;
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Track if this is the first event so we only clear loading once
    let initialized = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Update session/user state immediately
      setSession(session);
      setUser(session?.user ?? null);

      // Fetch profile before clearing the initial loading state
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (!initialized) {
            initialized = true;
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        if (!initialized) {
          initialized = true;
          setLoading(false);
        }
      }
    });

    // Safety net: if onAuthStateChange never fires within 3s, unblock the UI
    const timeout = setTimeout(() => {
      if (!initialized) {
        initialized = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem('swiftcart_cart');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
