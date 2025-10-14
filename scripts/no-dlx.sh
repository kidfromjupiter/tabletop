#!/usr/bin/env bash
if [[ "$PWD" == *"/.cache/pnpm/dlx/"* ]]; then
  echo "❌ Refusing to run from pnpm dlx. Use: pnpm run android"
  exit 1
fi
exec "$@"
