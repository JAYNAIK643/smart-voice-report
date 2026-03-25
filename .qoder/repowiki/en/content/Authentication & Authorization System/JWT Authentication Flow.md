# JWT Authentication Flow

<cite>
**Referenced Files in This Document**
- [authController.js](file://backend/src/controllers/authController.js)
- [authMiddleware.js](file://backend/src/middleware/authMiddleware.js)
- [authRoutes.js](file://backend/src/routes/authRoutes.js)
- [authService.js](file://frontend/src/services/authService.js)
- [auth-context.jsx](file://frontend/src/context/auth-context.jsx)
- [Auth.jsx](file://frontend/src/pages/Auth.jsx)
- [User.js](file://backend/src/models/User.js)
- [Admin.js](file://backend/src/models/Admin.js)
- [WardAdmin.js](file://backend/src/models/WardAdmin.js)
- [twoFactorAuthService.js](file://backend/src/services/twoFactorAuthService.js)
- [TwoFactorVerify.jsx](file://frontend/src/components/security/TwoFactorVerify.jsx)
- [TwoFactorSetup.jsx](file://frontend/src/components/security/TwoFactorSetup.jsx)
- [WardAdminLogin.jsx](file://frontend/src/pages/WardAdminLogin.jsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the JWT authentication flow implementation. It covers token generation, payload structure, signing with JWT_SECRET, expiration handling, secure storage in frontend applications, authentication middleware, role-based access control, token refresh strategies, logout mechanisms, and security considerations. Practical examples demonstrate token usage in API requests, frontend authentication state management, and error handling for expired or invalid tokens.

## Project Structure
The authentication system spans both backend and frontend:
- Backend: Express routes, controllers, middleware, and models implement JWT token generation, validation, and role-based authorization.
- Frontend: Services manage token storage and retrieval, while context providers coordinate authentication state and UI flows.

```mermaid
graph TB
subgraph "Frontend"
FE_AuthService["authService.js<br/>Fetch-based API client"]
FE_AuthContext["auth-context.jsx<br/>React Context Provider"]
FE_AuthPage["Auth.jsx<br/>Login/Signup UI"]
FE_2FA_Verify["TwoFactorVerify.jsx<br/>2FA verification UI"]
FE_2FA_Setup["TwoFactorSetup.jsx<br/>2FA setup UI"]
FE_WardAdminLogin["WardAdminLogin.jsx<br/>Ward Admin login UI"]
end
subgraph "Backend"
BE_Routes["authRoutes.js<br/>Express routes"]
BE_Controller["authController.js<br/>Token generation & login logic"]
BE_Middleware["authMiddleware.js<br/>JWT validation & authorization"]
BE_Models["Models<br/>User/Admin/WardAdmin"]
BE_2FA_Service["twoFactorAuthService.js<br/>TOTP & backup codes"]
end
FE_AuthService --> BE_Routes
FE_AuthContext --> FE_AuthPage
FE_AuthPage --> FE_AuthService
FE_2FA_Verify --> BE_Routes
FE_2FA_Setup --> BE_Routes
FE_WardAdminLogin --> FE_AuthService
BE_Routes --> BE_Controller
BE_Controller --> BE_Middleware
BE_Controller --> BE_Models
BE_Controller --> BE_2FA_Service
BE_Middleware --> BE_Models
```

**Diagram sources**
- [authRoutes.js:1-10](file://backend/src/routes/authRoutes.js#L1-L10)
- [authController.js:1-237](file://backend/src/controllers/authController.js#L1-L237)
- [authMiddleware.js:1-114](file://backend/src/middleware/authMiddleware.js#L1-L114)
- [authService.js:1-99](file://frontend/src/services/authService.js#L1-L99)
- [auth-context.jsx:1-143](file://frontend/src/context/auth-context.jsx#L1-L143)
- [Auth.jsx:1-443](file://frontend/src/pages/Auth.jsx#L1-L443)
- [TwoFactorVerify.jsx:1-200](file://frontend/src/components/security/TwoFactorVerify.jsx#L1-L200)
- [TwoFactorSetup.jsx:1-395](file://frontend/src/components/security/TwoFactorSetup.jsx#L1-L395)
- [WardAdminLogin.jsx:1-170](file://frontend/src/pages/WardAdminLogin.jsx#L1-L170)
- [User.js:1-165](file://backend/src/models/User.js#L1-L165)
- [Admin.js:1-55](file://backend/src/models/Admin.js#L1-L55)
- [WardAdmin.js:1-61](file://backend/src/models/WardAdmin.js#L1-L61)
- [twoFactorAuthService.js:1-152](file://backend/src/services/twoFactorAuthService.js#L1-L152)

**Section sources**
- [authRoutes.js:1-10](file://backend/src/routes/authRoutes.js#L1-L10)
- [authController.js:1-237](file://backend/src/controllers/authController.js#L1-L237)
- [authMiddleware.js:1-114](file://backend/src/middleware/authMiddleware.js#L1-L114)
- [authService.js:1-99](file://frontend/src/services/authService.js#L1-L99)
- [auth-context.jsx:1-143](file://frontend/src/context/auth-context.jsx#L1-L143)
- [Auth.jsx:1-443](file://frontend/src/pages/Auth.jsx#L1-L443)
- [TwoFactorVerify.jsx:1-200](file://frontend/src/components/security/TwoFactorVerify.jsx#L1-L200)
- [TwoFactorSetup.jsx:1-395](file://frontend/src/components/security/TwoFactorSetup.jsx#L1-L395)
- [WardAdminLogin.jsx:1-170](file://frontend/src/pages/WardAdminLogin.jsx#L1-L170)
- [User.js:1-165](file://backend/src/models/User.js#L1-L165)
- [Admin.js:1-55](file://backend/src/models/Admin.js#L1-L55)
- [WardAdmin.js:1-61](file://backend/src/models/WardAdmin.js#L1-L61)
- [twoFactorAuthService.js:1-152](file://backend/src/services/twoFactorAuthService.js#L1-L152)

## Core Components
- Backend JWT Generation and Validation:
  - Token payload includes user ID, role, and ward information for ward admins.
  - Tokens are signed using JWT_SECRET with a 7-day expiration.
  - Authentication middleware verifies tokens and attaches user context to requests.
  - Role-based authorization restricts access to resources.
- Frontend Authentication State Management:
  - authService persists tokens and user data in localStorage.
  - auth-context manages global authentication state and exposes role checks.
  - Auth and WardAdminLogin pages orchestrate login/signup flows and redirects.
  - TwoFactorVerify and TwoFactorSetup handle mandatory 2FA enforcement.

**Section sources**
- [authController.js:58-84](file://backend/src/controllers/authController.js#L58-L84)
- [authController.js:192-202](file://backend/src/controllers/authController.js#L192-L202)
- [authMiddleware.js:10-55](file://backend/src/middleware/authMiddleware.js#L10-L55)
- [authMiddleware.js:61-71](file://backend/src/middleware/authMiddleware.js#L61-L71)
- [authMiddleware.js:77-104](file://backend/src/middleware/authMiddleware.js#L77-L104)
- [authService.js:25-28](file://frontend/src/services/authService.js#L25-L28)
- [authService.js:70-73](file://frontend/src/services/authService.js#L70-L73)
- [auth-context.jsx:18-27](file://frontend/src/context/auth-context.jsx#L18-L27)
- [auth-context.jsx:43-72](file://frontend/src/context/auth-context.jsx#L43-L72)
- [auth-context.jsx:74-78](file://frontend/src/context/auth-context.jsx#L74-L78)

## Architecture Overview
The authentication flow integrates frontend services, backend routes/controllers, middleware, and models. Tokens are generated upon successful registration/login and validated on protected routes. Role-based access control ensures appropriate permissions. Mandatory 2FA adds an additional security layer.

```mermaid
sequenceDiagram
participant Client as "Frontend App"
participant AuthUI as "Auth.jsx"
participant AuthService as "authService.js"
participant Routes as "authRoutes.js"
participant Controller as "authController.js"
participant JWT as "jsonwebtoken"
participant Models as "User/Admin/WardAdmin"
participant MW as "authMiddleware.js"
Client->>AuthUI : "User submits login form"
AuthUI->>AuthService : "login(email, password, role)"
AuthService->>Routes : "POST /api/auth/login"
Routes->>Controller : "login()"
Controller->>Models : "Find user/admin/ward admin by email"
Controller->>Controller : "Verify password & role checks"
Controller->>JWT : "sign(payload, JWT_SECRET, { expiresIn : '7d' })"
JWT-->>Controller : "token"
Controller-->>AuthService : "{ token, user }"
AuthService->>AuthService : "localStorage.setItem('authToken', token)"
AuthService-->>AuthUI : "{ success : true, data }"
AuthUI->>AuthUI : "Redirect based on role"
Note over Client,MW : "Subsequent requests include Authorization : Bearer token"
Client->>MW : "Request with Bearer token"
MW->>JWT : "verify(token, JWT_SECRET)"
JWT-->>MW : "decoded payload"
MW->>Models : "Load user by role-specific collection"
MW-->>Client : "Attach req.user and allow access"
```

**Diagram sources**
- [authController.js:90-237](file://backend/src/controllers/authController.js#L90-L237)
- [authMiddleware.js:10-55](file://backend/src/middleware/authMiddleware.js#L10-L55)
- [authRoutes.js:1-10](file://backend/src/routes/authRoutes.js#L1-L10)
- [authService.js:37-80](file://frontend/src/services/authService.js#L37-L80)
- [Auth.jsx:102-150](file://frontend/src/pages/Auth.jsx#L102-L150)

## Detailed Component Analysis

### Token Generation and Payload Structure
- Payload fields:
  - id: MongoDB ObjectId of the authenticated user/admin.
  - role: One of admin, ward_admin, or user.
  - ward: Present for ward_admin; included in user response for completeness.
- Signing and expiration:
  - Signed with JWT_SECRET from environment variables.
  - Expires in 7 days for standard login/register flows.
- 2FA setup token:
  - A short-lived token (15 minutes) is issued when 2FA setup is required.

```mermaid
flowchart TD
Start(["Login/Register Request"]) --> FindUser["Find user/admin/ward admin by email"]
FindUser --> ValidatePwd{"Password valid?"}
ValidatePwd --> |No| ReturnError["Return 401 Unauthorized"]
ValidatePwd --> |Yes| RoleCheck{"Role validation"}
RoleCheck --> |Denied| Return403["Return 403 Forbidden"]
RoleCheck --> |Allowed| BuildPayload["Build payload {id, role, ward}"]
BuildPayload --> SignToken["jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })"]
SignToken --> ReturnToken["Return { token, user }"]
ReturnToken --> End(["Client stores token"])
```

**Diagram sources**
- [authController.js:90-237](file://backend/src/controllers/authController.js#L90-L237)
- [authController.js:58-84](file://backend/src/controllers/authController.js#L58-L84)
- [authController.js:192-202](file://backend/src/controllers/authController.js#L192-L202)
- [authController.js:153-177](file://backend/src/controllers/authController.js#L153-L177)

**Section sources**
- [authController.js:58-84](file://backend/src/controllers/authController.js#L58-L84)
- [authController.js:192-202](file://backend/src/controllers/authController.js#L192-L202)
- [authController.js:153-177](file://backend/src/controllers/authController.js#L153-L177)

### Authentication Middleware
- Validates Authorization header format and extracts Bearer token.
- Verifies token signature using JWT_SECRET.
- Loads user from the appropriate collection based on role in the token.
- Enforces account activation and attaches user context to req.user.
- Provides role-based authorization and ward-based access control for ward_admin.

```mermaid
flowchart TD
ReqStart(["Incoming Request"]) --> CheckAuthHeader["Check Authorization header"]
CheckAuthHeader --> |Missing| Return401a["401 Authorization token missing"]
CheckAuthHeader --> |Present| ExtractToken["Extract token after 'Bearer '"]
ExtractToken --> VerifyJWT["jwt.verify(token, JWT_SECRET)"]
VerifyJWT --> |Invalid/expired| Return401b["401 Invalid or expired token"]
VerifyJWT --> LoadUser["Load user by role-specific collection"]
LoadUser --> ActiveCheck{"isActive?"}
ActiveCheck --> |No| Return403["403 Account disabled"]
ActiveCheck --> |Yes| AttachUser["Attach req.user and continue"]
AttachUser --> Next(["Call next()"])
```

**Diagram sources**
- [authMiddleware.js:10-55](file://backend/src/middleware/authMiddleware.js#L10-L55)

**Section sources**
- [authMiddleware.js:10-55](file://backend/src/middleware/authMiddleware.js#L10-L55)
- [authMiddleware.js:61-71](file://backend/src/middleware/authMiddleware.js#L61-L71)
- [authMiddleware.js:77-104](file://backend/src/middleware/authMiddleware.js#L77-L104)

### Frontend Authentication State Management
- authService:
  - Stores tokens and user data in localStorage upon successful login/register.
  - Exposes helpers to retrieve tokens, user info, and authentication status.
- auth-context:
  - Initializes authentication state from localStorage.
  - Provides sign-in/sign-out flows and role-based flags.
  - Listens to storage events to keep UI synchronized.
- Auth and WardAdminLogin:
  - Orchestrate login/signup, handle 2FA prompts, and redirect based on role.

```mermaid
sequenceDiagram
participant UI as "Auth.jsx"
participant Ctx as "auth-context.jsx"
participant Svc as "authService.js"
participant Local as "localStorage"
UI->>Ctx : "signIn(email, password, role)"
Ctx->>Svc : "login()"
Svc->>Svc : "fetch POST /api/auth/login"
Svc->>Local : "setItem('authToken', token)"
Svc->>Local : "setItem('user', user)"
Svc-->>Ctx : "{ success : true, data }"
Ctx->>Ctx : "setUser(data.user)"
Ctx-->>UI : "Authenticated state updated"
```

**Diagram sources**
- [authService.js:37-80](file://frontend/src/services/authService.js#L37-L80)
- [auth-context.jsx:43-72](file://frontend/src/context/auth-context.jsx#L43-L72)
- [Auth.jsx:102-150](file://frontend/src/pages/Auth.jsx#L102-L150)

**Section sources**
- [authService.js:25-28](file://frontend/src/services/authService.js#L25-L28)
- [authService.js:70-73](file://frontend/src/services/authService.js#L70-L73)
- [auth-context.jsx:18-27](file://frontend/src/context/auth-context.jsx#L18-L27)
- [auth-context.jsx:43-72](file://frontend/src/context/auth-context.jsx#L43-L72)
- [Auth.jsx:102-150](file://frontend/src/pages/Auth.jsx#L102-L150)

### Token Usage in API Requests
- Frontend:
  - Uses Authorization header with Bearer token for authenticated requests.
  - Example: Authorization: Bearer <token>.
- Backend:
  - authMiddleware extracts and validates the token.
  - Protected routes apply role and ward-based authorization.

**Section sources**
- [authMiddleware.js:10-55](file://backend/src/middleware/authMiddleware.js#L10-L55)
- [authService.js:37-80](file://frontend/src/services/authService.js#L37-L80)

### Logout Mechanisms
- Frontend:
  - Removes authToken and user from localStorage.
  - Clears authentication state in context.
- Backend:
  - No server-side session invalidation; token remains valid until expiration.

**Section sources**
- [authService.js:82-85](file://frontend/src/services/authService.js#L82-L85)
- [auth-context.jsx:74-78](file://frontend/src/context/auth-context.jsx#L74-L78)

### Token Refresh Strategies
- Current implementation:
  - Tokens expire in 7 days; no automatic refresh endpoint is implemented.
  - Frontend relies on storing the token locally for subsequent authenticated requests.
- Recommendations:
  - Implement a dedicated refresh endpoint that issues a new JWT with the same claims.
  - Use a separate refresh token stored securely (e.g., HttpOnly cookie) to minimize exposure.
  - Apply sliding expiration or rolling tokens to balance security and UX.

[No sources needed since this section provides general guidance]

### Security Considerations
- JWT_SECRET:
  - Must be kept secret and rotated periodically.
  - Should be configured via environment variables on both frontend build and backend runtime.
- Token Storage:
  - Frontend stores tokens in localStorage; consider HttpOnly cookies for higher security.
  - Implement SameSite and Secure attributes for cookies if used.
- 2FA Enforcement:
  - Mandatory 2FA for all users on login attempts.
  - Backup codes are handled securely; ensure proper hashing and one-time use policies.
- Role-Based Access Control:
  - authMiddleware enforces role-based authorization.
  - authorizeWardAccess restricts ward_admin access to their assigned ward.

**Section sources**
- [authController.js:153-177](file://backend/src/controllers/authController.js#L153-L177)
- [authMiddleware.js:61-71](file://backend/src/middleware/authMiddleware.js#L61-L71)
- [authMiddleware.js:77-104](file://backend/src/middleware/authMiddleware.js#L77-L104)
- [twoFactorAuthService.js:125-135](file://backend/src/services/twoFactorAuthService.js#L125-L135)

### Error Handling for Expired or Invalid Tokens
- Backend:
  - Returns 401 for missing/invalid/expired tokens.
  - Returns 403 for disabled accounts.
- Frontend:
  - Displays user-friendly messages for network errors and role mismatches.
  - Clears local storage on logout and resets authentication state.

**Section sources**
- [authMiddleware.js:13-15](file://backend/src/middleware/authMiddleware.js#L13-L15)
- [authMiddleware.js:52-54](file://backend/src/middleware/authMiddleware.js#L52-L54)
- [authService.js:31-34](file://frontend/src/services/authService.js#L31-L34)
- [Auth.jsx:118-132](file://frontend/src/pages/Auth.jsx#L118-L132)

## Dependency Analysis
The authentication system exhibits clear separation of concerns:
- Routes depend on controllers for business logic.
- Controllers depend on models for data access and twoFactorAuthService for 2FA operations.
- Middleware depends on models and JWT library for validation and authorization.
- Frontend services depend on backend endpoints and localStorage for state persistence.

```mermaid
graph LR
Routes["authRoutes.js"] --> Controller["authController.js"]
Controller --> Models["User/Admin/WardAdmin"]
Controller --> TwoFA["twoFactorAuthService.js"]
Controller --> JWT["jsonwebtoken"]
MW["authMiddleware.js"] --> Models
MW --> JWT
FE_Svc["authService.js"] --> Routes
FE_Ctx["auth-context.jsx"] --> FE_Svc
FE_UI["Auth.jsx"] --> FE_Ctx
```

**Diagram sources**
- [authRoutes.js:1-10](file://backend/src/routes/authRoutes.js#L1-L10)
- [authController.js:1-237](file://backend/src/controllers/authController.js#L1-L237)
- [authMiddleware.js:1-114](file://backend/src/middleware/authMiddleware.js#L1-L114)
- [authService.js:1-99](file://frontend/src/services/authService.js#L1-L99)
- [auth-context.jsx:1-143](file://frontend/src/context/auth-context.jsx#L1-L143)
- [Auth.jsx:1-443](file://frontend/src/pages/Auth.jsx#L1-L443)
- [User.js:1-165](file://backend/src/models/User.js#L1-L165)
- [Admin.js:1-55](file://backend/src/models/Admin.js#L1-L55)
- [WardAdmin.js:1-61](file://backend/src/models/WardAdmin.js#L1-L61)
- [twoFactorAuthService.js:1-152](file://backend/src/services/twoFactorAuthService.js#L1-L152)

**Section sources**
- [authRoutes.js:1-10](file://backend/src/routes/authRoutes.js#L1-L10)
- [authController.js:1-237](file://backend/src/controllers/authController.js#L1-L237)
- [authMiddleware.js:1-114](file://backend/src/middleware/authMiddleware.js#L1-L114)
- [authService.js:1-99](file://frontend/src/services/authService.js#L1-L99)
- [auth-context.jsx:1-143](file://frontend/src/context/auth-context.jsx#L1-L143)
- [Auth.jsx:1-443](file://frontend/src/pages/Auth.jsx#L1-L443)
- [User.js:1-165](file://backend/src/models/User.js#L1-L165)
- [Admin.js:1-55](file://backend/src/models/Admin.js#L1-L55)
- [WardAdmin.js:1-61](file://backend/src/models/WardAdmin.js#L1-L61)
- [twoFactorAuthService.js:1-152](file://backend/src/services/twoFactorAuthService.js#L1-L152)

## Performance Considerations
- Token verification occurs on every protected request; ensure JWT_SECRET is cached appropriately and avoid unnecessary re-hashing.
- Model queries in authMiddleware should leverage indexes on email and role fields to minimize lookup times.
- Consider implementing token blacklisting or short-lived access tokens with refresh tokens to reduce long-lived token exposure.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Common Issues:
  - Missing Authorization header: Ensure frontend sends Authorization: Bearer <token>.
  - Invalid or expired token: Re-authenticate the user; tokens expire in 7 days.
  - Disabled account: Contact administrator to enable the account.
  - Role mismatch: Verify the role passed during login matches the intended portal.
- Frontend Tips:
  - Check localStorage for authToken and user entries.
  - Use browser devtools to inspect network requests and responses.
  - Confirm backend is running and reachable at the configured API URL.

**Section sources**
- [authMiddleware.js:13-15](file://backend/src/middleware/authMiddleware.js#L13-L15)
- [authMiddleware.js:52-54](file://backend/src/middleware/authMiddleware.js#L52-L54)
- [authService.js:31-34](file://frontend/src/services/authService.js#L31-L34)
- [Auth.jsx:118-132](file://frontend/src/pages/Auth.jsx#L118-L132)

## Conclusion
The JWT authentication flow integrates robust token generation, validation, and role-based authorization with mandatory 2FA enforcement. Frontend services and context providers manage authentication state seamlessly, while backend middleware ensures secure access to protected resources. For enhanced security and scalability, consider implementing token refresh strategies, secure token storage, and periodic JWT_SECRET rotation.