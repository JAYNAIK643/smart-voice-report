import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Shield, Copy, Check, Download, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

// Get backend URL from environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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
      const response = await fetch(`${BACKEND_URL}/api/auth/2fa/verify`, {
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

/**
 * 2FA Setup Component
 * Handles the setup process for Two-Factor Authentication
 */
/*
const TwoFactorSetup = ({ onSetupComplete, setupToken }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Use setupToken if provided (for mandatory setup during login), otherwise use stored token (for settings page)
  const token = setupToken || localStorage.getItem("authToken");

  // Step 1: Initialize 2FA Setup
  const handleInitializeSetup = async () => {
    console.log("🔐 [TwoFactorSetup] Initializing 2FA setup...");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("🔐 [TwoFactorSetup] Setup response:", data);

      if (data.success) {
        console.log("🔐 [TwoFactorSetup] QR Code received:", data.data.qrCode?.substring(0, 50) + "...");
        console.log("🔐 [TwoFactorSetup] Secret received:", data.data.secret?.substring(0, 10) + "...");
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
        setStep(2);
        console.log("🔐 [TwoFactorSetup] Moving to step 2");
        toast({
          title: "Setup Initiated",
          description: "Scan the QR code with your authenticator app",
        });
      } else {
        console.error("🔐 [TwoFactorSetup] Setup failed:", data.message);
        toast({
          title: "Error",
          description: data.message || "Failed to initialize 2FA setup",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("🔐 [TwoFactorSetup] Setup error:", error);
      toast({
        title: "Error",
        description: "Failed to initialize 2FA setup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify and Enable 2FA
  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        setBackupCodes(data.data.backupCodes);
        setStep(3);
        toast({
          title: "2FA Enabled!",
          description: "Your account is now protected with 2FA",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify 2FA code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }; */

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast({
      title: "Copied",
      description: "Secret key copied to clipboard",
    });
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\\n");
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join("\\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartcity-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Backup codes downloaded successfully",
    });
  };

  const handleComplete = () => {
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                s <= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-1 ${
                  s < step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Welcome / QR Code */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle>Enable Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  2FA requires an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Scan a QR code with your authenticator app</li>
                  <li>Enter the 6-digit code from the app to verify</li>
                  <li>Save your backup codes in a secure location</li>
                  <li>Enter the code each time you log in</li>
                </ol>
              </div>

              <Button
                onClick={handleInitializeSetup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {loading ? "Setting up..." : "Get Started"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 2: QR Code & Verification */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Use your authenticator app to scan this QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-gray-200">
                {qrCode && <QRCodeSVG value={qrCode} size={200} level="H" />}
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Can't scan? Enter this key manually:</Label>
                <div className="flex gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                  >
                    {copiedSecret ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyAndEnable} className="space-y-4">
                <div>
                  <Label htmlFor="verificationCode">Enter 6-digit code from your app</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify and Enable 2FA"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Save Your Backup Codes</CardTitle>
              <CardDescription>
                These codes can be used to access your account if you lose access to your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Store these codes in a secure location. Each code can only be used once.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="font-mono text-sm p-2 bg-white dark:bg-gray-900 rounded border text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="flex-1"
                >
                  {copiedCodes ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Codes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackupCodes}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              >
                I've Saved My Backup Codes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
