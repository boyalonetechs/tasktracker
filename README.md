# Leadpath Task Tracker

Employee task management and daily attendance system for Leadpath Group.

- **Employees** log their daily tasks, track progress, and move them to "today".
- **Admins** view every employee's tasks/history, manage the workforce, and monitor daily attendance.
- **Attendance** records sign-in/sign-out per staff per day (once per day per staff).

## Stack

| Layer    | Technology                                             | Folder      |
|----------|--------------------------------------------------------|-------------|
| Backend  | Django 6 + Django REST Framework + PostgreSQL (Neon)   | `backend/`  |
| Frontend | Next.js 16 + React 19 + Tailwind CSS 4 + lucide-react  | `frontend/` |
| Prod     | Gunicorn + Whitenoise (API), Vercel (web)              | —           |

```
tasktracker/
├── backend/     # Django REST API
│   ├── Tracker/ # project settings (env-driven)
│   ├── api/     # app: models, views, urls, migrations
│   ├── manage.py
│   ├── requirements.txt
│   └── .env     # secrets / config — NOT committed
└── frontend/    # Next.js web app
    ├── src/app/ # routes (login, signup, dashboard, admin/*)
    └── src/lib/api.ts  # API client (reads NEXT_PUBLIC_API_BASE_URL)
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- A PostgreSQL database (local or Neon)

## Backend — run locally

```bash
cd backend

# 1. Create + activate a virtual environment
python3 -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env         # see below for the required keys
```

The app reads all config from `.env` (via `python-dotenv`, no in-code fallbacks for most keys):

```env
DEBUG=False
SECRET_KEY=<your-secret-key>

# E-mail (OTP reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=<sender@example.com>
EMAIL_HOST_PASSWORD=<app-password>
EMAIL_PORT=465
EMAIL_USE_SSL=True

# Database — switch to your own Postgres by changing these
DB_ENGINE=django.db.backends.postgresql
DB_NAME=<db>
DB_USER=<user>
DB_PASSWORD=<password>
DB_HOST=<host>
DB_PORT=5432
DB_SSLMODE=require
DB_CHANNEL_BINDING=require

# CORS / hosts
CORS_ALLOWED_ORIGINS=<comma-separated origins>
CSRF_TRUSTED_ORIGINS=<comma-separated origins>
ALLOWED_HOSTS=<comma-separated hosts>
```

> Note: the shell must NOT export stale `DB_*` variables — exported values override `.env`. Use a clean shell or `unset` them.

```bash
# 4. Apply migrations (creates/updates tables)
python manage.py migrate

# 5. Start the API
python manage.py runserver
```

The API is served at `http://127.0.0.1:8000/`. Use `runserver 0.0.0.0:8000` to expose it on the network.

### Sanity checks

```bash
python manage.py check                 # config OK?
python manage.py makemigrations --check --dry-run   # pending migrations? (should print "No changes detected")
```

## Frontend — run locally

```bash
cd frontend
npm install
npm run dev          # → http://localhost:3000
```

By default the app calls the API at `http://127.0.0.1:8000`. To point at another backend:

```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://<host>:8000" > .env.local
npm run dev
```

Other scripts: `npm run build`, `npm start` (prod server), `npm run lint`.

## Using the app

| Page                    | URL                | Who          |
|-------------------------|--------------------|--------------|
| Landing / login         | `/`, `/login`      | Everyone     |
| Sign up (invited)       | `/signup`          | Staff        |
| My tasks + attendance   | `/dashboard`       | Staff        |
| Settings                | `/dashboard/settings` | Staff     |
| Admin dashboard         | `/admin`           | Admin/Main   |
| Employee detail         | `/admin/dashboard/[id]` | Admin    |
| Attendance daily+history| `/admin/attendance`| Admin        |

### Staff flow

1. **Login** with your email & password (`POST /api/auth/login/`).
2. **Create a task** (or a task group) for today, set its progress (10–100%).
3. **Check off subtasks** — when the last subtask of a task is completed, the task's
   progress + status are **automatically set to 100% / Completed**.
4. **"Move to today"** copies a pending task from a previous date.
5. **Sign in / sign out** (daily attendance) from the dashboard card — one sign-in per day;
   sign-out anytime. Late arrival is just timestamped (no hard cutoff).

### Admin flow

1. Log in at `/admin` (admin credentials).
2. **All Employees**: check every staffer's tasks and their **Check-in / Check-out** for a chosen date.
3. **Attendance page** (`/admin/attendance`): today's table with totals/absences, plus
   **Past attendance** grouped by date (filterable by date or name).
4. Employee rows link to a detail page with full task history.

### API overview (all under `/api/`)

| Endpoint | Method | Purpose |
|---|---|---|
| `auth/login/`, `auth/signup/` | POST | Staff auth |
| `auth/forgot-password/`, `auth/verify-otp/`, `auth/reset-password/` | POST | Password recovery (OTP by e-mail) |
| `task/`, `task/<id>/` | GET/POST/PUT | Create/read/update tasks |
| `task/<id>/move/` | POST | Move a task to today |
| `director/task/`, `director/history/`, `director/tasks/` | GET | Director task views |
| `admin/login/`, `admin/dashboard/`, `admin/staff/`, `admin/staff/<id>/` | GET/POST | Admin management |
| `admin/attendance/` | GET | All attendance records (newest first) |
| `attendance/`, `attendance/checkin/`, `attendance/checkout/` | GET/POST | Staff daily attendance |

Auth uses a bearer token (`Authorization: Bearer <token>`, stored as `auth_token` in localStorage).

## Deploying

- **API**: `gunicorn` with Whitenoise — `python manage.py collectstatic --noinput`, then `gunicorn Tracker.wsgi --bind 0.0.0.0:8000`. Add the deployed origin to `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and `ALLOWED_HOSTS` in `.env`.
- **Web**: Vercel — set `NEXT_PUBLIC_API_BASE_URL` to the deployed API URL.
- **DB**: any PostgreSQL (the repo ships with Neon-friendly settings).

## Repository hygiene

- `backend/.gitignore` already excludes `.env`, `venv/`, `__pycache__/`, `db.sqlite3`,
  and collected `static/admin|rest_framework/`. Never commit real secrets.