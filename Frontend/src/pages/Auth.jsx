import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { z } from "zod";
import TwoFactorVerify from "@/components/security/TwoFactorVerify";
import TwoFactorSetup from "@/components/security/TwoFactorSetup";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);

  const { signIn, signUp, isAuthenticated, isAdmin, isWardAdmin, loading, updateUserFromStorage } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { requestPermission, permission, isSupported } = usePushNotifications();

  // Memoize the 'from' path to prevent it from changing on every render
  const from = useMemo(() => {
    return location.state?.from?.pathname || "/";
  }, [location.state?.from?.pathname]);

  useEffect(() => {
    console.log('🔍 Auth state check:', { isAuthenticated, isAdmin, isWardAdmin, loading, from });
    
    if (!loading && isAuthenticated) {
      console.log('✅ User authenticated, redirecting...', { 
        isAdmin, 
        isWardAdmin,
        targetPath: isAdmin ? '/admin/dashboard' : isWardAdmin ? '/ward-admin/dashboard' : '/dashboard' 
      });
      
      if (isAdmin) {
        console.log('👤 Redirecting admin user to /admin/dashboard');
        navigate("/admin/dashboard", { replace: true });
      } else if (isWardAdmin) {
        console.log('👤 Redirecting ward admin user to /ward-admin/dashboard');
        navigate("/ward-admin/dashboard", { replace: true });
      } else {
        console.log('👤 Redirecting regular user to /dashboard');
        navigate("/dashboard", { replace: true });
      }
    } else if (!loading && !isAuthenticated) {
      console.log('❌ User not authenticated, staying on auth page');
    }
  }, [isAuthenticated, isAdmin, isWardAdmin, loading, navigate, from]);

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !name.trim()) {
      newErrors.name = "Name is required";
    }

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password, "user");
        
        // Check if 2FA is required
        if (result.requiresTwoFactor) {
          setRequires2FA(true);
          setNeeds2FASetup(result.needs2FASetup || false);
          setTwoFactorData({
            userId: result.userId,
            email: result.email,
            setupToken: result.setupToken
          });
          setIsSubmitting(false);
          return;
        }
        
        if (result.error) {
          let message = result.error.message || "An error occurred during sign in";
          
          if (message.includes("Network error") || message.includes("Failed to fetch")) {
            message = "Cannot connect to server. Please make sure the backend is running on http://localhost:3000";
          } else if (message.includes("admin")) {
            message = "Please use admin login for admin accounts";
          }
          
          toast({
            title: "Sign In Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Login successful, user set in context. Waiting for redirect...');
          // Don't navigate here - let the useEffect handle it
          // This prevents double navigation issues
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          
          if (isSupported && permission === 'default') {
            setTimeout(() => {
              requestPermission().then((result) => {
                if (result === 'granted') {
                  toast({
                    title: "Notifications Enabled",
                    description: "You'll receive push notifications for important updates.",
                  });
                }
              });
            }, 2000);
          }
        }
      } else {
        const { error } = await signUp(name, email, password, "user");
        if (error) {
          let message = error.message || "An error occurred during sign up";
          
          if (message.includes("Network error") || message.includes("Failed to fetch")) {
            message = "Cannot connect to server. Please make sure the backend is running on http://localhost:3000";
          } else if (message.includes("already registered")) {
            message = "This email is already registered. Please sign in instead.";
          }
          
          toast({
            title: "Sign Up Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "You have successfully signed up.",
          });
          setIsLogin(true);
          setName("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAVerified = () => {
    // Update auth context with the user data from localStorage
    updateUserFromStorage();
    
    setRequires2FA(false);
    setNeeds2FASetup(false);
    setTwoFactorData(null);
    
    // Get the stored user to determine redirect
    const storedUser = localStorage.getItem("user");
    let redirectPath = "/";
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const userRole = userData.role;
        
        // Determine redirect based on role
        if (userRole === "admin") {
          redirectPath = "/admin/dashboard";
        } else if (userRole === "ward_admin") {
          redirectPath = "/ward-admin/dashboard";
        } else {
          redirectPath = "/dashboard";
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
    
    // Navigate directly instead of using window.location
    // This prevents the white screen issue
    navigate(redirectPath, { replace: true });
  };

  const handle2FABack = () => {
    setRequires2FA(false);
    setNeeds2FASetup(false);
    setTwoFactorData(null);
  };
  
  const handle2FASetupComplete = async () => {
    toast({
      title: "2FA Enabled!",
      description: "Please enter your 2FA code to continue",
    });
    setNeeds2FASetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show 2FA setup if required
  if (requires2FA && needs2FASetup && twoFactorData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Security Setup Required</h2>
            <p className="text-muted-foreground mt-2">
              Two-Factor Authentication is mandatory for all users. Please set it up to continue.
            </p>
          </div>
          <TwoFactorSetup 
            setupToken={twoFactorData.setupToken}
            onSetupComplete={handle2FASetupComplete} 
          />
          <button
            onClick={handle2FABack}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  // Show 2FA verification if required
  if (requires2FA && twoFactorData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <TwoFactorVerify
            userId={twoFactorData.userId}
            email={twoFactorData.email}
            onVerified={handle2FAVerified}
            onBack={handle2FABack}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to access your account"
                : "Sign up to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`${errors.name ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${errors.email ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${errors.password ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${errors.confirmPassword ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full gradient-button text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </div>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setName("");
                setPassword("");
                setConfirmPassword("");
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;