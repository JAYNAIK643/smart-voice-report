# Email OTP 2FA Frontend - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐         ┌──────────────────────┐  │
│  │   Auth.jsx          │         │  UserSettings.jsx    │  │
│  │  (Login Flow)       │         │  (Settings Page)     │  │
│  ├─────────────────────┤         ├──────────────────────┤  │
│  │ • Login form        │         │ • Profile tab        │  │
│  │ • TOTP verify       │         │ • Notifications      │  │
│  │ • Email OTP verify  │         │ • Privacy & Security │  │
│  │ • Method selection  │         │ • 2FA Setup/Config   │  │
│  └────────┬────────────┘         └──────────┬───────────┘  │
│           │                                  │              │
│           └──────────────┬───────────────────┘              │
│                          │                                  │
│                    ┌─────▼──────────────────────────────┐  │
│                    │   2FA Components                   │  │
│                    ├────────────────────────────────────┤  │
│                    │                                    │  │
│                    │  ┌─────────────────────────────┐  │  │
│                    │  │ EmailOTPSetup.jsx           │  │  │
│                    │  │ • Step 1: Initialize        │  │  │
│                    │  │ • Step 2: Verify OTP        │  │  │
│                    │  │ • Step 3: Success           │  │  │
│                    │  └─────────────────────────────┘  │  │
│                    │                                    │  │
│                    │  ┌─────────────────────────────┐  │  │
│                    │  │ EmailOTPVerify.jsx          │  │  │
│                    │  │ • OTP input (6 digits)      │  │  │
│                    │  │ • Verify & Complete Login   │  │  │
│                    │  │ • Resend OTP                │  │  │
│                    │  └─────────────────────────────┘  │  │
│                    │                                    │  │
│                    │  ┌─────────────────────────────┐  │  │
│                    │  │ TwoFactorSetup.jsx (TOTP)   │  │  │
│                    │  │ • QR Code display           │  │  │
│                    │  │ • Verify setup              │  │  │
│                    │  │ • Backup codes              │  │  │
│                    │  └─────────────────────────────┘  │  │
│                    │                                    │  │
│                    │  ┌─────────────────────────────┐  │  │
│                    │  │ TwoFactorVerify.jsx (TOTP)  │  │  │
│                    │  │ • OTP input (6 digits)      │  │  │
│                    │  │ • Verify & Complete Login   │  │  │
│                    │  │ • Use backup code           │  │  │
│                    │  └─────────────────────────────┘  │  │
│                    │                                    │  │
│                    └────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ API Calls                    │ API Calls
         │                              │
         ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Auth Endpoints                              │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ POST   /api/auth/login                             │   │
│  │ POST   /api/auth/2fa/setup (TOTP)                  │   │
│  │ POST   /api/auth/2fa/verify (TOTP & Email)         │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Email OTP Endpoints (NEW)                   │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ POST   /api/auth/2fa/email-otp/setup               │   │
│  │ POST   /api/auth/2fa/email-otp/verify-setup        │   │
│  │ POST   /api/auth/2fa/email-otp/verify              │   │
│  │ POST   /api/auth/2fa/email-otp/resend              │   │
│  │ GET    /api/auth/2fa/email-otp/status              │   │
│  │ POST   /api/auth/2fa/email-otp/disable             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Database (User with 2FA data)               │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ • TOTP fields (secret, backup codes)               │   │
│  │ • Email OTP fields (code, expiry, attempts)        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │        Email Service (Nodemailer)                  │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ • OTP Email template                               │   │
│  │ • Send to user's registered email                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Settings Page - Email OTP Setup Flow

