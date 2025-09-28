# YouTube Clone - System Design Documentation

## 📋 Project Overview
This document outlines the system design, architecture, and algorithms for building a scalable YouTube clone web application using Next.js, TypeScript, and Tailwind CSS.

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
│   - React       │    │   - Auth        │    │   - Users       │
│   - Tailwind    │    │   - Video API   │    │   - Videos      │
│   - TypeScript  │    │   - File Upload │    │   - Analytics   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Storage   │    │   Video         │    │   Cache Layer   │
│   (AWS S3)      │    │   Processing    │    │   (Redis)       │
│   - Videos      │    │   (FFmpeg)      │    │   - Sessions    │
│   - Thumbnails  │    │   - Transcoding │    │   - API Cache   │
│   - Images      │    │   - Compression │    │   - Rate Limit  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript, Tailwind CSS 4.0
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3 + CloudFront CDN
- **Video Processing**: FFmpeg
- **Cache**: Redis
- **Search**: Elasticsearch
- **Monitoring**: Sentry, Analytics

---

## 🗄️ Database Schema Design

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Channels Table
```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    custom_url VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    banner_url TEXT,
    trailer_video_id UUID,
    subscriber_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_custom_url ON channels(custom_url);
CREATE INDEX idx_channels_subscriber_count ON channels(subscriber_count);
```

#### Videos Table
```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in seconds
    file_size BIGINT NOT NULL,
    resolution VARCHAR(10), -- 1080p, 720p, etc.
    category_id INTEGER REFERENCES categories(id),
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'unlisted', 'private')),
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    view_count BIGINT DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_privacy ON videos(privacy);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_view_count ON videos(view_count);
```

#### Categories Table
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('Music', 'Music videos, songs, and audio content', 1),
('Gaming', 'Video game content, streams, and reviews', 2),
('Education', 'Educational content, tutorials, and courses', 3),
('Entertainment', 'Comedy, shows, and entertainment content', 4),
('News & Politics', 'News, current events, and political content', 5),
('How-to & Style', 'Tutorials, DIY, and lifestyle content', 6),
('Science & Technology', 'Science, tech reviews, and innovations', 7),
('Sports', 'Sports content, highlights, and analysis', 8),
('Travel & Events', 'Travel vlogs, events, and experiences', 9),
('Autos & Vehicles', 'Car reviews, automotive content', 10),
('Comedy', 'Comedy sketches, stand-up, and humor', 11),
('Film & Animation', 'Movies, animations, and film content', 12),
('People & Blogs', 'Vlogs, personal content, and blogs', 13),
('Pets & Animals', 'Pet content, animal videos, and wildlife', 14),
('Nonprofits & Activism', 'Charity, activism, and social causes', 15);
```

---

## 🔐 Authentication System Design

### Authentication Flow
```
User Registration/Login Flow:
1. User submits credentials
2. Validate input (email format, password strength)
3. Hash password with bcrypt
4. Check for existing user
5. Create user record in database
6. Generate JWT token
7. Send verification email (if registration)
8. Return success response with token
```

### Password Security Algorithm
```typescript
// Password hashing with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const isValidPassword = passwordRegex.test(password);
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
}
```

---

## 🎥 Video Processing Pipeline

### Video Upload Flow
```
1. User selects video file
2. Client-side validation (file size, format)
3. Generate pre-signed S3 URL
4. Upload video to S3
5. Create video record in database
6. Queue video processing job
7. Process video with FFmpeg:
   - Generate thumbnails
   - Create multiple resolutions
   - Extract metadata
   - Compress video
8. Update video status to 'ready'
9. Notify user of completion
```

### Video Processing Algorithm
```typescript
interface VideoProcessingJob {
  videoId: string;
  s3Key: string;
  resolutions: string[];
  thumbnailCount: number;
}

const processVideo = async (job: VideoProcessingJob) => {
  const resolutions = ['360p', '480p', '720p', '1080p'];
  
  for (const resolution of resolutions) {
    await ffmpeg()
      .input(`s3://bucket/${job.s3Key}`)
      .outputOptions([
        `-vf scale=${getResolutionDimensions(resolution)}`,
        '-c:v libx264',
        '-c:a aac',
        '-preset fast',
        '-crf 23'
      ])
      .output(`s3://bucket/${job.videoId}/${resolution}.mp4`)
      .run();
  }
  
  // Generate thumbnails
  await generateThumbnails(job.videoId, job.thumbnailCount);
};
```

---

## 🔍 Search & Discovery Algorithm

### Video Recommendation Algorithm
```typescript
interface RecommendationEngine {
  // Collaborative Filtering
  getUserSimilarity(userId: string): Promise<User[]>;
  
