# Veyturn API

Django REST API configured for PostgreSQL. Development password-reset emails use Django's free console email backend.

## Local setup

1. Install PostgreSQL locally, or install Docker and run `docker compose up -d postgres` from the repository root.
2. Copy `.env.example` to `.env` and update the database password. The included Compose service uses `veyturn-local-password`.
3. From the repository root, activate `.venv`.
4. Run `python backend/manage.py migrate`.
5. Run `python backend/manage.py runserver 0.0.0.0:8000`.

Business discovery requires location permission in the mobile app. Registration stores the
business coordinates, and `GET /api/v1/businesses/?lat=...&lng=...` returns nearest-first
results with optional `category`, `search`, and `filter` parameters. The API contract is in
`backend/openapi.yaml`.

For a database-free smoke test, use `DB_ENGINE=sqlite python backend/manage.py migrate` and the same prefix for `runserver`.

Android emulator reaches the API at `http://10.0.2.2:8000`; iOS simulator uses `http://127.0.0.1:8000`.

Password-reset messages print in the backend terminal during development. No paid email provider or Firebase project is required.
