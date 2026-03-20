#!/bin/sh

echo "⏳ Waiting for MySQL..."

while ! nc -z db 3306; do
  sleep 1
done

echo "✅ MySQL Started!"

python manage.py migrate
daphne core.asgi:application -b 0.0.0.0 -p 8000