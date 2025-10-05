# API Testing Script for New Comment Features

## Test the Report API

```bash
# Test report API with authentication
curl -X POST http://127.0.0.1:3000/api/videos/39dadb83-3886-4423-a722-3fad6d08f650/comments/f128e2cb-b3f8-4af6-b55b-d4f361bcd97e/report \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE" \
  -d '{
    "reason": "spam",
    "description": "This comment appears to be spam"
  }'
```

## Test the Pin API

```bash
# Test pin comment API
curl -X POST http://127.0.0.1:3000/api/videos/39dadb83-3886-4423-a722-3fad6d08f650/comments/f128e2cb-b3f8-4af6-b55b-d4f361bcd97e/pin \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE"

# Test unpin comment API
curl -X DELETE http://127.0.0.1:3000/api/videos/39dadb83-3886-4423-a722-3fad6d08f650/comments/f128e2cb-b3f8-4af6-b55b-d4f361bcd97e/pin \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE"
```

## Test the Notifications API

```bash
# Test get notifications
curl -X GET http://127.0.0.1:3000/api/notifications/comments \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE"

# Test mark notification as read
curl -X PUT http://127.0.0.1:3000/api/notifications/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN_HERE" \
  -d '{
    "notificationId": "NOTIFICATION_ID_HERE"
  }'
```

## Expected Responses

### Successful Report Response:
```json
{
  "success": true,
  "message": "Comment reported successfully",
  "data": {
    "id": "report-uuid",
    "reason": "spam",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Successful Pin Response:
```json
{
  "success": true,
  "message": "Comment pinned successfully",
  "data": {
    "id": "comment-uuid",
    "pinned": true,
    "pinnedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Successful Notifications Response:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "type": "reply",
        "read": false,
        "createdAt": "2024-01-01T00:00:00Z",
        "comment": {
          "id": "comment-uuid",
          "content": "Great video!",
          "user": {
            "id": "user-uuid",
            "username": "john_doe",
            "name": "John Doe"
          },
          "video": {
            "id": "video-uuid",
            "title": "Amazing Tutorial",
            "thumbnailUrl": "thumbnail.jpg"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "hasMore": false
    }
  }
}
```

## Authentication Notes

The APIs now support authentication via:
1. **Cookie**: `token=YOUR_JWT_TOKEN` (preferred for web)
2. **Authorization Header**: `Authorization: Bearer YOUR_JWT_TOKEN`

Make sure you're logged in and have a valid JWT token before testing these endpoints.

## Common Issues Fixed

1. **Authentication Error**: Fixed cookie name from `auth_token` to `token`
2. **Video Owner Check**: Fixed frontend to properly check video ownership
3. **Token Validation**: Added proper token validation with user ID check
4. **Error Messages**: Improved error messages for better debugging
