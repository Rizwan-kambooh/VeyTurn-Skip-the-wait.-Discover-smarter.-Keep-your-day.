# Veyturn API deployment on Vercel

## Vercel project

1. Import the GitHub repository into Vercel.
2. Set the project **Root Directory** to `backend`.
3. Keep `main` as the Production Branch.
4. Do not commit production secrets or copy them into `.env.example`.

Vercel detects `manage.py` and the Django WSGI application automatically.

## Production services

- PostgreSQL: create a Neon Postgres database from the Vercel Marketplace and use its **pooled** connection URL.
- Uploaded images: create a Cloudinary account and copy its `CLOUDINARY_URL`.
- Put the database and Cloudinary regions close to the Vercel Function region where possible.

## Required Production environment variables

Add these in **Vercel project > Settings > Environment Variables** and select Production:

```env
DJANGO_SECRET_KEY=<unique-long-random-value>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=<project-name>.vercel.app
DATABASE_URL=<neon-pooled-postgresql-url>
CLOUDINARY_URL=cloudinary://<api-key>:<api-secret>@<cloud-name>
APP_TIME_ZONE=Asia/Karachi
GEOCODING_USER_AGENT=Veyturn/1.0 (contact: <real-email>)
```

`VERCEL_URL` and `VERCEL_PROJECT_PRODUCTION_URL` are also accepted automatically by Django's host configuration.

Add a separate Preview `DATABASE_URL` if Preview deployments must not write to production data.

## Optional email variables

Password-reset email delivery requires a real SMTP provider in production:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=<smtp-host>
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<smtp-user>
EMAIL_HOST_PASSWORD=<smtp-password>
DEFAULT_FROM_EMAIL=Veyturn <noreply@example.com>
```

## Database migrations

Run migrations once after connecting the production database, and after every deployment that contains new migrations. Use a trusted local/CI environment loaded with the Production variables:

```bash
python manage.py migrate --noinput
```

Do not run Preview migrations against the Production database.

## Verification

After deployment:

1. Open `https://<deployment-domain>/health/` and expect `{"status":"ok"}`.
2. Run migrations.
3. Test signup, login, image upload, queue joining, queue completion, and rating.
4. Update the React Native release API URL in `Veyturn/src/services/api.ts` to the production API domain.

Local React Native development continues to use `127.0.0.1:8000` on iOS and `10.0.2.2:8000` on Android.
