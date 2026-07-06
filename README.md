# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Linting & formatting

This project uses [Biome](https://biomejs.dev/) instead of ESLint/Prettier.

```bash
npm run lint       # biome lint --write .
npm run format     # biome format --write .
npm run biome:fix  # biome check --write . (lint + format)
```

Rules are configured in `biome.json`.
