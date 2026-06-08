import { createContext, useContext, useState, useEffect } from "react";
// createContext-> global data store bananne ke liye
//useState-> data store karne ke liye
//useEffect-> lifecycle control(jab app load hota hai)
//authService-> backennd/API se login/signup handle karta hai
import { authService } from "@/services/authService";

const AuthContext = createContext(undefined);// ye ek container hai jisme user data store hoga

const parseJwtPayload = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
};

const hasRequiredAuthClaims = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  return Boolean(payload.id && payload.email && payload.role);
};

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
    const tokenHasRequiredClaims = token ? hasRequiredAuthClaims(token) : false;

    if (token && storedUser && tokenHasRequiredClaims) {
      console.log('✅ AuthContext - User found in storage:', storedUser);
      setUser(storedUser);
    } else if (token && !tokenHasRequiredClaims) {
      console.log("⚠️ AuthContext - Token missing required claims (id/email/role). Clearing stale auth.");
      authService.logout();
      setUser(null);
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

      // Check if Email OTP (special case returned by authService)
      if (result.requires2FA && result.method === "email") {
        return {
          requires2FA: true,
          method: "email",
          setupToken: result.setupToken,
          userId: result.userId,
          email: result.email,
        };
      }

      // Check if general 2FA is required (method selection needed)
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

      // Ensure token and user are persisted (defensive)
      try {
        if (result.data?.token) {
          localStorage.setItem("authToken", result.data.token);
          localStorage.setItem("user", JSON.stringify(result.data.user));
          console.log("🔐 AuthContext - Stored auth token and user (login)", {
            tokenPreview: `${result.data.token.substring(0,10)}...`,
            userId: result.data.user?.id || result.data.user?._id,
            email: result.data.user?.email,
          });
        } else {
          const existing = authService.getToken();
          console.log("🔐 AuthContext - No new token in response, existing token:", existing ? `${existing.substring(0,10)}...` : null);
        }
      } catch (err) {
        console.error("🔐 AuthContext - Error storing token/user:", err);
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