```
User Opens Settings
    │
    ├─ Go to Privacy & Security tab
    │
    ├─ See "Enable Two-Factor Authentication" button
    │
    ▼ Click Button
┌─────────────────────────────────────┐
│   2FA Setup Modal Opens             │
│ (show2FASetup = true)               │
└─────────────────────────────────────┘
    │
    ├─ Show Method Selection Screen
    │  (selectedMethod = null)
    │  ┌────────────────┐
    │  │ TOTP           │ (Authenticator App)
    │  └────────────────┘
    │  ┌────────────────┐
    │  │ Email OTP ◄────┤ User Clicks Here
    │  └────────────────┘
    │
    ▼ User Selects Email OTP
    (selectedMethod = "email")
┌─────────────────────────────────────┐
│  EmailOTPSetup Component Renders    │
│  STEP 1: Introduction               │
├─────────────────────────────────────┤
│ • Shows purpose of Email OTP        │
│ • "Get Started" button              │
│ ┌─────────────┐                     │
│ │ Get Started  │ ◄─ User Clicks     │
│ └─────────────┘                     │
└─────────────────────────────────────┘
    │
    ├─ API Call: POST /api/auth/2fa/email-otp/setup
    │  ├─ Authorization: Bearer {token}
    │  └─ Response: { success: true, data: { validityMinutes: 10 } }
    │
    ├─ Backend sends OTP to user's email
    │
    ▼ Step 1 Complete → Move to Step 2
    (step = 2)
┌─────────────────────────────────────┐
│  EmailOTPSetup Component             │
│  STEP 2: OTP Verification           │
├─────────────────────────────────────┤
│ • Input field for 6-digit code      │
│ • User receives email with code     │
│ • User enters code (e.g., 123456)   │
│ • "Verify and Enable" button        │
│ • "Resend Code" button              │
│                                     │
│ Enter: ┌─────────────────┐          │
│        │ 1 2 3 4 5 6     │          │
│        └─────────────────┘          │
│                                     │
│ ┌──────────────────┐                │
│ │ Verify and Enable│ ◄─ User Clicks │
│ └──────────────────┘                │
└─────────────────────────────────────┘
    │
    ├─ API Call: POST /api/auth/2fa/email-otp/verify-setup
    │  ├─ Authorization: Bearer {token}
    │  ├─ Body: { otp: "123456" }
    │  └─ Response: { success: true, data: { ... } }
    │
    ▼ Verification Success → Move to Step 3
    (step = 3)
┌─────────────────────────────────────┐
│  EmailOTPSetup Component             │
│  STEP 3: Success                    │
├─────────────────────────────────────┤
│ ✓ Email 2FA Enabled                 │
│ • Green checkmark icon              │
│ • Success message                   │
│ • "Done" button                     │
│ ┌──────┐                            │
│ │ Done │ ◄─ User Clicks             │
│ └──────┘                            │
└─────────────────────────────────────┘
    │
    ├─ Callback: onSetupComplete()
    │  (EmailOTPSetup Component)
    │
    ├─ Modal Closes
    │  (show2FASetup = false)
    │
    ├─ Refresh 2FA Status
    │  (fetch2FAStatus())
    │
    ▼ Settings Page Updates
    Show: "Email OTP Enabled"
    - Enabled on [date]
    - Disable button
    - Regenerate codes (if applicable)
```

---

## Login Flow - Email OTP Verification

```
Login Page
    │
    ├─ User enters email & password
    │
    ▼ Click Login
    (handleSubmit)
    │
    ├─ API Call: POST /api/auth/login
    │  └─ Response: {
    │       requiresTwoFactor: true,
    │       availableMethods: ["totp", "email"],
    │       setupToken: "temp_token_..."
    │     }
    │
    ▼ 2FA Required
    (requires2FA = true,
     twoFactorData = {...})
    │
    ├─ Check: Multiple methods available?
    │  (availableMethods.length > 1)
    │
    ├─ YES: Show Method Selection Screen ◄─ (TOTP + Email OTP both enabled)
    │        ┌─────────────────────────────────┐
    │        │ Choose Verification Method      │
    │        ├─────────────────────────────────┤
    │        │ ○ Authenticator App             │
    │        │ ◉ Email OTP ◄─ User Selects    │
    │        └─────────────────────────────────┘
    │               │
    │               ▼ (selectedTwoFAMethod = "email")
    │
    ├─ NO: Skip method selection
    │      Use detected method directly
    │      (Only one method enabled)
    │
    ▼ Email OTP Method Selected
    (selectedTwoFAMethod = "email")
    
    ┌──────────────────────────────────────────┐
    │  EmailOTPVerify Component Renders        │
    ├──────────────────────────────────────────┤
    │ • "Enter Verification Code"              │
    │ • Input field for 6-digit code           │
    │ • "Valid for 10 minutes" message         │
    │ • "Verify" button                        │
    │ • "Resend Code" button                   │
    │ • "Back" button (to method selection)    │
    │                                          │
    │ Backend has sent OTP to user's email     │
    │ (happens before component renders)       │
    │                                          │
    │ User receives email with code            │
    │ User enters code (e.g., 654321)          │
    │                                          │
    │ ┌─ Code Entry: ┌──────────────┐         │
    │ │               │ 6 5 4 3 2 1  │         │
    │ │               └──────────────┘         │
    │ │                                        │
    │ │ ┌──────┐                              │
    │ │ │Verify│ ◄─ User Clicks               │
    │ │ └──────┘                              │
    │                                          │
    └──────────────────────────────────────────┘
        │
        ├─ API Call: POST /api/auth/2fa/email-otp/verify
        │  ├─ Authorization: Bearer {setupToken}
        │  ├─ Body: { otp: "654321" }
        │  └─ Response: { success: true, data: { token: "auth_token", user: {...} } }
        │
        ├─ If Success:
        │  ├─ Save auth token to localStorage
        │  ├─ Call onSuccess callback
        │  ├─ Update auth context
        │  └─ Redirect to dashboard
        │
        ├─ If Invalid Code:
        │  ├─ Show error: "Invalid code"
        │  ├─ Decrement attempts
        │  ├─ Show remaining attempts
        │  └─ Allow retry
        │
        ├─ If Too Many Attempts:
        │  ├─ Show: "Too many attempts"
        │  └─ Show "Resend Code" button
        │
        ▼ Login Complete or Retry
        Dashboard or Resend Flow
```

