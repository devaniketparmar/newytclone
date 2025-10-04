
```
mermaid
erDiagram
    USERS ||--o{ CHANNELS : owns
    USERS ||--o{ SUBSCRIPTIONS : subscribes
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ LIKES : creates
    USERS ||--o{ VIEWS : watches
    
    CHANNELS ||--o{ VIDEOS : uploads
    CHANNELS ||--o{ SUBSCRIPTIONS : receives
    
    VIDEOS ||--o{ COMMENTS : has
    VIDEOS ||--o{ LIKES : receives
    VIDEOS ||--o{ VIEWS : gets
    VIDEOS }o--|| CATEGORIES : belongs_to
    VIDEOS ||--o{ VIDEO_TAGS : tagged_with
    
    CATEGORIES ||--o{ VIDEOS : contains
    CATEGORIES ||--o{ CATEGORIES : parent_child
    
    TAGS ||--o{ VIDEO_TAGS : used_in
    PLAYLISTS ||--o{ PLAYLIST_VIDEOS : contains
    VIDEOS ||--o{ PLAYLIST_VIDEOS : included_in
```

## 🗄️ Complete Database Schema

### Core Tables

#### Users Table
```sql
-- Users table for authentication and user management
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
    location VARCHAR(100),
    website_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}'
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_verified ON users(verified);
```

#### Channels Table
```sql
-- Channels table for creator channels
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
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

-- Indexes for channels table
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_custom_url ON channels(custom_url);
CREATE INDEX idx_channels_subscriber_count ON channels(subscriber_count);
CREATE INDEX idx_channels_verified ON channels(verified);
CREATE INDEX idx_channels_created_at ON channels(created_at);
```

#### Categories Table
```sql
-- Categories table for video categorization
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    parent_id INTEGER REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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

-- Indexes for categories table
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(active);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

#### Videos Table
```sql
-- Videos table for video content
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
    scheduled_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    processing_status JSONB DEFAULT '{}'
);

-- Indexes for videos table
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_privacy ON videos(privacy);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_view_count ON videos(view_count);
CREATE INDEX idx_videos_like_count ON videos(like_count);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_title ON videos USING gin(to_tsvector('english', title));
CREATE INDEX idx_videos_description ON videos USING gin(to_tsvector('english', description));
```

### Social Features Tables

#### Subscriptions Table
```sql
-- Subscriptions table for channel subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, channel_id)
);

-- Indexes for subscriptions table
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_channel_id ON subscriptions(channel_id);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);
```

#### Comments Table
```sql
-- Comments table for video comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted'))
);

-- Indexes for comments table
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_status ON comments(status);
```

#### Likes Table
```sql
-- Likes table for video likes/dislikes
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, video_id),
    UNIQUE(user_id, comment_id)
);

-- Indexes for likes table
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_video_id ON likes(video_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);
CREATE INDEX idx_likes_type ON likes(type);
```

#### Views Table
```sql
-- Views table for tracking video views
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    watch_duration INTEGER DEFAULT 0, -- in seconds
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for views table
CREATE INDEX idx_views_video_id ON views(video_id);
CREATE INDEX idx_views_user_id ON views(user_id);
CREATE INDEX idx_views_created_at ON views(created_at);
CREATE INDEX idx_views_ip_address ON views(ip_address);
```

### Content Organization Tables

#### Tags Table
```sql
-- Tags table for video tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for tags table
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count);
```

#### Video Tags Table
```sql
-- Video tags junction table
CREATE TABLE video_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(video_id, tag_id)
);

-- Indexes for video tags table
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
```

#### Playlists Table
```sql
-- Playlists table for video collections
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'unlisted', 'private')),
    video_count INTEGER DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for playlists table
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlists_privacy ON playlists(privacy);
CREATE INDEX idx_playlists_created_at ON playlists(created_at);
```

#### Playlist Videos Table
```sql
-- Playlist videos junction table
CREATE TABLE playlist_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(playlist_id, video_id)
);

-- Indexes for playlist videos table
CREATE INDEX idx_playlist_videos_playlist_id ON playlist_videos(playlist_id);
CREATE INDEX idx_playlist_videos_video_id ON playlist_videos(video_id);
CREATE INDEX idx_playlist_videos_position ON playlist_videos(position);
```

### Analytics Tables

#### Video Analytics Table
```sql
-- Video analytics table for detailed metrics
CREATE TABLE video_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    watch_time INTEGER DEFAULT 0, -- in seconds
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    subscribers_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(video_id, date)
);

-- Indexes for video analytics table
CREATE INDEX idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX idx_video_analytics_date ON video_analytics(date);
CREATE INDEX idx_video_analytics_views ON video_analytics(views);
```

#### Channel Analytics Table
```sql
-- Channel analytics table for channel metrics
CREATE TABLE channel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    watch_time INTEGER DEFAULT 0,
    subscribers_gained INTEGER DEFAULT 0,
    subscribers_lost INTEGER DEFAULT 0,
    videos_published INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(channel_id, date)
);

-- Indexes for channel analytics table
CREATE INDEX idx_channel_analytics_channel_id ON channel_analytics(channel_id);
CREATE INDEX idx_channel_analytics_date ON channel_analytics(date);
CREATE INDEX idx_channel_analytics_views ON channel_analytics(views);
```

### Notification Tables

#### Notifications Table
```sql
-- Notifications table for user notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

## 🔧 Database Optimization

### Query Optimization Strategies
1. **Proper Indexing**: Strategic indexes on frequently queried columns
2. **Composite Indexes**: Multi-column indexes for complex queries
3. **Partial Indexes**: Indexes with WHERE conditions for filtered data
4. **Full-Text Search**: GIN indexes for text search capabilities
5. **Partitioning**: Table partitioning for large tables (views, analytics)

### Performance Considerations
1. **Connection Pooling**: Use connection pools to manage database connections
2. **Query Caching**: Implement query result caching for frequently accessed data
3. **Read Replicas**: Use read replicas for read-heavy operations
4. **Database Sharding**: Shard large tables by user_id or video_id
5. **Archive Strategy**: Archive old analytics data to maintain performance

### Data Integrity
1. **Foreign Key Constraints**: Ensure referential integrity
2. **Check Constraints**: Validate data at the database level
3. **Unique Constraints**: Prevent duplicate data
4. **Triggers**: Use triggers for complex business logic
5. **Transactions**: Use transactions for data consistency

---

*This database schema provides a solid foundation for a scalable video platform with comprehensive social features, analytics, and content organization capabilities.*
