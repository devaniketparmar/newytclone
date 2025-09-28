# Authentication System Flowchart

## 🔐 User Registration Flow

```mermaid
flowchart TD
    A[User Visits Registration Page] --> B[Fill Registration Form]
    B --> C{Validate Input}
    C -->|Invalid| D[Show Validation Errors]
    D --> B
    C -->|Valid| E[Check Email Uniqueness]
    E -->|Email Exists| F[Show Email Already Exists Error]
    F --> B
    E -->|Email Available| G[Check Username Uniqueness]
    G -->|Username Exists| H[Show Username Already Exists Error]
    H --> B
    G -->|Username Available| I[Hash Password with bcrypt]
    I --> J[Create User Record]
    J --> K[Generate Email Verification Token]
    K --> L[Send Verification Email]
    L --> M[Show Success Message]
    M --> N[Redirect to Login Page]
    
    style A fill:#e1f5fe
    style N fill:#c8e6c9
    style D fill:#ffcdd2
    style F fill:#ffcdd2
    style H fill:#ffcdd2
```

## 🔑 User Login Flow

```mermaid
flowchart TD
    A[User Visits Login Page] --> B[Enter Credentials]
    B --> C{Validate Input}
    C -->|Invalid| D[Show Validation Errors]
    D --> B
    C -->|Valid| E[Find User by Email]
    E -->|User Not Found| F[Show Invalid Credentials Error]
    F --> B
    E -->|User Found| G{Check Account Status}
    G -->|Suspended/Deleted| H[Show Account Suspended Error]
    H --> B
    G -->|Active| I[Verify Password]
    I -->|Invalid Password| J[Increment Failed Attempts]
    J --> K{Failed Attempts >= 5}
    K -->|Yes| L[Lock Account Temporarily]
    L --> M[Show Account Locked Error]
    M --> B
    K -->|No| F
    I -->|Valid Password| N{2FA Enabled?}
    N -->|Yes| O[Generate 2FA Code]
    O --> P[Send 2FA Code via SMS/Email]
    P --> Q[Show 2FA Input Page]
    Q --> R[Verify 2FA Code]
    R -->|Invalid| S[Show Invalid 2FA Error]
    S --> Q
    R -->|Valid| T[Generate JWT Token]
    N -->|No| T
    T --> U[Update Last Login]
    U --> V[Set Authentication Cookie]
    V --> W[Redirect to Dashboard]
    
    style A fill:#e1f5fe
    style W fill:#c8e6c9
    style D fill:#ffcdd2
    style F fill:#ffcdd2
    style H fill:#ffcdd2
    style M fill:#ffcdd2
    style S fill:#ffcdd2
```

## 🔄 Password Reset Flow

```mermaid
flowchart TD
    A[User Clicks Forgot Password] --> B[Enter Email Address]
    B --> C{Validate Email}
    C -->|Invalid| D[Show Invalid Email Error]
    D --> B
    C -->|Valid| E[Find User by Email]
    E -->|User Not Found| F[Show Email Not Found Error]
    F --> B
    E -->|User Found| G[Generate Reset Token]
    G --> H[Set Token Expiry 1 Hour]
    H --> I[Send Reset Email]
    I --> J[Show Check Email Message]
    J --> K[User Clicks Reset Link]
    K --> L{Token Valid?}
    L -->|Expired/Invalid| M[Show Invalid/Expired Token Error]
    M --> A
    L -->|Valid| N[Show New Password Form]
    N --> O[Enter New Password]
    O --> P{Validate Password}
    P -->|Invalid| Q[Show Password Validation Error]
    Q --> O
    P -->|Valid| R[Hash New Password]
    R --> S[Update User Password]
    S --> T[Invalidate Reset Token]
    T --> U[Show Success Message]
    U --> V[Redirect to Login]
    
    style A fill:#e1f5fe
    style V fill:#c8e6c9
    style D fill:#ffcdd2
    style F fill:#ffcdd2
    style M fill:#ffcdd2
    style Q fill:#ffcdd2
```

## 🛡️ JWT Token Validation Flow

```mermaid
flowchart TD
    A[API Request with JWT Token] --> B[Extract Token from Header]
    B --> C{Token Present?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Verify Token Signature]
    E -->|Invalid Signature| F[Return 401 Unauthorized]
    E -->|Valid Signature| G{Token Expired?}
    G -->|Yes| H[Return 401 Token Expired]
    G -->|No| I[Extract User ID from Token]
    I --> J[Check User Status in Database]
    J -->|User Suspended/Deleted| K[Return 401 User Inactive]
    J -->|User Active| L[Add User to Request Context]
    L --> M[Continue to Protected Route]
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style D fill:#ffcdd2
    style F fill:#ffcdd2
    style H fill:#ffcdd2
    style K fill:#ffcdd2
```

## 🔐 Two-Factor Authentication Flow

```mermaid
flowchart TD
    A[User Enables 2FA] --> B[Generate Secret Key]
    B --> C[Display QR Code]
    C --> D[User Scans QR Code with Authenticator App]
    D --> E[User Enters Verification Code]
    E --> F{Code Valid?}
    F -->|Invalid| G[Show Invalid Code Error]
    G --> E
    F -->|Valid| H[Save 2FA Secret to Database]
    H --> I[Mark 2FA as Enabled]
    I --> J[Show Backup Codes]
    J --> K[2FA Setup Complete]
    
    L[User Login with 2FA] --> M[Enter Username/Password]
    M --> N[Credentials Valid?]
    N -->|No| O[Show Invalid Credentials]
    O --> M
    N -->|Yes| P[Prompt for 2FA Code]
    P --> Q[User Enters 6-digit Code]
    Q --> R{Code Valid?}
    R -->|Invalid| S[Show Invalid 2FA Code]
    S --> P
    R -->|Valid| T[Generate JWT Token]
    T --> U[Login Successful]
    
    style A fill:#e1f5fe
    style K fill:#c8e6c9
    style L fill:#e1f5fe
    style U fill:#c8e6c9
    style G fill:#ffcdd2
    style O fill:#ffcdd2
    style S fill:#ffcdd2
```

## 🔒 Session Management Flow

```mermaid
flowchart TD
    A[User Login Successful] --> B[Generate Session ID]
    B --> C[Store Session in Redis]
    C --> D[Set HttpOnly Cookie]
    D --> E[Session Active]
    
    F[API Request] --> G[Extract Session ID from Cookie]
    G --> H{Session Exists in Redis?}
    H -->|No| I[Return 401 Unauthorized]
    H -->|Yes| J{Session Expired?}
    J -->|Yes| K[Delete Session from Redis]
    K --> I
    J -->|No| L[Extend Session TTL]
    L --> M[Continue Request]
    
    N[User Logout] --> O[Delete Session from Redis]
    O --> P[Clear Cookie]
    P --> Q[Logout Complete]
    
    R[Session Timeout] --> S[Delete Expired Sessions]
    S --> T[Cleanup Complete]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style M fill:#c8e6c9
    style Q fill:#c8e6c9
    style T fill:#c8e6c9
    style I fill:#ffcdd2
```

## 📊 Security Algorithms

### Password Hashing Algorithm
```typescript
// bcrypt with salt rounds = 12
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: 'user' | 'creator' | 'admin';
  iat: number;
  exp: number;
  sessionId: string;
}
```

### Rate Limiting Algorithm
```typescript
// Token bucket algorithm for rate limiting
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
};
```

---

*This authentication system provides comprehensive security features including registration, login, password reset, 2FA, JWT validation, and session management with proper security measures and rate limiting.*
