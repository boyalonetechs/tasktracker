#!/usr/bin/env bash
# Render.com build script for the Django backend.
# Runs once during the build phase of a Python web service.
set -e
set -o pipefail

cd "$(dirname "$0")"

echo "==> Creating Python virtualenv in backend/.venv"
python3 -m venv .venv

echo "==> Installing Python dependencies"
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

echo "==> Running Django checks"
./.venv/bin/python manage.py check

echo "==> Applying database migrations"
./.venv/bin/python manage.py migrate --noinput

echo "==> Collecting static files"
./.venv/bin/python manage.py collectstatic --noinput

echo "==> Build complete"
exit 0
