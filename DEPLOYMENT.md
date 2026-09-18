# Deploying Task Tracker

Battery-light, git-push deploy for the React/Next.js (`frontend/`) + Django
(`backend/`) split. Backend runs on **Render**, frontend on **Vercel**, database
stays in **Neon** (or any Postgres).

---

## Architecture at a glance

```
Browser
  ├─ NEXT_PUBLIC_API_BASE_URL ──▶ backend (Render, Django+gunicorn) ──▶ Neon Postgres
  └─ Vercel (Next.js)            backend/render.yaml                     backend/manage.py
```

- **API:** Django REST Framework + gunicorn + Whitenoise, served via the
  `backend/render.yaml` Blueprint (or a manual Web Service).
- **Web:** Next.js 16 + Tailwind, deployed by Vercel.
- **DB:** any Postgres reachable over SSL — settings ship Neon/SSL-friendly.

---

## 0. Prerequisites

- A GitHub repo containing the whole repo (both `frontend/` and `backend/`).
- A Render account (https://render.com) with at least one free service slot.
- A Vercel account (https://vercel.com).
- A Neon (or other) Postgres database — you already have this if you followed the README.

> One-time housekeeping: make sure `backend/.gitignore` keeps `.env` (and your
> other local overrides) out of git, but **keeps `render.yaml`, `build.sh`, and
> `Procfile`** committed — those are required for the deploy. It already does.

---

## 1. Backend → Render

Two equivalent paths; pick one.

### Option A — Blueprint (recommended)

1. Push the repo to GitHub (all of it, including `backend/render.yaml`).
2. Open https://dashboard.render.com → **New+** → **Blueprint**.
3. Select the repo. Render will read `backend/render.yaml` and automatically
   propose the `tasktracker-backend` web service.
4. Click **Apply**. Render builds, runs migrations, collects static files, then
   starts `gunicorn`.
5. After it launches, copy the URL — it looks like
   `https://tasktracker-backend.onrender.com`. This is your **API base URL**.

### Option B — Manual Web Service

1. **New+ → Web Service** → connect repo.
2. Configure:

   | Setting              | Value                                                        |
   |----------------------|--------------------------------------------------------------|
   | Root directory       | `backend`                                                    |
   | Environment          | Python                                                       |
   | Region               | your choice (near your DB)                                   |
   | Build command        | `bash build.sh`                                              |
   | Start command        | `gunicorn Tracker.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
   | Instance type        | Free                                                        |

3. Add the environment variables (see table in §2), then **Create Web Service**.

---

## 2. Backend environment variables (set in Render → your service → Environment)

The app **requires** these (no code defaults — Django fails closed if missing):

| Variable                 | Example / Notes                                              |
|--------------------------|--------------------------------------------------------------|
| `SECRET_KEY`             | any long random string (Render can auto-generate)            |
| `DEBUG`                  | `False`                                                      |
| `ALLOWED_HOSTS`          | `tasktracker-backend.onrender.com,localhost,127.0.0.1`       |
| `CORS_ALLOWED_ORIGINS`   | `https://<your-app>.vercel.app,http://localhost:3000`         |
| `CSRF_TRUSTED_ORIGINS`   | same origins as `CORS_ALLOWED_ORIGINS`                       |

Database (Neon / Postgres with SSL):

| Variable              | Example / Notes                                              |
|-----------------------|--------------------------------------------------------------|
| `DB_ENGINE`           | `django.db.backends.postgresql`                              |
| `DB_NAME`             | Neon database name (e.g. `neondb`)                           |
| `DB_USER`             | Neon user                                                    |
| `DB_PASSWORD`         | Neon password                                                |
| `DB_HOST`             | Neon host (e.g. `ep-...pooler...neon.tech`)                  |
| `DB_PORT`             | `5432`                                                       |
| `DB_SSLMODE`          | `require`                                                    |
| `DB_CHANNEL_BINDING`  | `require`                                                    |

Email (used by OTP / forgot-password — optional but recommended):

| Variable        | Example / Notes                                        |
|-----------------|--------------------------------------------------------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend`          |
| `EMAIL_HOST`    | `smtp.gmail.com`                                       |
| `EMAIL_PORT`    | `465`                                                  |
| `EMAIL_USE_SSL` | `True`                                                 |
| `EMAIL_HOST_USER`    | sender address (e.g. `dphubservers@gmail.com`)    |
| `EMAIL_HOST_PASSWORD`| SMTP app password                               |
| `DEFAULT_FROM_EMAIL` | `Leadpath Task Tracker <dphubservers@gmail.com>` |

After saving, Render auto-restarts. The health check hits
`/api/account/settings/` and should return `200`.

---

## 3. Frontend → Vercel

1. Push `frontend/` (the whole repo works too — Vercel auto-detects `next.js`
   from the root; or import the `frontend` directory directly).
2. In **Vercel → your project → Settings → Environment Variables**, add:

   | Variable                     | Value                                        |
   |------------------------------|----------------------------------------------|
   | `NEXT_PUBLIC_API_BASE_URL`   | `https://tasktracker-backend.onrender.com`   |

   **Important:** Vercel inlines `NEXT_PUBLIC_*` at **build** time — changing
   this later requires a redeploy. Do not hardcode the API URL in the code.
3. Redeploy. Production should now work.

> Dev fallback: with no env var set, the frontend falls back to
> `http://127.0.0.1:8000` — that's only for local work, not production.

---

## 4. Verify the whole chain

- [ ] Backend health check returns 200: `curl https://tasktracker-backend.onrender.com/api/account/settings/`
- [ ] Frontend loads at your Vercel URL and shows the **login** page.
- [ ] Sign up a test account; the email arrives (SMTP vars configured).
- [ ] Log in — dashboard, add a task, mark subtasks; attendance sign-in works.
- [ ] Admin login at `/admin` gives the admin dashboard with tasks + attendance.

If the frontend console shows a **CORS** error, the frontend origin is missing
from `CORS_ALLOWED_ORIGINS` on the backend — that's an env fix, not a code fix.

---

## 5. Updating after a change

1. Commit + push the change.
2. **Backend:** Render watches the branch (set it when creating the service) and
   auto-rebuilds on every push. Migrations + `collectstatic` run in `build.sh`.
3. **Frontend:** Vercel auto-deploys on push to your connected branch.

---

## 6. Troubleshooting

| Symptom                           | Likely cause / fix                                            |
|-----------------------------------|---------------------------------------------------------------|
| `Server Error (500)` on login API | `SECRET_KEY` / `ALLOWED_HOSTS` missing → set in Render env    |
| API works, web shows CORS error   | add Vercel origin to `CORS_ALLOWED_ORIGINS` + redeploy        |
| `DisallowedHost` after deploy     | `ALLOWED_HOSTS` missing the new Render host                   |
| Static (admin CSS) 404            | `collectstatic` didn't run → confirm `backend/build.sh` runs; Whitenoise serves `backend/staticfiles` |
| Emails don't send                 | SMTP vars wrong; Render egress note: use `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` |
