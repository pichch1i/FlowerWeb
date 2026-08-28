#!/bin/zsh
set -e
cd "$(dirname "$0")"
npm run build
exec node touchdesigner-server.mjs
