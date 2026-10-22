import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseUrl } from '../lib/supabase';

export type UserRole = 'admin' | 'manager' | 'user';
export type Department = 'HR' | 'Support' | 'Sales' | 'Finance' | 'Operations' | 'IT' | 'Other';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department?: Department;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isManager: boolean;
  loading: boolean;
  isConfigured: boolean;
  signIn: (
    email: string,
    password: string,
    expectedRole?: UserRole,
    department?: Department
  ) => Promise<{ error: string | null; role?: UserRole }>;
  signInAsDemo: (role?: UserRole, department?: Department) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  canApproveCheckpoint: (checkpointDept?: string) => boolean;
  verifyDatabaseRole: () => Promise<UserRole>;
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

  // Synchronize profile row from Supabase `profiles` table
  const syncUserProfile = async (
    usr: User,
    customName?: string,
    explicitRole?: UserRole,
    explicitDept?: Department
  ) => {
    const fullName =
      customName ||
      usr.user_metadata?.full_name ||
      usr.user_metadata?.name ||
      usr.email?.split('@')[0] ||
      'FlowMind User';
    const avatarUrl = usr.user_metadata?.avatar_url || usr.user_metadata?.picture;
    const email = usr.email || '';

    const isAdminAccount = email.toLowerCase() === 'deepikabhuvaneshwaran8@gmail.com';
    let userRole: UserRole = explicitRole || (isAdminAccount ? 'admin' : 'user');
    let userDept: Department | undefined = explicitDept || (isAdminAccount ? 'Operations' : undefined);

    if (configured) {
      try {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('role, department, full_name, avatar_url')
          .eq('id', usr.id)
          .maybeSingle();

        if (profileRow?.role) {
          userRole = profileRow.role as UserRole;
        } else if (isAdminAccount) {
          userRole = 'admin';
        }

        if (profileRow?.department) {
          userDept = profileRow.department as Department;
        } else if (isAdminAccount && !userDept) {
          userDept = 'Operations';
        }

        // Upsert profile data
        await supabase.from('profiles').upsert(
          {
            id: usr.id,
            full_name: fullName,
            email,
            avatar_url: avatarUrl,
            role: userRole,
            department: userDept,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Could not sync profile table in background:', err);
      }
    }

    const newProfile: UserProfile = {
      id: usr.id,
      fullName,
      email,
      role: userRole,
      department: userDept,
      avatarUrl,
    };

    setProfile(newProfile);
    return newProfile;
  };

  // Instant Demo Sign-In (no password needed)
  const signInAsDemo = async (targetRole: UserRole = 'admin', targetDept: Department = 'Operations') => {
    const demoUser = {
      id: '00000000-0000-4000-a000-000000000001',
      app_metadata: {},
      user_metadata: { full_name: targetRole === 'admin' ? 'Demo Administrator' : 'Demo Operator' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: targetRole === 'admin' ? 'admin@flowmind.ai' : 'demo@flowmind.ai',
    } as unknown as User;

    const demoSession = {
      access_token: 'demo-session-token',
      token_type: 'bearer',
      expires_in: 86400,
      refresh_token: 'demo-refresh-token',
      user: demoUser,
    } as unknown as Session;

    const demoProfile: UserProfile = {
      id: demoUser.id,
      fullName: targetRole === 'admin' ? 'Demo Administrator' : targetRole === 'manager' ? `${targetDept} Manager` : 'Demo Operator',
      email: demoUser.email || 'demo@flowmind.ai',
      role: targetRole,
      department: targetDept,
    };

    try {
      localStorage.removeItem('flowmind_demo_auth');
    } catch {}

    setUser(demoUser);
    setSession(demoSession);
    setProfile(demoProfile);
    setLoading(false);
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';

  const canApproveCheckpoint = (checkpointDept?: string): boolean => {
    if (isAdmin) return true;
    if (isManager && profile?.department) {
      if (!checkpointDept) return true;
      return (
        profile.department.toLowerCase() === checkpointDept.toLowerCase() ||
        checkpointDept.toLowerCase().includes('manager') ||
        checkpointDept.toLowerCase().includes('general') ||
        checkpointDept.toLowerCase().includes('support')
      );
    }
    return false;
  };

  useEffect(() => {
    let isMounted = true;

    // Ensure any previously persisted demo auth is wiped so every visit requires logging in
    try {
      localStorage.removeItem('flowmind_demo_auth');
    } catch {}

    if (!configured) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    // Supabase session initialization
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error || !session) {
          if (import.meta.env.DEV) {
            console.log('[AUTH STATE] getSession: No active session found.');
          }
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);
        await syncUserProfile(session.user);
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

    // Real-time listener for Auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await syncUserProfile(session.user);
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
  const signIn = async (
    email: string,
    password: string,
    expectedRole: UserRole = 'user',
    department?: Department
  ): Promise<{ error: string | null; role?: UserRole }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (expectedRole === 'manager' && !department) {
      return {
        error: 'Please select your department to sign in as a Department Manager.',
      };
    }

    if (!configured) {
      return {
        error:
          'Supabase is not configured. Use the 1-Click Demo Login button below to explore the application.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      if (data.user) {
        const isAdminAccount = cleanEmail === 'deepikabhuvaneshwaran8@gmail.com';
        let verifiedRole: UserRole = isAdminAccount ? 'admin' : 'user';
        let userDept = department || (isAdminAccount ? 'Operations' : undefined);

        const { data: roleRow } = await supabase
          .from('profiles')
          .select('role, department')
          .eq('id', data.user.id)
          .maybeSingle();

        if (roleRow?.role) {
          verifiedRole = roleRow.role as UserRole;
        } else if (isAdminAccount) {
          verifiedRole = 'admin';
        }

        if (roleRow?.department && !userDept) {
          userDept = roleRow.department as Department;
        }

        if (expectedRole === 'admin' && verifiedRole !== 'admin') {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          return {
            error:
              'This account does not have administrator privileges. Please sign in as an authorized administrator.',
            role: 'user',
          };
        }

        if (expectedRole === 'manager' && userDept) {
          verifiedRole = 'manager';
          await supabase
            .from('profiles')
            .upsert(
              { id: data.user.id, email: cleanEmail, department: userDept, role: 'manager' },
              { onConflict: 'id' }
            );
        } else if (isAdminAccount) {
          await supabase
            .from('profiles')
            .upsert(
              { id: data.user.id, email: cleanEmail, role: 'admin', department: 'Operations' },
              { onConflict: 'id' }
            );
        }

        setUser(data.user);
        setSession(data.session);

        const profileData = await syncUserProfile(data.user, undefined, verifiedRole, userDept);
        setProfile(profileData);

        return { error: null, role: verifiedRole };
      }

      return { error: 'Authentication failed. Please verify your credentials.' };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    if (!configured) {
      return { error: 'Supabase is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) return { error: formatAuthError(error) };

      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true };
      }

      return { error: null, needsConfirmation: false };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    if (!configured) {
      return { error: 'Supabase is not configured.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) return { error: formatAuthError(error) };
      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!configured) return { error: 'Supabase is not configured.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: formatAuthError(error) };
      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!configured) return { error: 'Supabase is not configured.' };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: formatAuthError(error) };
      return { error: null };
    } catch (err: any) {
      return { error: formatAuthError(err) };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      localStorage.removeItem('flowmind_demo_auth');
    } catch {}
    if (configured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfileName = async (name: string): Promise<void> => {
    if (!user) return;
    try {
      if (configured) {
        await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
      }
      setProfile((prev) => (prev ? { ...prev, fullName: name } : null));
    } catch (err) {
      console.error('Failed to update profile name:', err);
    }
  };

  const verifyDatabaseRole = async (): Promise<UserRole> => {
    if (!user || !configured) return profile?.role || 'user';
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.role) {
        const r = data.role as UserRole;
        setProfile((prev) => (prev ? { ...prev, role: r } : null));
        return r;
      }
    } catch {}
    return profile?.role || 'user';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isManager,
        loading,
        isConfigured: configured,
        signIn,
        signInAsDemo,
        signUp,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        signOut,
        updateProfileName,
        canApproveCheckpoint,
        verifyDatabaseRole,
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
