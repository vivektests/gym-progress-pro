# Gym Progress Pro Web

This directory contains the separately deployed full-stack web companion to Gym Progress Pro. The mobile Expo/React Native application remains at the repository root and is intentionally unchanged.

## Features

The web app includes Manus OAuth login, user-scoped MySQL persistence, workout logging, splits, custom exercises, progression recommendations, progress charts, searchable history, muscle recovery heatmaps, readiness scoring, and PR milestone tracking.

## Development

From this directory:

```bash
pnpm install
pnpm dev
```

Run validation with `pnpm check`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`. The web app uses the managed Manus server/database environment for authentication and persistence; do not commit environment files or generated dependencies.

## Deployment

The deployed web app is available at https://gympro-agungajl.manus.space. Its deployment source remains the Manus WebDev project; this directory is a GitHub mirror for source control and collaboration.
