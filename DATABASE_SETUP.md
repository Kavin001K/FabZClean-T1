# FabZClean Database Setup

This document explains how to set up and connect to the Neon PostgreSQL database for the FabZClean application.

## Database Connection

### Connection String
```
postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Direct psql Connection
```bash
psql -h pg.neon.tech
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Database Configuration
DB_HOST="ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech"
DB_PORT="5432"
DB_NAME="neondb"
DB_USER="neondb_owner"
DB_PASSWORD="npg_8WdTlBKStax0"
DB_SSL="require"

# Application Configuration
NODE_ENV="development"
PORT="3000"
```

## Database Files Created

### 1. `server/database.ts`
- Main database connection file
- Uses Drizzle ORM with Neon serverless
- Exports database instance and utility functions

### 2. `server/db-utils.ts`
- Database utility functions
- Health checks and connection testing
- Common database operations

### 3. `scripts/test-db-connection.ts`
- Test script to verify database connection
- Run with: `npx tsx scripts/test-db-connection.ts`

## Testing Database Connection

### Method 1: Run Test Script
```bash
npx tsx scripts/test-db-connection.ts
```

### Method 2: Check API Endpoints
Once the server is running, you can test these endpoints:

- **Health Check**: `GET http://localhost:3000/api/health/database`
- **Ping Test**: `GET http://localhost:3000/api/health/ping`
- **Database Info**: `GET http://localhost:3000/api/database/info`

### Method 3: Direct psql Connection
```bash
psql 'postgresql://neondb_owner:npg_8WdTlBKStax0@ep-frosty-sun-a1pdxel5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

## Database Schema

The application uses Drizzle ORM with schema defined in `shared/schema.ts`. To push schema changes to the database:

```bash
npm run db:push
```

## Troubleshooting

### Connection Issues
1. Verify the connection string is correct
2. Check if the Neon database is active
3. Ensure SSL is properly configured
4. Check network connectivity

### SSL Issues
The connection string includes `sslmode=require` and `channel_binding=require` for secure connections.

### Timeout Issues
Neon uses connection pooling, so connections might be idle. The application handles reconnection automatically.

## Security Notes

- Never commit the `.env` file to version control
- Rotate database passwords regularly
- Use connection pooling for production
- Monitor database usage and limits

## Monitoring

The application includes built-in database monitoring:
- Health check endpoints
- Connection status logging
- Performance metrics
- Error tracking

## Support

For database-related issues:
1. Check the application logs
2. Test connection using the provided scripts
3. Verify Neon console for database status
4. Check network connectivity and firewall settings
