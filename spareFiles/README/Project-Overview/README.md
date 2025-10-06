# YouTube Clone

A modern YouTube clone built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication System** - Complete user registration, login, and session management
- 🎥 **Video Management** - Upload, process, and stream videos
- 📺 **Channel System** - User channels with subscriptions
- 💬 **Comments & Interactions** - Like, comment, and engage with content
- 🔍 **Search & Discovery** - Advanced search with filters
- 📊 **Analytics** - Video and channel analytics
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newytclone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/youtube_clone?schema=public"
   JWT_SECRET="your-jwt-secret-here"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   The application will automatically:
   - ✅ Initialize the database connection
   - ✅ Create all necessary tables
   - ✅ Set up the database schema
   - ✅ Start the development server

## Automatic Database Setup

This application includes **automatic database initialization** - no manual setup required!

### What happens automatically:

1. **Database Connection** - Connects to PostgreSQL using your `DATABASE_URL`
2. **Schema Creation** - Creates all tables defined in `prisma/schema.prisma`
3. **Prisma Client** - Generates and configures Prisma client
4. **Health Checks** - Verifies database connectivity
5. **Error Handling** - Graceful error handling and logging

### Database Schema

The application includes a comprehensive database schema with:

- **Users** - User accounts with authentication
- **Channels** - User channels for content
- **Videos** - Video metadata and processing status
- **Categories** - Video categorization
- **Comments** - User comments and replies
- **Likes** - Video and comment interactions
- **Subscriptions** - Channel subscriptions
- **Playlists** - User-created playlists
- **Analytics** - Video and channel analytics
- **Notifications** - User notifications

## Available Scripts

```bash
# Development
npm run dev              # Start development server with auto-db setup
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (WARNING: deletes all data)
npm run db:seed          # Seed database with sample data

# Setup
npm run setup            # Full database setup
npm run setup:dev        # Setup + start development server

# Utilities
npm run lint             # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Health Check
- `GET /api/health` - Database health check

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Core utilities
│   ├── prisma.ts       # Database connection
│   └── startup.ts      # Application startup
├── middleware/         # API middleware
├── pages/              # Pages and API routes
│   ├── api/            # API endpoints
│   └── auth.tsx        # Authentication page
├── scripts/            # Utility scripts
├── services/           # Business logic
├── store/              # State management
├── styles/             # CSS styles
├── types/              # TypeScript types
└── utils/              # Utility functions
    ├── auth.ts         # Authentication utilities
    └── database.ts     # Database utilities
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `NEXTAUTH_SECRET` | NextAuth.js secret | ✅ |
| `EMAIL_SERVER_HOST` | SMTP server host | ❌ |
| `EMAIL_SERVER_PORT` | SMTP server port | ❌ |
| `EMAIL_SERVER_USER` | SMTP username | ❌ |
| `EMAIL_SERVER_PASSWORD` | SMTP password | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS access key | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ❌ |
| `AWS_REGION` | AWS region | ❌ |
| `AWS_S3_BUCKET` | S3 bucket name | ❌ |

## Development

### Adding New Features

1. **Database Changes** - Update `prisma/schema.prisma`
2. **API Routes** - Add to `src/pages/api/`
3. **Components** - Add to `src/components/`
4. **Types** - Update `src/types/`

### Database Migrations

The application uses Prisma's `db push` for schema changes. For production, consider using migrations:

```bash
npx prisma migrate dev --name your-migration-name
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Update `DATABASE_URL` for production database
   - Set secure `JWT_SECRET` and `NEXTAUTH_SECRET`
   - Configure email and AWS settings

3. **Start the application**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.