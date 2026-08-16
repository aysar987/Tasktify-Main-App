#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "deploy-frontend.sh must run as root" >&2
  exit 1
fi

if [[ "$#" -ne 1 ]]; then
  echo "usage: deploy-frontend.sh <image-tag>" >&2
  exit 1
fi

cd /srv/tasktify/source

ENV_FILE="frontend/.env.production"
if [[ ! -s "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi
chmod 600 "${ENV_FILE}"

export FRONTEND_IMAGE_TAG="$1"
previous_image="$(docker inspect tasktify-frontend --format '{{.Config.Image}}' 2>/dev/null || true)"

if ! docker image inspect "tasktify-frontend:${FRONTEND_IMAGE_TAG}" >/dev/null 2>&1; then
  docker compose --env-file "${ENV_FILE}" -p tasktify build frontend
fi
docker compose --env-file "${ENV_FILE}" -p tasktify up -d --no-build frontend

healthy=false
for _ in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:8101/ >/dev/null; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "${healthy}" != true ]]; then
  docker compose --env-file "${ENV_FILE}" -p tasktify logs --tail=100 frontend >&2 || true

  if [[ -n "${previous_image}" ]]; then
    previous_tag="${previous_image#tasktify-frontend:}"
    FRONTEND_IMAGE_TAG="${previous_tag}" docker compose --env-file "${ENV_FILE}" -p tasktify up -d --no-build frontend || true
  fi

  echo "Frontend readiness check failed" >&2
  exit 1
fi

nginx -t
systemctl reload nginx
docker image prune -f

curl --fail --silent --show-error --max-time 10 \
  --resolve tasktify.id:443:127.0.0.1 \
  https://tasktify.id/healthz >/dev/null
curl --fail --silent --show-error --max-time 10 \
  --resolve tasktify.id:443:127.0.0.1 \
  https://tasktify.id/ >/dev/null

