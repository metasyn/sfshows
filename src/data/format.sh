#!/usr/bin/env bash
set -euo pipefail
jq --sort-keys <venues.json 2>&1 >venues.sorted.json
