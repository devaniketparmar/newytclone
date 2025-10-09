# YouTube Studio Analytics System

## Overview

The YouTube Studio Analytics system provides comprehensive analytics and insights for content creators, similar to YouTube's Creator Studio. It includes both channel-level and video-level analytics with detailed metrics, charts, and insights.

## Features

### 🎯 Channel Analytics
- **Overview Dashboard**: Key metrics including total views, subscribers, videos, and engagement
- **Views Analytics**: Detailed view tracking over time with hourly and daily breakdowns
- **Subscriber Analytics**: Subscriber growth tracking with gained/lost metrics
- **Watch Time Analytics**: Total watch time and average watch time per view
- **Engagement Analytics**: Likes, comments, and engagement rate tracking
- **Revenue Analytics**: Monetization tracking (placeholder for future implementation)
- **Demographics Analytics**: Audience demographics (placeholder for future implementation)
- **Traffic Analytics**: Traffic source analysis

### 📊 Video Analytics
- **Video Overview**: Individual video performance metrics
- **Views Tracking**: Detailed view analytics with hourly breakdowns
- **Engagement Metrics**: Likes, comments, shares, and engagement rates
- **Retention Analysis**: Watch time retention and completion rates
- **Comments Analytics**: Comment activity and engagement
- **Traffic Sources**: How viewers discover your videos

### 📈 Data Visualization
- **Interactive Charts**: Line charts, bar charts, and area charts
- **Real-time Updates**: Live data refresh capabilities
- **Period Selection**: 7 days, 28 days, 90 days, and 1 year views
- **Responsive Design**: Mobile-friendly analytics dashboard

## API Endpoints

### Channel Analytics
```
GET /api/analytics/channel?period=28d&metric=overview
GET /api/analytics/channel?period=28d&metric=views
GET /api/analytics/channel?period=28d&metric=subscribers
GET /api/analytics/channel?period=28d&metric=watchtime
GET /api/analytics/channel?period=28d&metric=engagement
GET /api/analytics/channel?period=28d&metric=revenue
GET /api/analytics/channel?period=28d&metric=demographics
GET /api/analytics/channel?period=28d&metric=traffic
```

### Video Analytics
```
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=overview
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=views
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=engagement
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=retention
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=comments
GET /api/analytics/video?videoId=VIDEO_ID&period=28d&metric=traffic
```

## Database Schema

### Channel Analytics Table
```sql
model ChannelAnalytics {
  id                  String   @id @default(uuid())
  channelId           String   @map("channel_id")
  date                DateTime @db.Date
  views               Int      @default(0)
  uniqueViewers       Int      @default(0) @map("unique_viewers")
  watchTime           Int      @default(0) @map("watch_time")
  subscribersGained   Int      @default(0) @map("subscribers_gained")
  subscribersLost     Int      @default(0) @map("subscribers_lost")
  videosPublished     Int      @default(0) @map("videos_published")
  createdAt           DateTime @default(now()) @map("created_at")

  @@unique([channelId, date])
  @@map("channel_analytics")
}
```

### Video Analytics Table
```sql
model VideoAnalytics {
  id                  String   @id @default(uuid())
  videoId             String   @map("video_id")
  date                DateTime @db.Date
  views               Int      @default(0)
  uniqueViewers       Int      @default(0) @map("unique_viewers")
  watchTime           Int      @default(0) @map("watch_time")
  likes               Int      @default(0)
  dislikes            Int      @default(0)
  comments            Int      @default(0)
  shares              Int      @default(0)
  subscribersGained  Int      @default(0) @map("subscribers_gained")
  subscribersLost     Int      @default(0) @map("subscribers_lost")
  createdAt           DateTime @default(now()) @map("created_at")

  @@unique([videoId, date])
  @@map("video_analytics")
}
```

## Components

### AnalyticsDashboard
Main analytics dashboard component for channel-level analytics.

**Props:**
- `userId: string` - The user ID for authentication

**Features:**
- Period selection (7d, 28d, 90d, 1y)
- Multiple analytics tabs (Overview, Views, Subscribers, Engagement, Revenue)
- Real-time data refresh
- Responsive design

### VideoAnalytics
Individual video analytics component.

**Props:**
- `videoId: string` - The video ID to analyze
- `userId: string` - The user ID for authentication

**Features:**
- Video-specific metrics
- Detailed analytics tabs
- Performance insights
- Engagement tracking

### Chart
Reusable chart component for data visualization.

**Props:**
- `data: ChartData[]` - Array of data points
- `title: string` - Chart title
- `type?: 'line' | 'bar' | 'area'` - Chart type
- `height?: number` - Chart height
- `color?: string` - Chart color
- `showGrid?: boolean` - Show grid lines
- `showLegend?: boolean` - Show legend
- `formatValue?: (value: number) => string` - Value formatter

## Usage

### 1. Access Analytics in Studio
Navigate to the YouTube Studio and click on the "Analytics" tab to view channel analytics.

### 2. View Video Analytics
From the Content tab, click on any video to view its individual analytics.

### 3. Customize Time Periods
Use the period selector to view analytics for different time ranges:
- Last 7 days
- Last 28 days
- Last 90 days
- Last year

### 4. Refresh Data
Click the refresh button to get the latest analytics data.

## Data Seeding

To populate the analytics tables with sample data, run:

```bash
npx ts-node src/scripts/seed-analytics.ts
```

This will generate realistic analytics data for the last 90 days for all existing channels and videos.

## Authentication

All analytics endpoints require authentication. The system uses JWT tokens for user authentication and ensures users can only access their own analytics data.

## Performance Considerations

- Analytics data is aggregated daily to improve query performance
- Charts use SVG for smooth rendering and scalability
- Data is cached on the client side to reduce API calls
- Pagination is implemented for large datasets

## Future Enhancements

### Planned Features
- **Real-time Analytics**: Live view count updates
- **Advanced Demographics**: Age, gender, location analytics
- **Revenue Tracking**: Monetization and earnings analytics
- **A/B Testing**: Video performance comparison tools
- **Export Functionality**: CSV/PDF report generation
- **Custom Date Ranges**: Flexible date range selection
- **Alerts and Notifications**: Performance milestone alerts
- **Competitor Analysis**: Benchmark against similar channels

### Technical Improvements
- **Caching Layer**: Redis for improved performance
- **Background Jobs**: Automated analytics processing
- **Data Warehouse**: Advanced analytics storage
- **Machine Learning**: Predictive analytics and insights
- **API Rate Limiting**: Prevent abuse and ensure fair usage

## Troubleshooting

### Common Issues

1. **No Analytics Data**
   - Ensure videos have been published
   - Check if analytics data has been seeded
   - Verify user authentication

2. **Charts Not Loading**
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible
   - Ensure data format is correct

3. **Slow Performance**
   - Reduce the time period for large datasets
   - Check database query performance
   - Consider implementing pagination

### Debug Mode
Enable debug mode by adding `?debug=true` to analytics URLs to see additional logging information.

## Contributing

When contributing to the analytics system:

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for all data structures
3. Include error handling for all API calls
4. Write tests for new analytics features
5. Update documentation for new endpoints or components
6. Ensure responsive design for mobile devices

## License

This analytics system is part of the YouTube Clone project and follows the same licensing terms.
