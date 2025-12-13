# Free Email Service Setup for PWNGrid

PWNGrid now supports multiple free email services for sending OTP emails. Choose one of the following options:

## Option 1: Brevo (Recommended) - 300 emails/day FREE

**Steps:**
1. Go to https://www.brevo.com
2. Sign up for free account
3. Verify your email address
4. Go to SMTP & API → SMTP
5. Create SMTP key
6. Add to your `.env` file:

```bash
BREVO_API_KEY=your-brevo-smtp-key-here
BREVO_EMAIL=your-verified-email@example.com
FROM_EMAIL=noreply@pwngrid.com
```

## Option 2: Mailgun - 5000 emails/month FREE

**Steps:**
1. Go to https://www.mailgun.com
2. Sign up for free account
3. Verify domain or use sandbox domain
4. Get API key from dashboard
5. Add to your `.env` file:

```bash
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=sandbox123.mailgun.org
```

## Option 3: SendGrid - 100 emails/day FREE

**Steps:**
1. Go to https://sendgrid.com
2. Sign up for free account
3. Create API key in Settings → API Keys
4. Add to your `.env` file:

```bash
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@pwngrid.com
```

## Option 4: Gmail SMTP (Personal Use)

**Steps:**
1. Enable 2-factor authentication on Gmail
2. Generate App Password in Google Account settings
3. Add to your `.env` file:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_SECURE=false
FROM_EMAIL=your-gmail@gmail.com
```

## Testing Email Service

After configuration, restart your backend and test user registration:

```bash
# Restart backend
cd backend
node server.js

# Test registration - OTP will be sent to email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## Development Mode

If no email service is configured, OTP will be displayed in the backend console:

```
🔔 === OTP EMAIL (Development Mode) ===
📧 To: test@example.com
🔑 OTP: 123456
⏰ Valid for: 10 minutes
🔔 === END OTP ===
```

## Recommended: Brevo Setup

Brevo is the most generous with 300 free emails per day and easy setup:

1. **Sign up**: https://www.brevo.com
2. **Verify email**: Check your inbox and verify
3. **Get SMTP key**: Go to SMTP & API → SMTP → Create new SMTP key
4. **Add to .env**:
   ```bash
   BREVO_API_KEY=xkeysib-your-key-here
   BREVO_EMAIL=your-email@example.com
   FROM_EMAIL=noreply@pwngrid.com
   ```
5. **Restart backend**: `node server.js`

Now your PWNGrid platform will send professional OTP emails for free!