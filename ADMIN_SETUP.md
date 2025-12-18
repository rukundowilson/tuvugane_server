# Admin Credentials Setup

This guide explains how to create admin credentials for the Tuvugane system.

## Types of Admins

1. **Super Admin** - Full system access, can create agencies and agency admins
2. **Agency Admin** - Manages a specific agency, handles complaints for that agency

## Quick Start

### Create Super Admin

```bash
npm run create-admin super
```

Or interactively:
```bash
npm run create-admin
# Then type "super" when prompted
```

### Create Agency Admin

```bash
npm run create-admin agency
```

Or interactively:
```bash
npm run create-admin
# Then type "agency" when prompted
```

## Prerequisites

- Database must be running and accessible
- `.env` file must be configured with correct database credentials
- For Agency Admin: At least one agency must exist in the database

## Example Usage

### Creating a Super Admin

```bash
$ npm run create-admin super

🔐 Admin Credentials Creator

✅ Connected to database

=== Creating Super Admin ===

Name: John Doe
Email: admin@tuvugane.com
Password: SecurePassword123!
Phone (optional, press Enter to skip): +250788123456

✅ Created Super Admin: admin@tuvugane.com

📋 Credentials:
   Email: admin@tuvugane.com
   Password: SecurePassword123!
```

### Creating an Agency Admin

```bash
$ npm run create-admin agency

🔐 Admin Credentials Creator

✅ Connected to database

=== Creating Agency Admin ===

Available Agencies:
   1. Ministry of Infrastructure
   2. City Council
   3. Water and Sanitation Authority

Agency ID: 1
Name: Jane Smith
Email: jane@infrastructure.gov.rw
Password: AgencyPass123!

✅ Created Agency Admin: jane@infrastructure.gov.rw

📋 Credentials:
   Email: jane@infrastructure.gov.rw
   Password: AgencyPass123!
   Agency: Ministry of Infrastructure
```

## Alternative: Using API Endpoints

### Super Admin Registration (Public Endpoint)

```bash
curl -X POST http://localhost:5000/api/super-admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "admin@tuvugane.com",
    "password": "SecurePassword123!",
    "phone": "+250788123456"
  }'
```

### Agency Admin Creation (Requires Super Admin Token)

```bash
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@infrastructure.gov.rw",
    "password": "AgencyPass123!",
    "agency_id": 1
  }'
```

## Troubleshooting

### Database Connection Error

If you see `ER_ACCESS_DENIED_ERROR`, check your `.env` file:
- `DB_HOST` - Database host (usually `localhost`)
- `DB_USER` - Database user (usually `root`)
- `DB_PASSWORD` - Database password (required if MySQL has password)
- `DB_NAME` - Database name (usually `tuvugane`)

### No Agencies Found

If creating an Agency Admin fails because no agencies exist:
1. First create agencies through the Super Admin dashboard, or
2. Create agencies directly in the database, or
3. Use the API endpoint: `POST /api/agencies` (requires Super Admin token)

## Security Notes

- Always use strong passwords
- Never commit `.env` files to version control
- Change default JWT_SECRET in production
- Super Admin accounts have full system access - use with caution
