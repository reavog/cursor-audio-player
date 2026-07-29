#!/usr/bin/env bash

set -euo pipefail

container="audio-player-db"
session="audio-player"
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
development_environment="$project_root/dev-env.sh"

if [ ! -f "$development_environment" ]; then
  printf 'Development environment file not found: %s\n' "$development_environment" >&2
  printf 'Create it from the setup instructions in README.md before starting the app.\n' >&2
  exit 1
fi

# shellcheck source=dev-env.sh
source "$development_environment"

for command in docker tmux mvn npm; do
  if ! command -v "$command" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command" >&2
    exit 1
  fi
done

if ! docker container inspect "$container" >/dev/null 2>&1; then
  printf 'Docker container "%s" does not exist. Create it before running this script.\n' "$container" >&2
  exit 1
fi

if [ "$(docker container inspect --format '{{.State.Running}}' "$container")" != "true" ]; then
  printf 'Starting Docker container "%s"...\n' "$container"
  docker container start "$container" >/dev/null
fi

if tmux has-session -t "$session" 2>/dev/null; then
  exec tmux attach-session -t "$session"
fi

tmux new-session -d -s "$session" -n backend -c "$project_root" 'mvn spring-boot:run'
tmux new-window -t "$session:" -n frontend -c "$project_root/frontend" 'npm start'

exec tmux attach-session -t "$session"
