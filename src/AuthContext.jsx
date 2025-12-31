import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const SessionContext = createContext(null);
const SupabaseClientContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SupabaseClientContext.Provider value={supabase}>
      <SessionContext.Provider value={session}>
        {children}
      </SessionContext.Provider>
    </SupabaseClientContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  return useContext(SessionContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSupabaseClient() {
  return useContext(SupabaseClientContext);
}
