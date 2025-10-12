# Train Strong Server

A TypeScript Express server for fitness tracking with PostgreSQL database.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 16+
- npm

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development database (Docker)
npm run dev:db

# Run development server with hot reload
npm run dev

# Stop development database
npm run stop:db
```

### Production Deployment

1. **Set up environment**:
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Install dependencies**:
   ```bash
   npm ci --only=production
   npm install -g typescript tsx  # For build tools
   ```

3. **Build and setup database**:
   ```bash
   npm run build:prod
   ```

4. **Start server**:
   ```bash
   npm run start:prod
   ```

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run dev:db` - Start PostgreSQL in Docker container
- `npm run stop:db` - Stop and remove Docker database

### Database
- `npm run db:setup` - Create database and run migrations
- `npm run migrate:up` - Run database migrations
- `npm run migrate:down` - Rollback migrations
- `npm run seed` - Seed database with sample workouts

### Build & Production
- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:prod` - Build and setup database for production
- `npm run start:prod` - Start production server
- `npm run typecheck` - Check TypeScript types

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - PostgreSQL host
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name
- `DB_PORT` - PostgreSQL port (default: 5432)

## Database Schema

The application uses three main tables:
- **users** - User accounts and profiles
- **workouts** - Workout definitions with flexible JSON data
- **scheduled_workouts** - Completed workout records with workout snapshots

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check with database status

## Production Notes

1. Ensure PostgreSQL is installed and running
2. Create a production database user with appropriate permissions
3. Use strong passwords and JWT secrets
4. Consider using a process manager like PM2 for production
5. Set up reverse proxy (nginx) for HTTPS and load balancing