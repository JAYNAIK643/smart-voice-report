import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

/**
 * Email OTP Setup Component
 * Handles the setup process for Email-based 2FA
 */

const EmailOTPSetup = ({ onSetupComplete, setupToken }) => {
  const [step, setStep] = useState(1); // 1: Intro, 2: OTP Input, 3: Success
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const token = setupToken || localStorage.getItem("authToken");
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Step 1: Initialize Email OTP Setup
  const handleInitializeSetup = async () => {
    console.log("📧 [EmailOTPSetup] Initializing email OTP setup...");
    setLoading(true);
    try {
      const tokenPreview = token ? `${token.substring(0,10)}...` : null;
      console.log("📧 [EmailOTPSetup] Using token:", { tokenPreview });
      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("📧 [EmailOTPSetup] Setup response:", data);

      if (data.success) {
        setStep(2);
        toast.success("OTP sent to your email!", {
          description: `Check your email for the 6-digit code. Valid for ${data.data.validityMinutes} minutes.`,
        });
      } else {
        console.error("📧 [EmailOTPSetup] Setup failed:", data.message);
        toast.error("Setup failed", {
          description: data.message || "Failed to initialize email OTP setup",
        });
      }
    } catch (error) {
      console.error("📧 [EmailOTPSetup] Setup error:", error);
      toast.error("Error", {
        description: "Failed to initialize email OTP setup",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Invalid code", {
        description: "Please enter a 6-digit verification code",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/auth/2fa/email-otp/verify-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(3);
        toast.success("Email OTP enabled!", {
          description: "You can now use email OTP for 2FA during login",
        });
      } else {
        toast.error("Verification failed", {
          description: data.data?.attemptsRemaining 
            ? `Invalid OTP. ${data.data.attemptsRemaining} attempts remaining`
            : data.message || "Invalid verification code",
        });
      }
    } catch (error) {
      console.error("📧 [EmailOTPSetup] Verification error:", error);
      toast.error("Error", {
        description: "Failed to verify email OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
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
        toast.success("OTP resent", {
          description: "Check your email for the new code",
        });
        setOtp(""); // Clear the input field
      } else {
        toast.error("Resend failed", {
          description: data.message || "Failed to resend OTP",
        });
      }
    } catch (error) {
      console.error("📧 [EmailOTPSetup] Resend error:", error);
      toast.error("Error", {
        description: "Failed to resend OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                s <= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-8 h-1 ${
                  s < step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Introduction */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle>Email-based 2FA</CardTitle>
                  <CardDescription>
                    Receive OTP codes via email for secure login
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  We'll send a 6-digit code to your registered email each time you log in.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">How it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Click "Get Started" to receive an OTP code</li>
                  <li>Check your email for the 6-digit code</li>
                  <li>Enter the code to verify and enable 2FA</li>
                  <li>Use email OTP on your next login</li>
                </ol>
              </div>

              <Button
                onClick={handleInitializeSetup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: OTP Verification */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We've sent a 6-digit code to your email
              </CardDescription>
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
                  />
                  <p className="text-xs text-gray-500">
                    Valid for 10 minutes
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
                    "Verify and Enable"
                  )}
                </Button>

                <div className="flex gap-2 text-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="flex-1"
                  >
                    Resend Code
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Email 2FA Enabled</CardTitle>
                  <CardDescription>
                    Your account is now protected with email-based 2FA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  You'll receive a code via email each time you log in from a new device.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmailOTPSetup;
