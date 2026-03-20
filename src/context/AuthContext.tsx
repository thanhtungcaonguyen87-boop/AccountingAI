import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        const staySignedIn = localStorage.getItem("stay_signed_in") === "true";
        const loginTimestamp = parseInt(
          localStorage.getItem("login_timestamp") || "0",
          10,
        );
        const lastActivity = parseInt(
          localStorage.getItem("last_activity") || "0",
          10,
        );
        const now = Date.now();

        let shouldSignOut = false;

        // If no timestamp, set it now (e.g. first interaction after implementing this)
        if (!loginTimestamp) {
          localStorage.setItem("login_timestamp", now.toString());
          localStorage.setItem("last_activity", now.toString());
        } else {
          if (!staySignedIn) {
            // 1 day limit (24 hours)
            if (now - loginTimestamp > 24 * 60 * 60 * 1000) {
              shouldSignOut = true;
            }
          } else {
            // 30 days max
            if (now - loginTimestamp > 30 * 24 * 60 * 60 * 1000) {
              shouldSignOut = true;
            }
            // 7 days inactive max
            else if (now - lastActivity > 7 * 24 * 60 * 60 * 1000) {
              shouldSignOut = true;
            }
          }
        }

        if (shouldSignOut) {
          await supabase.auth.signOut();
          localStorage.removeItem("stay_signed_in");
          localStorage.removeItem("login_timestamp");
          localStorage.removeItem("last_activity");
          setSession(null);
          setUser(null);
        } else {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      }
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        if (!localStorage.getItem("login_timestamp")) {
          localStorage.setItem("login_timestamp", Date.now().toString());
          localStorage.setItem("last_activity", Date.now().toString());
        }
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("stay_signed_in");
        localStorage.removeItem("login_timestamp");
        localStorage.removeItem("last_activity");
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update last activity on interaction
  useEffect(() => {
    if (session) {
      const updateActivity = () => {
        localStorage.setItem("last_activity", Date.now().toString());
      };

      // Throttled update to avoid excessive localStorage writes
      let timeoutId: number | null = null;
      const throttledUpdate = () => {
        if (!timeoutId) {
          timeoutId = window.setTimeout(() => {
            updateActivity();
            timeoutId = null;
          }, 60000); // Update at most once per minute
        }
      };

      window.addEventListener("mousedown", throttledUpdate);
      window.addEventListener("keydown", throttledUpdate);
      window.addEventListener("touchstart", throttledUpdate);
      window.addEventListener("scroll", throttledUpdate);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener("mousedown", throttledUpdate);
        window.removeEventListener("keydown", throttledUpdate);
        window.removeEventListener("touchstart", throttledUpdate);
        window.removeEventListener("scroll", throttledUpdate);
      };
    }
  }, [session]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("stay_signed_in");
    localStorage.removeItem("login_timestamp");
    localStorage.removeItem("last_activity");
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
