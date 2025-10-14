import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';

type UserRole = 'admin' | 'normal_user';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface AuthUser extends User {
  role?: UserRole;
  profile?: Tables<'profiles'>;
  approvalStatus?: ApprovalStatus;
  // underRegistration?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  // underRegistration: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown | null }>;
  signUp: (email: string, password: string, userData?: Record<string, unknown>) => Promise<{ error: unknown | null }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Inactivity/session-timeout management
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const WARNING_OFFSET_MS = 60 * 1000; // 1 minute before timeout
  const warningTimeoutRef = useRef<number | null>(null);
  const signoutTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownWarningRef = useRef<boolean>(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
      }
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      return { role: roleData?.role, profile: profileData };
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return { role: null, profile: null };
    }
  };

  const refreshUserData = async () => {
    setLoading(true);
    if (!session?.user) return;
    
    const { role, profile } = await fetchUserRole(session.user.id);
    setUser({
      ...session.user,
      role: role as UserRole,
      profile,
      approvalStatus: profile?.approval_status as ApprovalStatus,
    });
    setLoading(false);
    toast({
      title: "Success",
      description: "User data refreshed successfully",
      variant: "default",
    });
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock with onAuthStateChange
          setTimeout(() => {
            fetchUserRole(session.user.id).then(({ role, profile }) => {
              setUser({
                ...session.user,
                role: role as UserRole,
                profile,
                approvalStatus: profile?.approval_status as ApprovalStatus,
              });
              setLoading(false);
            }).catch((error) => {
              console.error('Error fetching user data:', error);
              setUser({
                ...session.user,
                role: 'normal_user' as UserRole,
                profile: null,
                approvalStatus: 'pending' as ApprovalStatus,
              });
              setLoading(false);
            });
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id).then(({ role, profile }) => {
          setUser({
            ...session.user,
            role: role as UserRole,
            profile,
            approvalStatus: profile?.approval_status as ApprovalStatus,
          });
          setLoading(false);
        }).catch((error) => {
          console.error('Error fetching initial user data:', error);
          setUser({
            ...session.user,
            role: 'normal_user' as UserRole,
            profile: null,
            approvalStatus: 'pending' as ApprovalStatus,
          });
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Record<string, unknown> = {}) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error: unknown) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Force navigation to auth page after sign out
    window.location.href = '/auth';
  };

  // Reset idle timers based on current time and configured thresholds
  const resetIdleTimers = useCallback(() => {
    // Only enforce when a session exists
    if (!session?.user) return;

    lastActivityRef.current = Date.now();
    hasShownWarningRef.current = false;

    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (signoutTimeoutRef.current) {
      window.clearTimeout(signoutTimeoutRef.current);
      signoutTimeoutRef.current = null;
    }

    // Schedule warning and auto sign-out
    warningTimeoutRef.current = window.setTimeout(() => {
      // Avoid duplicate warnings
      if (!hasShownWarningRef.current) {
        hasShownWarningRef.current = true;
        toast({
          title: 'You will be signed out soon',
          description: 'Due to inactivity, you will be signed out in 1 minute.',
        });
      }
    }, Math.max(0, IDLE_TIMEOUT_MS - WARNING_OFFSET_MS));

    signoutTimeoutRef.current = window.setTimeout(async () => {
      await signOut();
    }, IDLE_TIMEOUT_MS);
  }, [session?.user, toast, IDLE_TIMEOUT_MS, WARNING_OFFSET_MS]);

  // Global activity listeners to reset the idle timer
  useEffect(() => {
    const onActivity = () => resetIdleTimers();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimers();
      }
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('mousedown', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [session?.user, resetIdleTimers]);

  // Whenever session/user becomes available or changes, (re)start timers
  useEffect(() => {
    if (session?.user) {
      resetIdleTimers();
    } else {
      if (warningTimeoutRef.current) window.clearTimeout(warningTimeoutRef.current);
      if (signoutTimeoutRef.current) window.clearTimeout(signoutTimeoutRef.current);
      warningTimeoutRef.current = null;
      signoutTimeoutRef.current = null;
    }
  }, [session?.user, resetIdleTimers]);

  const isAdmin = user?.role === 'admin';
  const isApproved = user?.approvalStatus === 'approved';
  // const underRegistration = user?.underRegistration || false;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAdmin,
      isApproved,
      // underRegistration,
      signIn,
      signUp,
      signOut,
      refreshUserData
    }}>
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