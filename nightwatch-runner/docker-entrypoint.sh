#!/usr/bin/env sh
set -euo pipefail

echo "==== Nightwatch E2E runner (JDK FIPS base) ===="

if [ "${DEBUG_LIST_FILES:-0}" = "1" ]; then
  echo "Project tree under /workspace:"
  ls -R
fi

SELENIUM_HOST="${SELENIUM_HOST:-selenium-router}"
SELENIUM_PORT="${SELENIUM_PORT:-4444}"

echo "Waiting for ${SELENIUM_HOST}:${SELENIUM_PORT}..."
i=0
while ! nc -z "${SELENIUM_HOST}" "${SELENIUM_PORT}" 2>/dev/null; do
  i=$((i+1))
  echo "  still waiting... (${i})"
  sleep 1
done
echo "Selenium router is up!"

echo "Running Nightwatch tests (Chrome + Firefox)…"
set -x
npx nightwatch --config nightwatch.conf.js --env chrome,firefox
EXIT_CODE=$?
set +x
echo "Nightwatch exit code: ${EXIT_CODE}"
exit "${EXIT_CODE}"