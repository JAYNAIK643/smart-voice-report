import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

/**
 * 2FA Verification Component
 * Handles 2FA code verification during login
 */

const TwoFactorVerify = ({ userId, email, onVerified, onBack }) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    const codeLength = useBackupCode ? 8 : 6;
    if (verificationCode.length !== codeLength) {
      toast({
        title: "Invalid Code",
        description: `Please enter a ${codeLength}-character ${useBackupCode ? "backup code" : "verification code"}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("🔐 Verifying 2FA code...", { userId, codeLength, useBackupCode });
    
    try {
      const response = await fetch("http://localhost:3000/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          token: verificationCode,
        }),
      });

      const data = await response.json();
      console.log("🔐 2FA verification response:", { success: data.success, hasToken: !!data.data?.token });

      if (data.success) {
        // Save auth token and user data
        if (data.data?.token) {
          localStorage.setItem("authToken", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          console.log("✅ Token and user saved to localStorage", { 
            role: data.data.user.role,
            email: data.data.user.email 
          });
        }

        toast({
          title: "Verification Successful",
          description: "Logging you in...",
        });
        
        if (data.warning) {
          toast({
            title: "Warning",
            description: data.warning,
            variant: "warning",
          });
        }

        // Call parent callback to complete login
        if (onVerified) {
          console.log("🔐 Calling onVerified callback...");
          onVerified();
        }
      } else {
        console.error("❌ 2FA verification failed:", data.message);
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
        setVerificationCode("");
      }
    } catch (error) {
      console.error("❌ 2FA verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify 2FA code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Enter your verification code</CardDescription>
              </div>
            </div>
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Logged in as: <strong>{email}</strong>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="verificationCode">
                {useBackupCode ? "Backup Code" : "Verification Code"}
              </Label>
              <Input
                id="verificationCode"
                type="text"
                maxLength={useBackupCode ? 8 : 6}
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    useBackupCode
                      ? e.target.value.toUpperCase()
                      : e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder={useBackupCode ? "ABCD1234" : "123456"}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                {useBackupCode
                  ? "Enter one of your 8-character backup codes"
                  : "Open your authenticator app and enter the 6-digit code"}
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                loading ||
                verificationCode.length !== (useBackupCode ? 8 : 6)
              }
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setVerificationCode("");
              }}
              className="text-sm"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Use backup code instead"}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Lost access to your authenticator?</p>
            <p>Contact support for account recovery</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TwoFactorVerify;
