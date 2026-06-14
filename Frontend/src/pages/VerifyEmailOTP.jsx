import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const VerifyEmailOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(5);
  const { toast } = useToast();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("tempAuthToken") || localStorage.getItem("authToken");
      console.log("📧 [VerifyEmailOTP] Verifying OTP", { userId, tokenPreview: token ? `${token.substring(0,10)}...` : null });

      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();
      console.log("OTP verification response:", data);

      if (data.success) {
        // Store auth token and user object (auth context requires both)
        localStorage.setItem("authToken", data.data.token);
        if (data.data.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        localStorage.removeItem("tempAuthToken");
        localStorage.removeItem("userId");
        toast({
          title: "Success",
          description: "Email verified! Logging in...",
        });

        // Determine redirect based on user role
        const userRole = data.data.user?.role;
        let redirectPath = "/dashboard";
        if (userRole === "admin") redirectPath = "/admin/dashboard";
        else if (userRole === "ward_admin") redirectPath = "/ward-admin/dashboard";

        setTimeout(() => navigate(redirectPath, { replace: true }), 500);
      } else {
        const remaining = data.data?.attemptsRemaining ?? attempts - 1;
        setAttempts(remaining);
        toast({
          title: "Invalid Code",
          description: `${remaining} attempts remaining`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("tempAuthToken") || localStorage.getItem("authToken");
      console.log("📧 [VerifyEmailOTP] Resend OTP (login flow)", { userId, tokenPreview: token ? `${token.substring(0,10)}...` : null });

      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/resend-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Resent",
          description: "New OTP sent to your email",
        });
        setOtp("");
        setAttempts(5);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>Enter the 6-digit code from your email</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-3xl tracking-widest font-mono"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {attempts} attempt{attempts !== 1 ? "s" : ""} remaining
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={loading}
                className="w-full"
              >
                Resend Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmailOTP;
