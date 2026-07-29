#!/usr/bin/env bash

# Copy this file to dev-env.sh, then set your local PostgreSQL credentials.
# dev-env.sh is ignored by Git because it may contain local secrets.
export DB_USERNAME=""
export DB_PASSWORD=""

export JWT_PRIVATE_KEY_LOCATION="file:${HOME}/.config/audio-player/jwt-private.pem"
export JWT_PUBLIC_KEY_LOCATION="file:${HOME}/.config/audio-player/jwt-public.pem"
