# Email OTP 2FA API Documentation

## Overview
This document describes the Email-based One-Time Password (OTP) API endpoints for Two-Factor Authentication (2FA) in the SmartCity Grievance Redressal System.

Email OTP provides an alternative 2FA method to TOTP (Time-based OTP) via authenticator apps. Users receive 6-digit codes via email for login verification.

## Features
- ✅ 6-digit numeric OTP codes
- ✅ 10-minute validity period (configurable)
- ✅ Maximum 5 verification attempts per OTP (configurable)
- ✅ Email delivery via Nodemailer
- ✅ Can coexist with TOTP method
- ✅ Secure hashing (SHA256)
- ✅ Attempt tracking

## Base URL
```
POST/GET /api/auth/2fa
```

## Authentication
Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Setup Email OTP

**Endpoint**: `POST /api/auth/2fa/email-otp/setup`

**Access**: Private (requires JWT authentication)

**Description**: Initialize email OTP setup. Generates an OTP code and sends it to user's email.

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**: None (empty)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email OTP setup initiated. Check your email for the code.",
  "data": {
    "email": "user@example.com",
    "validityMinutes": 10,
    "maxAttempts": 5
  }
}
```

**Error Responses**:
- 400: Email OTP already enabled
- 404: User not found
- 500: Failed to send OTP email

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/2fa/email-otp/setup \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

---

### 2. Verify and Enable Email OTP

**Endpoint**: `POST /api/auth/2fa/email-otp/verify-setup`

**Access**: Private (requires JWT authentication)

**Description**: Verify the OTP code sent to email and enable email OTP for the user.

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email OTP enabled successfully",
  "data": {
    "email": "user@example.com",
    "enabled": true,
    "enabledAt": "2026-04-16T11:30:00Z"
  }
}
```

**Error Responses**:
- 400: Invalid OTP format, expired OTP, or max attempts exceeded
- 404: User not found or setup not initiated

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/2fa/email-otp/verify-setup \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"otp": "123456"}'
```

---

### 3. Verify Email OTP During Login

**Endpoint**: `POST /api/auth/2fa/email-otp/verify`

**Access**: Public (requires userId)

**Description**: Verify email OTP during the login process. Completes authentication upon successful verification.

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user_mongodb_id",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email OTP verification successful",
  "data": {
    "token": "JWT_AUTH_TOKEN",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2026-04-16T10:00:00Z"
    }
  }
}
```

**Error Responses**:
- 400: Invalid OTP format or invalid OTP code
- 404: User not found
- 500: Server error during verification

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/2fa/email-otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "otp": "123456"
  }'
```

---

### 4. Resend Email OTP

**Endpoint**: `POST /api/auth/2fa/email-otp/resend`

**Access**: Private (requires JWT authentication)

**Description**: Resend the OTP code if the user didn't receive it or it expired.

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**: None (empty)

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP resent successfully. Check your email.",
  "data": {
    "email": "user@example.com",
    "validityMinutes": 10
  }
}
```

**Error Responses**:
- 404: User not found
- 500: Failed to send email

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/2fa/email-otp/resend \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

---

### 5. Get Email OTP Status

**Endpoint**: `GET /api/auth/2fa/email-otp/status`

**Access**: Private (requires JWT authentication)

**Description**: Get the current email OTP status for the authenticated user.

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "enabledAt": "2026-04-16T10:30:00Z",
    "lastSentAt": "2026-04-16T11:30:00Z"
  }
}
```

**Error Responses**:
- 404: User not found
- 500: Server error

**Example**:
```bash
curl -X GET http://localhost:3000/api/auth/2fa/email-otp/status \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

### 6. Disable Email OTP

**Endpoint**: `POST /api/auth/2fa/email-otp/disable`

**Access**: Private (requires JWT authentication)

**Description**: Disable email OTP for the user. Requires password verification for security.

**Request Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "password": "user_password"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email OTP disabled successfully"
}
```

**Error Responses**:
- 400: Email OTP not enabled or password required
- 401: Incorrect password
- 404: User not found
- 500: Server error

**Example**:
```bash
curl -X POST http://localhost:3000/api/auth/2fa/email-otp/disable \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"password": "user_password"}'
```

---

## Environment Variables

Configure these in your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=SmartCity GRS <noreply@smartcity.com>

# Email OTP Configuration (optional)
OTP_VALIDITY_MINUTES=10        # Default: 10 minutes
OTP_MAX_ATTEMPTS=5             # Default: 5 attempts
```

---

## Email OTP Flow

### Setup Flow
1. User requests email OTP setup
2. System generates 6-digit OTP
3. System sends OTP to user's email
4. User receives email with OTP
5. User enters OTP to verify
6. System confirms and enables email OTP

### Login Flow
1. User enters email and password
2. System validates credentials
3. System requests 2FA verification
4. System shows available 2FA methods (TOTP, Email OTP)
5. User chooses Email OTP
6. System sends OTP to email
7. User enters OTP
8. System validates and issues JWT token

### Error Handling
- **Invalid OTP**: Attempts counter increments
- **Expired OTP**: User prompted to request new OTP
- **Max Attempts Exceeded**: User must request new OTP
- **Email Delivery Failed**: User should retry setup

---

## Security Considerations

1. **OTP Hashing**: OTPs are hashed using SHA256 before storage
2. **Expiration**: OTPs expire after 10 minutes
3. **Attempt Limiting**: Maximum 5 failed attempts per OTP
4. **Password Verification**: Password required to disable OTP
5. **Email Validation**: OTP sent only to registered email
6. **SSL/TLS**: Use HTTPS for all API calls
7. **Rate Limiting**: Recommended to implement rate limiting on OTP endpoints

---

## Integration Example (Frontend)

```javascript
// 1. Request OTP setup
const setupResponse = await fetch('/api/auth/2fa/email-otp/setup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

// 2. User receives email and enters OTP
// 3. Verify OTP
const verifyResponse = await fetch('/api/auth/2fa/email-otp/verify-setup', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ otp: '123456' })
});

// During login:
// 1. User logs in with email and password
// 2. System requests 2FA
// 3. User chooses Email OTP
// 4. System sends OTP to email
// 5. Verify OTP
const loginVerifyResponse = await fetch('/api/auth/2fa/email-otp/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: userId,
    otp: '123456'
  })
});

const { token, user } = await loginVerifyResponse.json();
// User is now authenticated
```

---

## Troubleshooting

### OTP not received
1. Check spam/junk folder
2. Verify email address is correct
3. Request new OTP via resend endpoint
4. Check email configuration in `.env`

### "Max attempts exceeded"
1. Request new OTP via resend endpoint
2. Each resend resets the attempt counter

### "OTP expired"
1. OTP valid for 10 minutes
2. Request new OTP via resend endpoint

### Email service not working
1. Verify EMAIL_USER and EMAIL_PASS in `.env`
2. For Gmail, use app-specific password
3. Enable "Less secure apps" if needed
4. Check email provider's SMTP settings

---

## Testing

Run the test suites:

```bash
# Unit tests for email OTP service
npm test test-email-otp.js

# Integration tests
npm test test-email-otp-integration.js
```

---

## Changelog

### v1.0.0 (2026-04-16)
- Initial release
- Email OTP setup, verification, and management
- Coexistence with TOTP method
- Email delivery via Nodemailer
- Attempt tracking and rate limiting
- Comprehensive API documentation

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages
3. Check system logs
4. Contact system administrator

---

## License
SmartCity Grievance Redressal System © 2026
