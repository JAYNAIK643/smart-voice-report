import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

/**
 * Email OTP Verification Component
 * Handles OTP verification during login
 */

const EmailOTPVerify = ({ onSuccess, onBack, setupToken }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const token = setupToken || localStorage.getItem("tempAuthToken");
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Invalid code", {
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      console.log("📧 [EmailOTPVerify] Verification response:", data);

      if (data.success) {
        // Save the final auth token
        localStorage.setItem("authToken", data.data.token);
        localStorage.removeItem("tempAuthToken");

        toast.success("Login successful!", {
          description: "Redirecting to dashboard...",
        });

        // Call onSuccess callback to handle redirect
        if (onSuccess) {
          onSuccess(data.data.token);
        }
      } else {
        const remaining = data.data?.attemptsRemaining || attemptsRemaining;
        setAttemptsRemaining(remaining);

        if (remaining === 0) {
          toast.error("Too many attempts", {
            description: "Please request a new code",
          });
        } else {
          toast.error("Invalid code", {
            description: `${remaining} attempt${remaining !== 1 ? "s" : ""} remaining`,
          });
        }
      }
    } catch (error) {
      console.error("📧 [EmailOTPVerify] Verification error:", error);
      toast.error("Error", {
        description: "Failed to verify code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Code resent", {
          description: "Check your email for the new code",
        });
        setOtp("");
        setAttemptsRemaining(5); // Reset attempts for new code
      } else {
        toast.error("Resend failed", {
          description: data.message || "Failed to resend code",
        });
      }
    } catch (error) {
      console.error("📧 [EmailOTPVerify] Resend error:", error);
      toast.error("Error", {
        description: "Failed to resend code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                Check your email for a 6-digit code
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-3xl tracking-widest font-mono"
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Valid for 10 minutes
              </p>
            </div>

            {attemptsRemaining <= 2 && attemptsRemaining > 0 && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                  {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                </AlertDescription>
              </Alert>
            )}

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

            <div className="flex gap-2 text-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendOTP}
                disabled={loading}
                className="flex-1"
              >
                Resend Code
              </Button>
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmailOTPVerify;
