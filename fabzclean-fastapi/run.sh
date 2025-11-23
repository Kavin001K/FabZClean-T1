#!/usr/bin/env bash
export $(grep -v '^#' .env | xargs) 2>/dev/null || true
uvicorn app.main:app --reload --port ${APP_PORT:-3000}