---

## Resend OTP Flow

```
EmailOTPVerify Component
    │
    ├─ User viewing OTP input form
    │
    ▼ User Clicks "Resend Code"
    (handleResendOTP)
    │
    ├─ API Call: POST /api/auth/2fa/email-otp/resend
    │  ├─ Authorization: Bearer {token}
    │  └─ Response: { success: true, ... }
    │
    ├─ Backend:
    │  ├─ Generates new OTP
    │  ├─ Resets attempt counter to 5
    │  ├─ Sends email with new code
    │  └─ Returns success
    │
    ├─ Frontend:
    │  ├─ Clear input field (setOtp(""))
    │  ├─ Show toast: "Code resent"
    │  ├─ Reset attempts to 5
    │  └─ Focus input field
    │
    ▼ User Receives New Email
    │
    ├─ User enters new code
    │
    ▼ Click Verify
    Success or Retry
```

---

## State Flow Diagram

```
Auth.jsx State Management:

┌─────────────────────────────────────┐
│ Login Form                          │
│ (email, password entered)           │
└────────────┬────────────────────────┘
             │ handleSubmit()
             ▼
┌─────────────────────────────────────┐
│ requires2FA = false (initial)       │
│ selectedTwoFAMethod = null          │
│ twoFactorData = null                │
└────────────┬────────────────────────┘
             │ Backend response
             │ requiresTwoFactor: true
             ▼
┌─────────────────────────────────────┐
│ requires2FA = true                  │
│ selectedTwoFAMethod = null          │
│ twoFactorData = {                   │
│   setupToken,                       │
│   availableMethods: ["totp", "email"]
│ }                                   │
└────────────┬────────────────────────┘
             │ availableMethods.length > 1?
         ┌───┴───┐
         │       │
        YES     NO
         │       │
         ▼       ▼
┌──────────────────┐  ┌──────────────────┐
│ Method Selection │  │ Direct to Email  │
│ Screen Shows     │  │ (Skip Selection) │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         │ User clicks         │ (if only email)
         │ "Email OTP"         │
         │                     │
         └────────┬────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │ selectedTwoFAMethod │
        │ = "email"           │
        │                     │
        │ EmailOTPVerify      │
        │ Renders             │
        └────────┬────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Success          Invalid Code
        │                 │
        ▼                 ▼
    ┌─────────────┐  ┌──────────────┐
    │ Login       │  │ Show Error   │
    │ Complete    │  │ Allow Retry  │
    │ Redirect    │  │              │
    │ Dashboard   │  │ or Resend    │
    └─────────────┘  └──────────────┘
```

---

## UserSettings.jsx State Management

