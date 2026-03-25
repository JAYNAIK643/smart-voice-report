import { createContext, useContext, useState, useEffect } from "react";
// createContext-> global data store bananne ke liye
//useState-> data store karne ke liye
//useEffect-> lifecycle control(jab app load hota hai)
//authService-> backennd/API se login/signup handle karta hai
import { authService } from "@/services/authService";

const AuthContext = createContext(undefined);// ye ek container hai jisme user data store hoga
// AuthProvider Component
export const AuthProvider = ({ children }) => { //Jo bhi component inside hoga → wo auth data access kar sakta hai
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
/* App start hone par check karta hai:
1.token hai ya nahi
2.user data saved hai ya nahi
3. Agar token + user mila → login restore
 4. nahi mila → logout state*/
  useEffect(() => {
    console.log('🔐 AuthContext - Checking stored auth...', { 
      hasToken: !!authService.getToken(),
      hasStoredUser: !!authService.getStoredUser()
    });
    const token = authService.getToken();
    const storedUser = authService.getStoredUser();

    if (token && storedUser) {
      console.log('✅ AuthContext - User found in storage:', storedUser);
      setUser(storedUser);
    } else {
      console.log('❌ AuthContext - No user in storage');
      setUser(null);
    }

    setLoading(false);
  }, []);
  /*signup function
 API call karta hai
 user create karta hai
 success → user set karta hai */
  const signUp = async (name, email, password, role = "user") => {
    try {
      const result = await authService.signup(name, email, password, role);
      if (!result.success) {
        return { error: { message: result.error } };
      }

      setUser(result.data.user);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const signIn = async (email, password, role = "user") => {
    console.log('🔐 AuthContext.signIn called:', { email, role });
    try {
      const result = await authService.login(email, password, role);
      console.log('🔐 AuthContext.signIn response:', result);
      
      if (!result.success) {
        return { error: { message: result.error } };
      }

      // Check if 2FA is required
      if (result.requiresTwoFactor) {
        console.log('🔐 AuthContext - 2FA required');
        return { 
          requiresTwoFactor: true,
          needs2FASetup: result.needs2FASetup || false,
          setupToken: result.setupToken,
          userId: result.userId,
          email: result.email 
        };
      }

      console.log('✅ AuthContext - Setting user:', result.data.user);
      setUser(result.data.user);
      return { error: null };
    } catch (error) {
      console.error('❌ AuthContext.signIn error:', error);
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    authService.logout();
    setUser(null);
    return { error: null };
  };
//LocalStorage se user update karta hai
  const updateUserFromStorage = () => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  };

  // Listen for storage changes (e.g., when 2FA verification saves user data)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        updateUserFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";
  const isWardAdmin = user?.role === "ward_admin";
  const isManagement = isAdmin || isWardAdmin;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading SmartCity Portal...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isWardAdmin,
        isManagement,
        signUp,
        signIn,
        signOut,
        updateUserFromStorage,
      }}
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
