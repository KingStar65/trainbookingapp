#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build frontend
npm run build

# Create a .env file if it doesn't exist
if [ ! -f .env ]; then
  touch .env
  echo "DB_USER=${DB_USER}" >> .env
  echo "DB_PASSWORD=${DB_PASSWORD}" >> .env
  echo "DB_HOST=${DB_HOST}" >> .env
  echo "DB_PORT=${DB_PORT}" >> .env
  echo "DB_NAME=${DB_NAME}" >> .env
  echo "JWT_SECRET=${JWT_SECRET}" >> .env
fi