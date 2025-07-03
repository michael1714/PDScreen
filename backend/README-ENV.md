# Environment Configuration Guide

## Development Environment (.env file)

Create a `.env` file in the `/backend` directory with these variables:

```bash
# Development Environment Variables
NODE_ENV=development

# Database Configuration (Development)
# Use these individual variables for local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdscreen_dev
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-for-development

# Webhook Secret (for external API webhooks)
WEBHOOK_SECRET=your-webhook-secret

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx

# TinyMCE API Key (optional for rich text editor)
TINYMCE_API_KEY=your-tinymce-api-key
```

## Production Environment (Heroku)

Set these environment variables in your Heroku app:

### Automatic Variables (Set by Heroku)
```bash
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/dbname  # Auto-set by Heroku Postgres
PORT=5000  # Auto-set by Heroku
```

### Manual Variables (Set these in Heroku Dashboard or CLI)
```bash
# JWT Secret (use a strong random string - different from dev)
JWT_SECRET=your-super-secret-production-jwt-key

# Webhook Secret (for external API webhooks)
WEBHOOK_SECRET=your-production-webhook-secret

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx

# TinyMCE API Key (same as development or different)
TINYMCE_API_KEY=your-tinymce-api-key
```

## Setting Heroku Environment Variables

### Via Heroku Dashboard:
1. Go to your Heroku app dashboard
2. Click "Settings" tab
3. Click "Reveal Config Vars"
4. Add each variable

### Via Heroku CLI:
```bash
heroku config:set JWT_SECRET=your-super-secret-production-jwt-key
heroku config:set WEBHOOK_SECRET=your-production-webhook-secret
heroku config:set TINYMCE_API_KEY=your-tinymce-api-key
```

## Adding PostgreSQL to Heroku

```bash
# Add PostgreSQL addon (this sets DATABASE_URL automatically)
heroku addons:create heroku-postgresql:essential-0

# View your database URL
heroku config:get DATABASE_URL
```

## Database Connection Logic

The app automatically detects the environment:

**Production (Heroku):**
- Uses `DATABASE_URL` connection string
- Enables SSL with `rejectUnauthorized: false`

**Development (Local):**
- Uses individual `DB_*` environment variables
- No SSL required

## Security Notes

- **Never commit `.env` files to git**
- Use different secrets for development vs production
- Keep your `JWT_SECRET` long and random (64+ characters)
- Use environment-specific database names 