  // Content-Based Filtering
  getContentSimilarity(videoId: string): Promise<Video[]>;
  
  // Hybrid Approach
  getRecommendations(userId: string): Promise<Video[]>;
}

const getRecommendations = async (userId: string): Promise<Video[]> => {
  const userHistory = await getUserWatchHistory(userId);
  const userPreferences = await getUserPreferences(userId);
  
  // Weighted scoring
  const scores = await Promise.all([
    collaborativeFiltering(userId),
    contentBasedFiltering(userHistory),
    trendingVideos(),
    categoryBasedRecommendations(userPreferences.categories)
  ]);
  
  return combineAndRankRecommendations(scores);
};
```

### Search Algorithm
```typescript
interface SearchEngine {
  search(query: string, filters: SearchFilters): Promise<SearchResults>;
  autocomplete(query: string): Promise<string[]>;
  trending(): Promise<Video[]>;
}

const searchVideos = async (query: string, filters: SearchFilters) => {
  const searchTerms = parseSearchQuery(query);
  const elasticsearchQuery = {
    bool: {
      must: [
        {
          multi_match: {
            query: searchTerms.join(' '),
            fields: ['title^3', 'description^2', 'tags^2'],
            type: 'best_fields'
          }
        }
      ],
      filter: buildFilters(filters)
    }
  };
  
  return await elasticsearch.search(searchParams);
};
```

---

## 📊 Analytics & Metrics

### Real-time Analytics
```typescript
interface AnalyticsEngine {
  trackView(videoId: string, userId: string): Promise<void>;
  trackEngagement(videoId: string, action: string): Promise<void>;
  getVideoAnalytics(videoId: string): Promise<VideoAnalytics>;
  getChannelAnalytics(channelId: string): Promise<ChannelAnalytics>;
}

const trackView = async (videoId: string, userId: string) => {
  // Increment view count
  await db.videos.update({
    where: { id: videoId },
    data: { view_count: { increment: 1 } }
  });
  
  // Track user view
  await db.views.create({
    data: {
      video_id: videoId,
      user_id: userId,
      viewed_at: new Date(),
      watch_duration: 0 // Updated on video end
    }
  });
  
  // Update recommendations
  await updateUserPreferences(userId, videoId);
};
```

---

## 🚀 Scalability Considerations

### Horizontal Scaling
- **Load Balancers**: AWS Application Load Balancer
- **Microservices**: Separate services for auth, video processing, analytics
- **Database Sharding**: Shard by user_id or video_id
- **CDN**: CloudFront for global content delivery
- **Caching**: Redis for session and API caching

### Performance Optimization
- **Database Indexing**: Optimized indexes for common queries
- **Query Optimization**: Efficient SQL queries with proper joins
- **Image Optimization**: WebP format, responsive images
- **Video Streaming**: Adaptive bitrate streaming
- **Lazy Loading**: Component and image lazy loading

### Monitoring & Observability
- **Application Monitoring**: Sentry for error tracking
- **Performance Monitoring**: Web Vitals tracking
- **Database Monitoring**: Query performance and slow queries
- **Infrastructure Monitoring**: Server metrics and alerts
- **User Analytics**: User behavior and engagement metrics

---

## 🔒 Security Measures

### Data Protection
- **Encryption**: AES-256 for sensitive data
- **HTTPS**: SSL/TLS for all communications
- **Input Validation**: Sanitize all user inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

### Access Control
- **Role-Based Access**: User, Creator, Admin roles
- **API Rate Limiting**: Prevent abuse and DDoS
- **File Upload Security**: Validate file types and sizes
- **Session Management**: Secure session handling
- **Two-Factor Authentication**: Optional 2FA for users

---

## 📱 Mobile & Responsive Design

### Responsive Breakpoints
```css
/* Tailwind CSS breakpoints */
sm: '640px',   /* Mobile landscape */
md: '768px',   /* Tablet */
lg: '1024px',  /* Desktop */
xl: '1280px',  /* Large desktop */
2xl: '1536px'  /* Extra large desktop */
```

### Mobile-First Approach
- Touch-friendly interface elements
- Optimized video player for mobile
- Progressive Web App (PWA) features
- Offline functionality for downloaded content
- Mobile-specific navigation patterns

---

## 🧪 Testing Strategy

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Playwright)
  /____\    
 /      \   Integration Tests (Jest)
/________\  
/          \ Unit Tests (Jest + Testing Library)
/____________\
```

### Test Coverage Goals
- **Unit Tests**: 90%+ coverage for utilities and components
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Critical user journeys and workflows
- **Performance Tests**: Load testing and stress testing
- **Security Tests**: Penetration testing and vulnerability scanning

---

*This system design provides a comprehensive foundation for building a scalable, secure, and performant YouTube clone application.*
