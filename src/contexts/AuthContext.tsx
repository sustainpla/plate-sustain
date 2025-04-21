import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole } from "@/lib/types";

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...userData,
          },
        },
      });

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: email,
              name: userData.name,
              role: userData.role,
              address: userData.address,
              phone: userData.phone,
              profile_image: userData.profileImage,
            },
          ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          return { error: profileError };
        }
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Add refreshUser function to get the latest user data
  const refreshUser = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        if (profile) {
          const userRole = userData.user.user_metadata.role || profile.role || 'donor';
          
          setCurrentUser({
            id: userData.user.id,
            email: userData.user.email || '',
            name: profile.name,
            role: userRole as UserRole,
            address: profile.address,
            phone: profile.phone,
            profileImage: profile.profile_image,
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (session?.user) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error("Error fetching profile:", error);
              setIsLoading(false);
              return;
            }

            if (profile) {
              const userRole = session.user.user_metadata.role || profile.role || 'donor';

              setCurrentUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile.name,
                role: userRole as UserRole,
                address: profile.address,
                phone: profile.phone,
                profileImage: profile.profile_image,
              });
            }
          }
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        }

        setIsLoading(false);
      }
    );
    
    // Add refreshUser to the returned context
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshUser, // Add the new refreshUser function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
