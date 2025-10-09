# 🏗️ YouTube Clone - System Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Authentication Flow](#authentication-flow)
8. [Data Flow](#data-flow)
9. [Component Hierarchy](#component-hierarchy)
10. [Deployment Architecture](#deployment-architecture)

---

## 🎯 System Overview

The YouTube Clone is a full-stack web application built with modern technologies, providing video streaming, user management, analytics, and content creation capabilities.

### **Tech Stack**
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local file system (expandable to AWS S3)
- **Charts**: Chart.js / Recharts
- **Deployment**: Docker-ready, Vercel-compatible

---

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                YouTube Clone System                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Frontend      │    │   Backend        │    │   Database       │          │
│  │   (Next.js)     │    │   (API Routes)   │    │   (PostgreSQL)   │          │
│  │                 │    │                 │    │                 │          │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │          │
│  │ │   Pages     │ │    │ │   Auth      │ │    │ │   Users     │ │          │
│  │ │   - Home    │ │◄──►│ │   - JWT     │ │◄──►│ │   - Profile │ │          │
│  │ │   - Studio  │ │    │ │   - Login   │ │    │ │   - Auth    │ │          │
│  │ │   - Channel │ │    │ │   - Signup  │ │    │ │             │ │          │
│  │ │   - Upload  │ │    │ │             │ │    │ └─────────────┘ │          │
│  │ └─────────────┘ │    │ └─────────────┘ │    │                 │          │
│  │                 │    │                 │    │ ┌─────────────┐ │          │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ │  Channels   │ │          │
│  │ │ Components  │ │    │ │   Videos    │ │    │ │ - Metadata  │ │          │
│  │ │ - VideoCard │ │◄──►│ │ - Upload    │ │◄──►│ │ - Settings  │ │          │
│  │ │ - Layout    │ │    │ │ - Stream    │ │    │ │ - Analytics │ │          │
│  │ │ - Analytics │ │    │ │ - Metadata  │ │    │ │             │ │          │
│  │ │ - Charts    │ │    │ │             │ │    │ └─────────────┘ │          │
│  │ └─────────────┘ │    │ └─────────────┘ │    │                 │          │
│  │                 │    │                 │    │ ┌─────────────┐ │          │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ │   Videos    │ │          │
│  │ │   Utils     │ │    │ │ Analytics   │ │    │ │ - Metadata  │ │          │
│  │ │ - Auth      │ │◄──►│ │ - Channel   │ │◄──►│ │ - Files     │ │          │
│  │ │ - ClientAuth│ │    │ │ - Video     │ │    │ │ - Views     │ │          │
│  │ │ - BigInt    │ │    │ │ - Subscribers│ │   │ │ - Comments  │ │          │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ │ - Likes     │ │          │
│  └─────────────────┘    └─────────────────┘    │ └─────────────┘ │          │
│                                                 │                 │          │
│                                                 │ ┌─────────────┐ │          │
│                                                 │ │ Subscribers │ │          │
│                                                 │ │ - User ID   │ │          │
│                                                 │ │ - Channel   │ │          │
│                                                 │ │ - Date      │ │          │
│                                                 │ └─────────────┘ │          │
│                                                 └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### **Page Structure**
```
src/pages/
├── index.tsx                 # Home page with video feed
├── studio.tsx                # YouTube Studio dashboard
├── upload.tsx                # Video upload page
├── channel/
│   └── [id].tsx             # Individual channel page
├── video/
│   └── [id].tsx             # Video watch page
└── api/                     # API routes (Backend)
    ├── auth/
    ├── videos/
    ├── channels/
    └── analytics/
```

### **Component Hierarchy**
```
UniversalLayout
├── Header
│   ├── Logo
│   ├── SearchBar
│   └── UserMenu
├── Sidebar
│   ├── Navigation
│   └── Subscriptions
└── Main Content
    ├── VideoCard
    ├── VideoPlayer
    ├── Comments
    └── AnalyticsDashboard
        ├── Chart
        ├── SubscribersDashboard
        └── VideoAnalytics
```

### **State Management**
```
React Hooks Architecture:
├── useState() - Local component state
├── useEffect() - Side effects & data fetching
├── useContext() - Global state (user, theme)
└── Custom Hooks
    ├── useAuth() - Authentication state
    ├── useVideo() - Video operations
    └── useAnalytics() - Analytics data
```

---

## ⚙️ Backend Architecture

### **API Route Structure**
```
src/pages/api/
├── auth/
│   ├── login.ts             # User authentication
│   ├── signup.ts            # User registration
│   └── logout.ts            # User logout
├── videos/
│   ├── upload.ts            # Video upload endpoint
│   ├── [id].ts             # Video operations
│   └── stream/[id].ts      # Video streaming
├── channels/
│   ├── [id]/
│   │   ├── stats.ts        # Channel statistics
│   │   └── videos.ts       # Channel videos
│   └── create.ts           # Channel creation
├── analytics/
│   ├── channel.ts          # Channel analytics
│   ├── video.ts            # Video analytics
│   └── subscribers.ts      # Subscriber analytics
└── users/
    ├── profile.ts          # User profile
    └── [id].ts             # User operations
```

### **Middleware Stack**
```
Request Flow:
1. CORS Middleware
2. Authentication Middleware (JWT)
3. Rate Limiting
4. Request Validation
5. Business Logic
6. Database Operations
7. Response Serialization
8. Error Handling
```

---

## 🗄️ Database Schema

### **Entity Relationship Diagram**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │  Channels   │    │   Videos    │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │◄──►│ userId (FK) │◄──►│ channelId   │
│ email       │    │ name        │    │ title       │
│ password    │    │ description │    │ description │
│ avatarUrl   │    │ avatarUrl   │    │ thumbnailUrl│
│ createdAt   │    │ createdAt   │    │ videoUrl    │
│ updatedAt   │    │ updatedAt   │    │ duration    │
└─────────────┘    └─────────────┘    │ viewCount   │
       │                   │          │ likeCount   │
       │                   │          │ status      │
       │                   │          │ privacy     │
       │                   │          │ createdAt   │
       │                   │          │ updatedAt   │
       │                   │          └─────────────┘
       │                   │                   │
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Subscriptions│    │    Views    │    │   Comments  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ userId (FK) │    │ userId (FK) │    │ userId (FK) │
│ channelId   │    │ videoId (FK)│    │ videoId (FK)│
│ createdAt   │    │ watchDuration│   │ content     │
└─────────────┘    │ completion%  │    │ createdAt   │
                   │ createdAt   │    │ updatedAt   │
                   └─────────────┘    └─────────────┘
                           │                   │
                           │                   │
                   ┌─────────────┐    ┌─────────────┐
                   │    Likes    │    │   Hashtags  │
                   ├─────────────┤    ├─────────────┤
                   │ id (PK)     │    │ id (PK)     │
                   │ userId (FK) │    │ name        │
                   │ videoId (FK)│    │ createdAt   │
                   │ type        │    └─────────────┘
                   │ createdAt   │
                   └─────────────┘
```

### **Database Tables**
```sql
-- Core Tables
Users (id, username, email, password, avatarUrl, createdAt, updatedAt)
Channels (id, userId, name, description, avatarUrl, createdAt, updatedAt)
Videos (id, channelId, title, description, thumbnailUrl, videoUrl, duration, viewCount, likeCount, commentCount, status, privacy, createdAt, updatedAt)

-- Relationship Tables
Subscriptions (id, userId, channelId, createdAt)
Views (id, userId, videoId, watchDuration, completionPercentage, createdAt)
Comments (id, userId, videoId, content, createdAt, updatedAt)
Likes (id, userId, videoId, type, createdAt)

-- Analytics Tables
ChannelAnalytics (id, channelId, date, views, subscribers, watchTime, revenue)
VideoAnalytics (id, videoId, date, views, uniqueViewers, watchTime, likes, comments, shares)

-- Utility Tables
Hashtags (id, name, createdAt)
VideoHashtags (videoId, hashtagId)
```

---

## 🔌 API Architecture

### **RESTful API Design**
```
Authentication:
POST   /api/auth/login          # User login
POST   /api/auth/signup         # User registration
POST   /api/auth/logout         # User logout

Videos:
GET    /api/videos              # List videos
POST   /api/videos/upload       # Upload video
GET    /api/videos/[id]         # Get video details
GET    /api/videos/stream/[id]  # Stream video
PUT    /api/videos/[id]         # Update video
DELETE /api/videos/[id]         # Delete video

Channels:
GET    /api/channels            # List channels
POST   /api/channels/create     # Create channel
GET    /api/channels/[id]       # Get channel details
GET    /api/channels/[id]/stats # Get channel stats
GET    /api/channels/[id]/videos # Get channel videos

Analytics:
GET    /api/analytics/channel?period=28d&metric=overview
GET    /api/analytics/video?videoId=123&period=28d&metric=overview
GET    /api/analytics/subscribers?period=28d&metric=overview

Users:
GET    /api/users/profile       # Get user profile
PUT    /api/users/profile       # Update user profile
GET    /api/users/[id]          # Get user details
```

### **API Response Format**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2025-01-03T19:15:43.558Z"
}
```

---

## 🔐 Authentication Flow

### **JWT Authentication Process**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
│  (Browser)  │    │ (Next.js)   │    │(PostgreSQL) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Login Request  │                   │
       │─────────────────►│                   │
       │                   │ 2. Validate Creds │
       │                   │─────────────────►│
       │                   │ 3. User Data     │
       │                   │◄─────────────────│
       │ 4. JWT Token      │                   │
       │◄─────────────────│                   │
       │                   │                   │
       │ 5. Store Token    │                   │
       │ (localStorage)    │                   │
       │                   │                   │
       │ 6. API Request    │                   │
       │ (with JWT)        │                   │
       │─────────────────►│                   │
       │                   │ 7. Verify Token   │
       │                   │                   │
       │ 8. API Response   │                   │
       │◄─────────────────│                   │
```

### **Authentication Middleware**
```typescript
// JWT Verification Process
1. Extract token from Authorization header or cookies
2. Verify token signature using secret key
3. Check token expiration
4. Validate token payload (userId, issuer, audience)
5. Fetch user from database
6. Attach user to request object
7. Continue to protected route
```

---

## 📊 Data Flow

### **Video Upload Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │    │   Server    │    │  Database   │    │ File System │
│   Form      │    │   API       │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Form Data      │                   │                   │
       │─────────────────►│                   │                   │
       │                   │ 2. Validate       │                   │
       │                   │                   │                   │
       │                   │ 3. Save Metadata  │                   │
       │                   │─────────────────►│                   │
       │                   │                   │                   │
       │                   │ 4. Save File      │                   │
       │                   │─────────────────────────────────────►│
       │                   │                   │                   │
       │ 5. Success        │                   │                   │
       │◄─────────────────│                   │                   │
```

### **Analytics Data Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Analytics  │    │   Client    │    │   Server    │    │  Database   │
│ Dashboard   │    │   Auth      │    │   API       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Request Data   │                   │                   │
       │─────────────────►│                   │                   │
       │                   │ 2. Auth Request   │                   │
       │                   │─────────────────►│                   │
       │                   │                   │ 3. Query Data    │
       │                   │                   │─────────────────►│
       │                   │                   │ 4. Analytics    │
       │                   │                   │◄─────────────────│
       │                   │ 5. Serialize      │                   │
       │                   │ (BigInt handling) │                   │
       │                   │◄─────────────────│                   │
       │ 6. Render Charts  │                   │                   │
       │◄─────────────────│                   │                   │
```

---

## 🧩 Component Hierarchy

### **Detailed Component Tree**
```
App
└── UniversalLayout
    ├── Header
    │   ├── Logo
    │   ├── SearchBar
    │   └── UserMenu
    │       ├── Profile
    │       ├── Settings
    │       └── Logout
    ├── Sidebar
    │   ├── Navigation
    │   │   ├── Home
    │   │   ├── Trending
    │   │   ├── Subscriptions
    │   │   └── Library
    │   └── Subscriptions
    │       └── ChannelList
    └── Main Content
        ├── Home Page
        │   ├── VideoGrid
        │   └── VideoCard
        │       ├── Thumbnail
        │       ├── Title
        │       ├── Channel
        │       └── Metadata
        ├── Studio Page
        │   ├── QuickStats
        │   ├── NavigationTabs
        │   └── TabContent
        │       ├── Overview
        │       ├── Content
        │       ├── Analytics
        │       │   └── AnalyticsDashboard
        │       │       ├── Chart
        │       │       ├── Metrics
        │       │       └── Filters
        │       ├── Subscribers
        │       │   └── SubscribersDashboard
        │       │       ├── GrowthChart
        │       │       ├── Demographics
        │       │       └── ActivityPatterns
        │       ├── Comments
        │       └── Settings
        ├── Video Page
        │   ├── VideoPlayer
        │   ├── VideoInfo
        │   ├── Comments
        │   └── RelatedVideos
        └── Channel Page
            ├── ChannelHeader
            ├── ChannelTabs
            └── VideoGrid
```

---

## 🚀 Deployment Architecture

### **Production Environment**
```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Environment                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   CDN       │    │   App       │    │  Database   │          │
│  │ (Vercel)    │    │ (Vercel)    │    │(PostgreSQL) │          │
│  │             │    │             │    │             │          │
│  │ Static      │    │ Next.js     │    │ Primary     │          │
│  │ Assets      │◄──►│ App         │◄──►│ Database    │          │
│  │ Images      │    │ API Routes  │    │             │          │
│  │ Videos      │    │ SSR/SSG     │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│           │                   │                   │             │
│           │                   │                   │             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Storage   │    │   Monitoring │    │   Backup    │          │
│  │ (AWS S3)    │    │ (Vercel)     │    │ (Automated) │          │
│  │             │    │             │    │             │          │
│  │ Video       │    │ Analytics   │    │ Daily       │          │
│  │ Files       │    │ Logs        │    │ Backups     │          │
│  │ Thumbnails  │    │ Errors      │    │ Point-in-time│         │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### **Development Environment**
```
┌─────────────────────────────────────────────────────────────────┐
│                      Development Environment                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Local     │    │   Next.js   │    │  Local DB   │          │
│  │   Server    │    │   Dev       │    │(PostgreSQL) │          │
│  │ (Port 3001) │    │   Server    │    │             │          │
│  │             │    │             │    │             │          │
│  │ Hot Reload  │◄──►│ TypeScript  │◄──►│ Development │          │
│  │ File Watch  │    │ Compilation │    │ Data        │          │
│  │             │    │             │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│           │                   │                   │             │
│           │                   │                   │             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Tools     │    │   Linting   │    │   Testing   │          │
│  │             │    │             │    │             │          │
│  │ Prisma      │    │ ESLint      │    │ Jest        │          │
│  │ Studio      │    │ Prettier    │    │ Testing     │          │
│  │ Database    │    │ TypeScript  │    │ Library     │          │
│  │ Manager     │    │ Checks      │    │             │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration & Environment

### **Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/youtube_clone"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# File Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="100MB"

# Analytics
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_CACHE_TTL=300

# Development
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### **Build Configuration**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "ts-node src/scripts/seed-data.ts"
  }
}
```

---

## 📈 Performance & Scalability

### **Performance Optimizations**
```
Frontend:
├── Next.js Image Optimization
├── Code Splitting & Lazy Loading
├── Static Generation (SSG)
├── Server-Side Rendering (SSR)
└── CDN Caching

Backend:
├── Database Query Optimization
├── Connection Pooling
├── API Response Caching
├── BigInt Serialization
└── Error Handling

Database:
├── Indexed Queries
├── Foreign Key Constraints
├── Data Normalization
└── Query Optimization
```

### **Scalability Considerations**
```
Horizontal Scaling:
├── Load Balancers
├── Multiple App Instances
├── Database Replication
└── CDN Distribution

Vertical Scaling:
├── Increased Server Resources
├── Database Optimization
├── Caching Layers
└── Performance Monitoring
```

---

## 🔍 Monitoring & Logging

### **Monitoring Stack**
```
Application Monitoring:
├── Vercel Analytics
├── Error Tracking
├── Performance Metrics
└── User Analytics

Infrastructure Monitoring:
├── Server Health
├── Database Performance
├── API Response Times
└── Error Rates

Logging:
├── Application Logs
├── Error Logs
├── Access Logs
└── Audit Logs
```

---

## 🛡️ Security Architecture

### **Security Measures**
```
Authentication:
├── JWT Token Security
├── Password Hashing (bcrypt)
├── Session Management
└── CSRF Protection

Data Protection:
├── Input Validation
├── SQL Injection Prevention
├── XSS Protection
└── File Upload Security

Infrastructure:
├── HTTPS Enforcement
├── Secure Headers
├── Rate Limiting
└── CORS Configuration
```

---

## 📚 Documentation Structure

### **Documentation Files**
```
docs/
├── README.md                    # Main project documentation
├── API_REFERENCE.md            # API endpoint documentation
├── DEPLOYMENT.md               # Deployment instructions
├── ANALYTICS_README.md         # Analytics system documentation
├── SUBSCRIBERS_README.md       # Subscribers feature documentation
└── ARCHITECTURE.md             # This architecture document

src/
├── components/                 # Component documentation
├── pages/api/                  # API documentation
├── utils/                      # Utility documentation
└── scripts/                    # Script documentation
```

---

## 🎯 Future Roadmap

### **Planned Enhancements**
```
Phase 1 (Current):
✅ Core video functionality
✅ User authentication
✅ Basic analytics
✅ Subscribers management

Phase 2 (Next):
🔄 Live streaming
🔄 Advanced analytics
🔄 Mobile app
🔄 Social features

Phase 3 (Future):
⏳ AI recommendations
⏳ Content moderation
⏳ Monetization
⏳ Multi-language support
```

---

## 📞 Support & Maintenance

### **Development Workflow**
```
1. Feature Development
   ├── Create feature branch
   ├── Implement functionality
   ├── Write tests
   └── Update documentation

2. Code Review
   ├── Pull request creation
   ├── Code review process
   ├── Testing verification
   └── Documentation review

3. Deployment
   ├── Merge to main branch
   ├── Automated testing
   ├── Production deployment
   └── Monitoring verification
```

### **Maintenance Tasks**
```
Daily:
├── Monitor application health
├── Check error logs
└── Review performance metrics

Weekly:
├── Database maintenance
├── Security updates
└── Backup verification

Monthly:
├── Performance optimization
├── Dependency updates
└── Documentation updates
```

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅

---

*This architecture document provides a comprehensive overview of the YouTube Clone system, including all components, data flows, and technical implementations. It serves as a reference for developers, system administrators, and stakeholders.*
