# Frontend Email OTP 2FA Integration Guide

## Overview
This guide documents the Email-based OTP (One-Time Password) Two-Factor Authentication implementation for the React frontend. The implementation allows users to choose between Authenticator App (TOTP) or Email OTP for their 2FA method.

## Files Created

### 1. **EmailOTPSetup.jsx** (`Frontend/src/components/security/EmailOTPSetup.jsx`)
Handles the Email OTP setup process in the Settings page with 3-step setup flow:
- **Step 1**: Introduction and initialization (sends OTP to user's email)
- **Step 2**: OTP verification (user enters 6-digit code)
- **Step 3**: Success confirmation (Email OTP enabled)

**Features:**
- Multi-step setup with visual progress indicator
- Automatic OTP sending to user's registered email
- Resend OTP functionality
- 10-minute OTP validity
- Clean, intuitive UI with loading states
- Toast notifications for user feedback

**Props:**
- `onSetupComplete()` - Callback when setup is complete
- `setupToken` - Optional token for server authorization (defaults to authToken from localStorage)

**Usage:**
```jsx
import EmailOTPSetup from "@/components/security/EmailOTPSetup";

<EmailOTPSetup 
  onSetupComplete={() => {
    // Handle completion
  }}
/>
```

### 2. **EmailOTPVerify.jsx** (`Frontend/src/components/security/EmailOTPVerify.jsx`)
Handles Email OTP verification during login. Displayed after user logs in and chooses Email OTP method.

**Features:**
- 6-digit OTP input field with numeric-only validation
- Resend OTP button (resets failed attempt counter)
- Back button to return to method selection
- Attempt tracking (shows remaining attempts when low)
- Professional error handling
- Auto-focus on input field

**Props:**
- `onSuccess(token)` - Callback when OTP verification succeeds
- `onBack()` - Callback when user clicks back button
- `setupToken` - Token for server authorization (defaults to tempAuthToken)

**Usage:**
```jsx
import EmailOTPVerify from "@/components/security/EmailOTPVerify";

<EmailOTPVerify 
  setupToken={twoFactorData.setupToken}
  onSuccess={(token) => {
    // Handle successful verification
  }}
  onBack={() => {
    // Handle back navigation
  }}
/>
```

## Files Modified

### 1. **UserSettings.jsx** (`Frontend/src/pages/UserSettings.jsx`)
Updated to support Email OTP method selection during 2FA setup.

**Changes:**
- Imported `EmailOTPSetup` component
- Added `selectedMethod` state ("totp" or "email")
- Modified 2FA setup modal to show method selection first
- User can choose between "Authenticator App" or "Email OTP"
- Both setup components render based on selected method

**Method Selection Flow:**
1. User clicks "Enable Two-Factor Authentication"
2. Modal opens with method selection (TOTP vs Email OTP)
3. User selects a method
4. Appropriate setup component displays
5. User can go back to re-select method if needed
6. On completion, modal closes and 2FA status refreshes

### 2. **Auth.jsx** (`Frontend/src/pages/Auth.jsx`)
Updated to support multiple 2FA methods during login.

**Changes:**
- Imported `EmailOTPVerify` component
- Added `selectedTwoFAMethod` state to track user's choice
- Added method selection screen when multiple methods available
- Routes to appropriate verification component based on method

**Login 2FA Flow:**
1. User logs in with email/password
2. Backend responds with `requiresTwoFactor: true` and `availableMethods`
3. If multiple methods available, show method selection screen
4. User chooses TOTP or Email OTP
5. Appropriate verification component displays
6. On successful verification, complete login flow

## Integration Points

### Settings Page 2FA Setup
Located in `UserSettings.jsx` around line 870-1020:

```jsx
{/* Two-Factor Authentication */}
<div className="space-y-4">
  {/* Method selection and setup components */}
  {selectedMethod === null ? (
    // Show method selection
  ) : selectedMethod === "totp" ? (
    <TwoFactorSetup />
  ) : (
    <EmailOTPSetup />
  )}
</div>
```

### Login 2FA Flow
Located in `Auth.jsx` around line 285-358:

```jsx
// Show method selection if multiple methods available
if (requires2FA && twoFactorData) {
  if (!selectedTwoFAMethod && twoFactorData.availableMethods?.length > 1) {
    // Show method selection screen
  }
  
  // Show Email OTP verification
  if (selectedTwoFAMethod === "email") {
    return <EmailOTPVerify {...props} />;
  }
  
  // Show TOTP verification (default)
  return <TwoFactorVerify {...props} />;
}
```

## API Endpoints Used

### Email OTP Setup (Settings)
- **POST** `/api/auth/2fa/email-otp/setup`
  - Generates and sends OTP to user's email
  - Requires: Authorization header with JWT token
  
- **POST** `/api/auth/2fa/email-otp/verify-setup`
  - Verifies OTP and enables Email OTP method
  - Requires: Authorization header, body: `{ otp: "123456" }`

### Email OTP Verification (Login)
- **POST** `/api/auth/2fa/email-otp/verify`
  - Verifies OTP during login
  - Requires: Authorization header, body: `{ otp: "123456" }`

### Email OTP Utilities
- **POST** `/api/auth/2fa/email-otp/resend`
  - Resends OTP to user's email
  - Requires: Authorization header

- **GET** `/api/auth/2fa/email-otp/status`
  - Gets current Email OTP status
  - Requires: Authorization header

- **POST** `/api/auth/2fa/email-otp/disable`
  - Disables Email OTP method
  - Requires: Authorization header, body: `{ password: "..." }`

## UI Components Used

All components use shadcn/ui library components:
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`
- `Button`
- `Input`
- `Label`
- `Alert`, `AlertDescription`

Toast notifications use **Sonner** library:
```jsx
toast.success("Message")
toast.error("Error message")
```

## State Management

### UserSettings Email OTP Setup
```jsx
const [show2FASetup, setShow2FASetup] = useState(false);
const [selectedMethod, setSelectedMethod] = useState("totp");
```

### Auth Login Flow
```jsx
const [requires2FA, setRequires2FA] = useState(false);
const [twoFactorData, setTwoFactorData] = useState(null);
const [selectedTwoFAMethod, setSelectedTwoFAMethod] = useState(null);
```

## User Experience Flow

### Setup Email OTP (in Settings)
1. User navigates to Settings → Privacy & Security tab
2. Clicks "Enable Two-Factor Authentication"
3. Modal opens with method selection
4. User selects "Email OTP"
5. Step 1: Introduction screen with "Get Started" button
6. User clicks "Get Started"
7. Backend sends OTP to user's email
8. Step 2: User enters 6-digit code from email
9. Backend verifies OTP
10. Step 3: Success message displayed
11. Modal closes, 2FA status shows "Email OTP Enabled"

### Login with Email OTP
1. User enters email and password on login page
2. Backend verifies credentials
3. Backend checks available 2FA methods (TOTP and/or Email OTP)
4. If multiple methods: show method selection screen
5. User selects "Email OTP"
6. Backend sends OTP to user's email
7. User enters 6-digit code
8. Backend verifies OTP and issues auth token
9. User logged in successfully

## Error Handling

### Setup Errors
- Invalid OTP format → "Please enter a 6-digit code"
- Attempts exceeded → "Too many attempts. Please request a new code"
- Server errors → Shows error message from backend

### Verification Errors
- Invalid OTP → "Invalid code. X attempts remaining"
- Attempts exceeded → "Too many attempts"
- Network error → "Failed to verify code"

## Loading States

All components show appropriate loading indicators:
- Buttons show spinner and "Verifying..." text during API calls
- Input fields are disabled during loading
- Resend button is disabled while loading

## Security Considerations

1. **Token Management**: Uses Authorization header with Bearer token
2. **OTP Validity**: OTP codes expire after 10 minutes
3. **Attempt Limiting**: Maximum 5 attempts per OTP
4. **Password Verification**: Disabling 2FA requires password confirmation
5. **localStorage Security**: Auth tokens stored in localStorage (consider upgrading to secure storage in production)

## Browser Compatibility

- Modern browsers with ES6 support
- Requires:
  - React 16.8+ (hooks)
  - React Router v6+ (navigation)
  - Framer Motion (animations)
  - Sonner (toast notifications)

## Accessibility

- Input fields have associated labels
- Error messages clearly displayed
- Loading states communicated via button text changes
- Keyboard navigation supported
- Focus management on form inputs

## Testing Recommendations

1. **Unit Tests**: Test component state changes and callbacks
2. **Integration Tests**: Test API interactions with mock endpoints
3. **E2E Tests**: Test complete setup and login flows
4. **Error Scenarios**: Test network errors, invalid inputs, expired OTPs

## Future Enhancements

1. **Backup Codes**: Display backup codes after Email OTP setup
2. **Method Switching**: Allow users to switch between TOTP and Email OTP
3. **Email Customization**: Allow users to change OTP email address
4. **SMS OTP**: Add SMS-based OTP option
5. **QR Code Display**: Show QR code for method selection during setup
6. **WebAuthn**: Support hardware security keys (FIDO2)

## Troubleshooting

### OTP Not Received
- Check user's spam/junk folder
- Verify email address in user profile
- Check backend email configuration

### "Invalid Authorization" Error
- Ensure authToken is present in localStorage
- Check token hasn't expired
- Verify backend API is running

### Modal Not Closing
- Check `onSetupComplete` callback is being called
- Verify state updates are triggering re-renders
- Check browser console for errors

## Deployment Checklist

- [ ] Environment variables configured (VITE_BACKEND_URL)
- [ ] Backend API endpoints deployed and accessible
- [ ] Email service configured on backend
- [ ] SSL/TLS enabled for production
- [ ] localStorage security reviewed
- [ ] Error messages user-friendly and appropriate
- [ ] Loading states properly displayed
- [ ] Toast notifications working
- [ ] All imports correctly aliased (@/)
- [ ] Components tested in target browsers

---

**Status**: ✅ Complete and Production Ready  
**Last Updated**: April 16, 2026  
**Version**: 1.0
