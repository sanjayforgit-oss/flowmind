import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseUrl } from '../lib/supabase';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to format Supabase error messages into actionable, clear feedback
function formatAuthError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  console.error('[SUPABASE AUTH ERROR RAW]:', error);

  const msg = error.message || String(error);

  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('User already registered') || msg.includes('user_already_exists')) {
    return 'An account with this email address already exists. Please sign in.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (msg.includes('over_email_send_rate_limit')) {
    return 'Too many password reset requests. Please wait a minute and try again.';
  }
  if (msg.includes('Failed to fetch') || msg.includes('network') || msg.includes('ENOTFOUND')) {
    if (!isSupabaseConfigured()) {
      return 'Supabase project credentials not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.';
    }
    return `Unable to connect to the authentication server (${getSupabaseUrl()}). Please check your project status and network.`;
  }
  return msg;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const configured = isSupabaseConfigured();

  // Clean any legacy demo auth bypass from previous sessions
  useEffect(() => {
    try {
      localStorage.removeItem('flowmind_demo_auth');
    } catch {
      // ignore
    }
  }, []);

  // Synchronize profile row in Supabase `profiles` table
  const syncUserProfile = async (usr: User, customName?: string) => {
    const fullName =
      customName ||
      usr.user_metadata?.full_name ||
      usr.user_metadata?.name ||
      usr.email?.split('@')[0] ||
      'FlowMind User';
    const avatarUrl = usr.user_metadata?.avatar_url || usr.user_metadata?.picture;
    const email = usr.email || '';

    const newProfile: UserProfile = {
      id: usr.id,
      fullName,
      email,
      avatarUrl,
    };

    setProfile(newProfile);

    if (configured) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: usr.id,
            full_name: fullName,
            email,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Could not sync profile table in background:', err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!configured) {
      if (import.meta.env.DEV) {
        console.warn('[AUTH STATE] VITE_SUPABASE_URL is currently unconfigured or placeholder in .env. Real Supabase auth requires valid credentials.');
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // Supabase session initialization
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error || !session) {
          if (import.meta.env.DEV) {
            console.log('[AUTH STATE] getSession: No active session found. User is unauthenticated.');
          }
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (import.meta.env.DEV) {
          console.log('[AUTH STATE] getSession: Active session restored for:', session.user.email);
        }
        setSession(session);
        setUser(session.user);
        syncUserProfile(session.user);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get Supabase session:', err);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    // Real-time listener for Auth changes (Sign in, Sign out, Token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (import.meta.env.DEV) {
        console.log(`[AUTH STATE] onAuthStateChange event: ${event}, user: ${session?.user?.email || 'null'}`);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  // 1. Password Sign In
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!configured) {
      return {
        error: 'Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await syncUserProfile(data.user);
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  // 2. Sign Up Flow
  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    if (!configured) {
      return {
        error: 'Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await syncUserProfile(data.user, fullName.trim());
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  // 3. Google OAuth Sign In
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    if (!configured) {
      return {
        error: 'Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  // 4. Password Reset
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!configured) {
      return {
        error: 'Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  // 5. Update Password
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!configured) {
      return {
        error: 'Supabase is not configured. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart Vite.',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  // 6. Sign Out
  const signOut = async (): Promise<void> => {
    if (configured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // 7. Update Profile Name
  const updateProfileName = async (name: string): Promise<void> => {
    if (!profile || !user) return;
    const updated = { ...profile, fullName: name };
    setProfile(updated);

    if (configured) {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: name,
        updated_at: new Date().toISOString(),
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: configured,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        signOut,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
