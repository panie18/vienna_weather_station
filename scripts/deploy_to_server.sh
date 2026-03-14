#!/usr/bin/env bash
set -euo pipefail

# Deploy script for local upload to remote server via SSH/rsync
# Customize by setting environment variables: SERVER, USER, SSH_PORT, DEST, SERVICE_NAME

SERVER=${SERVER:-192.168.80.232}
USER=${USER:-deploy}
SSH_PORT=${SSH_PORT:-22}
DEST=${DEST:-/var/www/weather}
SERVICE_NAME=${SERVICE_NAME:-weather-api.service}

echo "Deploying to ${USER}@${SERVER}:${DEST}"

echo "Creating destination on remote..."
ssh -p "${SSH_PORT}" "${USER}@${SERVER}" "mkdir -p '${DEST}'"

echo "Syncing frontend static files..."
rsync -avz --delete -e "ssh -p ${SSH_PORT}" ./frontend/ "${USER}@${SERVER}:${DEST}/html/"

echo "Syncing application files..."
rsync -avz -e "ssh -p ${SSH_PORT}" app.py requirements.txt "${USER}@${SERVER}:${DEST}/"

if [ -f weather-api.service ]; then
  echo "Uploading systemd service file..."
  rsync -avz -e "ssh -p ${SSH_PORT}" weather-api.service "${USER}@${SERVER}:/tmp/${SERVICE_NAME}"
  echo "Installing and restarting service (requires sudo on remote)..."
  ssh -p "${SSH_PORT}" "${USER}@${SERVER}" "sudo mv /tmp/${SERVICE_NAME} /etc/systemd/system/${SERVICE_NAME} && sudo systemctl daemon-reload && sudo systemctl restart ${SERVICE_NAME} && sudo systemctl status --no-pager ${SERVICE_NAME} || true"
else
  echo "No weather-api.service file found locally; skipping service install."
fi

echo "Deployment finished."