```
Initial State:
├─ selectedMethod = "totp"
├─ show2FASetup = false
├─ twoFactorStatus = null
└─ ...other state

User clicks "Enable 2FA":
├─ setShow2FASetup(true)
│
├─ Modal Opens
├─ selectedMethod is still "totp"
│
User clicks "Email OTP" in method selection:
├─ setSelectedMethod("email")
│
├─ Conditional renders:
│  ├─ if (selectedMethod === null) → Show method selection
│  ├─ if (selectedMethod === "totp") → Show TwoFactorSetup
│  └─ if (selectedMethod === "email") → Show EmailOTPSetup
│
User completes Email OTP setup:
├─ onSetupComplete callback fires
├─ setShow2FASetup(false) → Modal closes
├─ setSelectedMethod("totp") → Reset to default
├─ fetch2FAStatus() → Refresh status
└─ toast.success("Email 2FA enabled!")

Result:
└─ Settings page shows "Email OTP Enabled" status
```

---

## Component Hierarchy

```
App (main router)
│
├─ Auth.jsx (Login Page)
│  │
│  ├─ LOGIN STATE
│  │  └─ Regular login form
│  │
│  ├─ 2FA STATE
│  │  ├─ Method Selection Screen (if multiple methods)
│  │  │  ├─ TOTP button
│  │  │  └─ Email OTP button ◄─ Selected
│  │  │
│  │  └─ Verification Component
│  │     ├─ TwoFactorVerify (TOTP)
│  │     └─ EmailOTPVerify (Email OTP) ◄─ Renders here
│  │        ├─ Input: setupToken
│  │        ├─ Output: onSuccess callback
│  │        └─ Features:
│  │           ├─ OTP input field
│  │           ├─ Verify button
│  │           ├─ Resend button
│  │           └─ Back button
│  │
│  └─ Dashboard (after successful login)
│
└─ UserSettings.jsx (Settings Page)
   │
   └─ Privacy & Security Tab
      │
      ├─ 2FA Status Display
      │  ├─ "Enable 2FA" button (if disabled)
      │  └─ "Disable 2FA" button (if enabled)
      │
      ├─ 2FA Setup Modal (when enabled)
      │  │
      │  ├─ Method Selection Screen
      │  │  ├─ TOTP option
      │  │  └─ Email OTP option ◄─ Selected
      │  │
      │  └─ Setup Component
      │     ├─ TwoFactorSetup (TOTP)
      │     └─ EmailOTPSetup (Email OTP) ◄─ Renders here
      │        ├─ Step 1: Introduction
      │        ├─ Step 2: OTP Verification
      │        └─ Step 3: Success
      │
      └─ Back to Dashboard
```

---

## Data Flow - API & State

```
Frontend State → API Call → Backend Processing → Response → State Update → UI Render

Setup Flow:
─────────────

Initial State:
├─ step = 1
├─ otp = ""
├─ loading = false
└─ setupToken = authToken

User clicks "Get Started":
└─ setLoading(true)
   └─ fetch POST /api/auth/2fa/email-otp/setup
      └─ { Authorization: Bearer setupToken }
         └─ Backend: Generate OTP, send email
            └─ Response: { success: true, data: { validityMinutes: 10 } }
               └─ setStep(2), setLoading(false)
                  └─ UI shows Step 2 OTP input form

User enters OTP and clicks verify:
└─ setLoading(true)
   └─ fetch POST /api/auth/2fa/email-otp/verify-setup
      └─ { Authorization: Bearer setupToken, body: { otp: "123456" } }
         └─ Backend: Verify OTP, enable Email OTP
            └─ Response: { success: true, data: { ... } }
               └─ setStep(3), setLoading(false)
                  └─ UI shows Step 3 success

Verification Flow (Login):
──────────────────────────

Initial State:
├─ otp = ""
├─ loading = false
├─ attemptsRemaining = 5
└─ setupToken = twoFactorData.setupToken

User enters OTP and clicks verify:
└─ setLoading(true)
   └─ fetch POST /api/auth/2fa/email-otp/verify
      └─ { Authorization: Bearer setupToken, body: { otp: "654321" } }
         └─ Backend: Verify OTP, issue auth token
            └─ Response: { success: true, data: { token: "...", user: {...} } }
               └─ localStorage.setItem("authToken", token)
                  └─ onSuccess(token) callback
                     └─ Auth context updates
                        └─ Navigate to dashboard

If invalid:
└─ Response: { success: false, data: { attemptsRemaining: 4 } }
   └─ setAttemptsRemaining(4)
   └─ UI shows error with attempts remaining
```

---

**Diagram Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: ✅ Complete
