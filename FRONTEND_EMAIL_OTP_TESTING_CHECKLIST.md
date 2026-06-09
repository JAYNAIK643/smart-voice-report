# Email OTP 2FA Frontend - Implementation Checklist

## Pre-Deployment Verification

### Code Review
- [ ] **EmailOTPSetup.jsx** reviewed
  - [ ] 3-step flow implemented correctly
  - [ ] API endpoints match backend specification
  - [ ] Error handling covers all scenarios
  - [ ] Loading states implemented
  - [ ] Toast notifications work correctly

- [ ] **EmailOTPVerify.jsx** reviewed
  - [ ] OTP input validation (6 digits, numeric only)
  - [ ] Attempt tracking displays correctly
  - [ ] Resend OTP functionality works
  - [ ] Back button works as expected
  - [ ] Success callback handles token storage

- [ ] **UserSettings.jsx** modifications reviewed
  - [ ] Method selection UI visible and functional
  - [ ] Both TOTP and Email OTP options display
  - [ ] Modal opens and closes properly
  - [ ] State management correct
  - [ ] No existing functionality broken

- [ ] **Auth.jsx** modifications reviewed
  - [ ] Method selection screen appears when needed
  - [ ] Correct component displays based on selection
  - [ ] Back navigation works properly
  - [ ] Success callback completes login flow
  - [ ] TOTP verification still works as fallback

### Environment Setup
- [ ] Frontend `.env` configured with `VITE_BACKEND_URL`
- [ ] Backend running on expected URL
- [ ] Email service configured on backend
- [ ] All required npm packages installed

### Component Imports
- [ ] All shadcn/ui components imported correctly:
  - [ ] Card, CardContent, CardDescription, CardHeader, CardTitle
  - [ ] Button, Input, Label
  - [ ] Alert, AlertDescription
  - [ ] RadioGroup, RadioGroupItem (for method selection)

- [ ] Third-party imports available:
  - [ ] React (useState)
  - [ ] Framer Motion (motion, AnimatePresence)
  - [ ] lucide-react (icons)
  - [ ] sonner (toast)

### API Endpoint Testing
- [ ] Backend endpoints reachable:
  - [ ] `POST /api/auth/2fa/email-otp/setup` ✓
  - [ ] `POST /api/auth/2fa/email-otp/verify-setup` ✓
  - [ ] `POST /api/auth/2fa/email-otp/verify` ✓
  - [ ] `POST /api/auth/2fa/email-otp/resend` ✓

- [ ] Endpoints return expected responses:
  - [ ] Success responses include required fields
  - [ ] Error responses include error messages
  - [ ] Token is returned on successful verification

## Browser Testing

### Settings Page - Email OTP Setup
- [ ] Navigate to Settings > Privacy & Security
- [ ] "Enable Two-Factor Authentication" button visible
- [ ] Click button opens 2FA setup modal
- [ ] Method selection screen shows:
  - [ ] "Authenticator App" option
  - [ ] "Email OTP" option
  - [ ] Radio buttons or visual selection works

- [ ] **Select Email OTP**:
  - [ ] Step 1 shows introduction
  - [ ] Step indicator shows 1 of 3
  - [ ] "Get Started" button visible and clickable
  - [ ] Loading state during API call
  - [ ] Success: "OTP sent to your email!" toast appears
  - [ ] Backend returns OTP validity (10 minutes)

- [ ] **Step 2 - OTP Entry**:
  - [ ] Input field shows placeholder "000000"
  - [ ] Field accepts only numbers (0-9)
  - [ ] Field limited to 6 digits
  - [ ] "Verify and Enable" button present
  - [ ] "Resend Code" button functional
  - [ ] Step indicator shows 2 of 3

- [ ] **Resend OTP**:
  - [ ] Click "Resend Code" triggers API call
  - [ ] Shows loading state
  - [ ] "OTP resent" toast appears
  - [ ] Input field clears
  - [ ] User can enter new code

- [ ] **Invalid OTP**:
  - [ ] Entering less than 6 digits: error message
  - [ ] Entering invalid code: "Invalid OTP" + attempts remaining
  - [ ] After 5 attempts: "Too many attempts" message
  - [ ] Can resend to get new OTP

- [ ] **Step 3 - Success**:
  - [ ] Green checkmark icon displays
  - [ ] "Email 2FA Enabled" title shows
  - [ ] Success message about receiving codes at login
  - [ ] Step indicator shows 3 of 3
  - [ ] "Done" button closes modal and returns to Settings

### Login Page - Email OTP Verification
- [ ] Regular login works with email/password
- [ ] After successful login credentials:
  - [ ] If only TOTP enabled: go to TOTP verification (unchanged)
  - [ ] If only Email OTP enabled: go to Email OTP verification
  - [ ] If both enabled: show method selection first

- [ ] **Method Selection Screen**:
  - [ ] Shows when both TOTP and Email OTP enabled
  - [ ] Both options visible and clickable
  - [ ] "Authenticator App" option selectable
  - [ ] "Email OTP" option selectable
  - [ ] "Back to login" button works

- [ ] **Email OTP Verification Screen**:
  - [ ] "Enter Verification Code" title shows
  - [ ] Input field for 6-digit code
  - [ ] "Valid for 10 minutes" message
  - [ ] "Verify" button present
  - [ ] "Resend Code" button present
  - [ ] "Back" button present (to method selection)
  - [ ] Field accepts only numbers

