# Environment Variables Required for Backend

This document lists all environment variables required for the Tuvugane backend server.

## Required Environment Variables

### Database Configuration

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `DB_HOST` | MySQL database host address | `localhost` | No (uses default) |
| `DB_USER` | MySQL database username | `root` | No (uses default) |
| `DB_PASSWORD` | MySQL database password | `` (empty) | No (uses default) |
| `DB_NAME` | MySQL database name | `tuvugane` | No (uses default) |

**Usage:** Used in `src/config/db.ts` for database connection pool configuration.

### Server Configuration

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `PORT` | Server port number | `5000` | No (uses default) |
| `NODE_ENV` | Environment mode (development/production) | `development` | No (uses default) |

**Usage:** 
- `PORT` - Used in `src/index.ts` to set the server listening port
- `NODE_ENV` - Used in `src/index.ts` and `src/controllers/testController.ts` for environment detection

### Security Configuration

| Variable | Description | Default Value | Required |
|----------|-------------|---------------|----------|
| `JWT_SECRET` | Secret key for JWT token signing and verification | `your-secret-key` | **Yes** (should be changed in production) |

**Usage:** Used in:
- `src/utils/generateToken.ts` - For generating JWT tokens
- `src/utils/auth.ts` - For token generation and verification
- `src/middleware/authMiddleware.ts` - For token verification in protected routes

⚠️ **IMPORTANT:** The default `JWT_SECRET` value is insecure and should be changed to a strong, random secret in production.

## Example .env File

Create a `.env` file in the root of the backend directory with the following structure:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=tuvugane

# Server Configuration
PORT=5000
NODE_ENV=development

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Production Recommendations

1. **JWT_SECRET**: Use a strong, randomly generated secret (at least 32 characters)
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **DB_PASSWORD**: Use a strong database password

3. **NODE_ENV**: Set to `production` in production environments

4. **Never commit `.env` files** to version control

## Files Using Environment Variables

- `src/config/db.ts` - Database connection
- `src/index.ts` - Server port and environment
- `src/utils/generateToken.ts` - JWT token generation
- `src/utils/auth.ts` - JWT token utilities
- `src/middleware/authMiddleware.ts` - Authentication middleware
- `src/controllers/testController.ts` - Environment info
- `src/scripts/create-test-admin.ts` - Database connection for scripts
- `scripts/update-admin-password.ts` - Database connection for scripts

