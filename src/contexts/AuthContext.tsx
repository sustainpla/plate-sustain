
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole } from "@/lib/types";

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean; // Add this property
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: Error | null }>; // Add alias for signIn
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>; // Add method for RegisterForm
  logout: () => Promise<void>; // Add alias for signOut
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for signIn
  const login = signIn;

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

  // More comprehensive register function for RegisterForm
  const register = async (email: string, password: string, name: string, role: UserRole) => {
    const userData = { name, role };
    const { error } = await signUp(email, password, userData);
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for signOut
  const logout = signOut;

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
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setIsAuthenticated(false);
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
              setIsAuthenticated(false);
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
              setIsAuthenticated(true);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }

        setIsLoading(false);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        refreshUser,
        login,
        register,
        logout,
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
