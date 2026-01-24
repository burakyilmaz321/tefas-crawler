import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGithub = async () => {
        const redirectHost = window.location.origin;
        const isLocal = redirectHost.includes('localhost');

        // Vercel previews use random hostnames; add a deterministic return path we can allowlist.
        const redirectTo = isLocal
            ? `${redirectHost}/`
            : `${redirectHost}/auth/callback`;

        const { error, data } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo,
                // Force PKCE + redirect flow (popup can be blocked on some browsers)
                queryParams: { prompt: 'consent' }
            }
        });

        if (error) {
            console.error('GitHub login error:', error, 'redirectTo:', redirectTo);
            alert('GitHub ile giriş yapılamadı. Lütfen tekrar deneyin.');
        } else {
            console.info('GitHub OAuth started', data?.url, 'redirectTo:', redirectTo);
        }
    };

    const signOut = async () => {
        if (!isSupabaseConfigured) {
            return;
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithGithub, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
