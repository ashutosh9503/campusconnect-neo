import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // OTP methods
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  // Password methods
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get user-friendly error messages
function getAuthErrorMessage(error: any): string {
  const message = error?.message?.toLowerCase() || "";
  
  if (message.includes("invalid login credentials")) {
    return "Invalid email or password. Please check your credentials.";
  }
  if (message.includes("email not confirmed")) {
    return "Please verify your email before logging in.";
  }
  if (message.includes("user not found") || message.includes("no user found")) {
    return "No account found with this email. Please sign up first.";
  }
  if (message.includes("invalid otp") || message.includes("token has expired")) {
    return "Invalid or expired OTP. Please request a new code.";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (message.includes("user already registered")) {
    return "An account with this email already exists. Please login instead.";
  }
  if (message.includes("password")) {
    return "Password must be at least 6 characters long.";
  }
  if (message.includes("email")) {
    return "Please enter a valid email address.";
  }
  
  return error?.message || "An unexpected error occurred. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create profile on first sign up
        if (event === "SIGNED_IN" && session?.user) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(async () => {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("user_id", session.user.id)
              .single();

            if (!existingProfile) {
              await supabase.from("profiles").insert({
                user_id: session.user.id,
                username: session.user.email?.split("@")[0] || null,
                display_name: session.user.email?.split("@")[0] || null,
              });
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(getAuthErrorMessage(err)) };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(getAuthErrorMessage(err)) };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(getAuthErrorMessage(err)) };
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        return { error: new Error(getAuthErrorMessage(error)) };
      }
      
      // Check if email confirmation is needed
      // If user exists but identities is empty, user already exists
      if (data.user && data.user.identities?.length === 0) {
        return { error: new Error("An account with this email already exists. Please login instead.") };
      }
      
      // Check if confirmation is needed (user created but not confirmed)
      const needsConfirmation = data.user && !data.session;
      
      return { error: null, needsConfirmation };
    } catch (err: any) {
      return { error: new Error(getAuthErrorMessage(err)) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      sendOtp, 
      verifyOtp, 
      signInWithPassword,
      signUpWithPassword,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