- [ ] **Valid OTP**:
  - [ ] Enter 6-digit code received in email
  - [ ] Click "Verify"
  - [ ] Loading state shows "Verifying..."
  - [ ] Success: "Redirecting to dashboard..."
  - [ ] Browser redirects to dashboard
  - [ ] User logged in successfully

- [ ] **Invalid OTP**:
  - [ ] Enter wrong code: error message with attempts remaining
  - [ ] After 5 attempts: "Too many attempts" message
  - [ ] "Resend Code" button allows new attempt with new code

- [ ] **Resend OTP**:
  - [ ] Click "Resend Code"
  - [ ] Loading state
  - [ ] "Code resent" toast
  - [ ] Input field clears
  - [ ] Attempts reset to 5
  - [ ] User can enter new code

- [ ] **Back Navigation**:
  - [ ] Click "Back" button
  - [ ] Return to method selection screen
  - [ ] Can choose different method

## Responsive Design Testing

- [ ] **Desktop (1920px)**:
  - [ ] All text readable
  - [ ] Buttons properly sized
  - [ ] Modal centered
  - [ ] Input fields properly spaced

- [ ] **Tablet (768px)**:
  - [ ] Modal responsive and centered
  - [ ] Touch targets appropriately sized
  - [ ] Text doesn't overflow
  - [ ] Buttons easily clickable

- [ ] **Mobile (375px)**:
  - [ ] Modal scales properly
  - [ ] Input field usable on mobile keyboard
  - [ ] Buttons appropriately sized for touch
  - [ ] No horizontal scrolling needed
  - [ ] Error messages visible

## Dark Mode Testing

- [ ] Enable dark mode in settings/browser
- [ ] **Setup Components**:
  - [ ] Text colors readable
  - [ ] Input fields visible
  - [ ] Buttons properly styled
  - [ ] Icons rendered correctly
  - [ ] Toast notifications visible

- [ ] **UI Elements**:
  - [ ] Step indicator colors appropriate
  - [ ] Success states clearly distinguished
  - [ ] Error states clearly distinguished
  - [ ] Loading spinners visible

## Accessibility Testing

- [ ] **Keyboard Navigation**:
  - [ ] Tab through form fields
  - [ ] Enter key submits form
  - [ ] ESC closes modal (if supported)
  - [ ] Can use Resend button with keyboard

- [ ] **Screen Readers**:
  - [ ] Form labels associated with inputs
  - [ ] Error messages announced
  - [ ] Success messages announced
  - [ ] Button purposes clear

- [ ] **Color Contrast**:
  - [ ] All text meets WCAG AA standards
  - [ ] Buttons distinguishable without color alone
  - [ ] Error messages visible

## Performance Testing

- [ ] **Load Times**:
  - [ ] Components load quickly
  - [ ] No noticeable lag when opening modal
  - [ ] API responses quick (< 2 seconds)

- [ ] **API Call Optimization**:
  - [ ] Only necessary endpoints called
  - [ ] No duplicate API calls
  - [ ] Request cancellation on component unmount

- [ ] **Memory Usage**:
  - [ ] No memory leaks (test in DevTools)
  - [ ] Clean state on component unmount
  - [ ] Proper event listener cleanup

## Error Handling & Edge Cases

- [ ] **Network Errors**:
  - [ ] Network disconnection handled gracefully
  - [ ] Error message displayed to user
  - [ ] Retry mechanism works

- [ ] **Token Expiration**:
  - [ ] Expired token detected
  - [ ] User directed to login
  - [ ] Clear error message shown

- [ ] **Server Errors**:
  - [ ] 500 error displays error message
  - [ ] 400 error displays validation message
  - [ ] Retry button/link available when appropriate

- [ ] **Rate Limiting**:
  - [ ] If API rate limited, shows error
  - [ ] User can retry after delay
  - [ ] Resend button respect rate limits

- [ ] **Concurrent Actions**:
  - [ ] Clicking button multiple times handled
  - [ ] Only one API call per action
  - [ ] UI properly reflects loading state

## Security Verification

- [ ] **Authentication**:
  - [ ] All API calls include Authorization header
  - [ ] Token from localStorage used correctly
  - [ ] Failed auth shows error (no infinite loops)

- [ ] **Input Validation**:
  - [ ] OTP field accepts only numeric input
  - [ ] No code injection possible
  - [ ] Form validation on client-side

- [ ] **Data Privacy**:
  - [ ] No sensitive data in console logs
  - [ ] No passwords/tokens in URLs
  - [ ] API responses handled securely

## Final Checklist

- [ ] All tests passed ✓
- [ ] No console errors or warnings ✓
- [ ] Performance acceptable ✓
- [ ] Mobile responsive ✓
- [ ] Dark mode working ✓
- [ ] Accessibility standards met ✓
- [ ] Security verified ✓
- [ ] Documentation complete ✓
- [ ] Ready for production deployment ✓

## Sign-Off

**Frontend Developer**: _______________ Date: _______

**QA Tester**: _______________ Date: _______

**Product Manager**: _______________ Date: _______

## Deployment Notes

```
Files to Deploy:
✓ Frontend/src/components/security/EmailOTPSetup.jsx
✓ Frontend/src/components/security/EmailOTPVerify.jsx
✓ Frontend/src/pages/UserSettings.jsx (modified)
✓ Frontend/src/pages/Auth.jsx (modified)

Build Command:
cd Frontend && npm run build

Test URL: http://localhost:3000

Rollback Plan:
If issues: Revert the 4 files listed above
```

---

**Created**: April 16, 2026  
**Last Updated**: April 16, 2026  
**Status**: Ready for Testing
