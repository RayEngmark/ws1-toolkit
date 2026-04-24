# WS1 Toolkit

Simplified desktop admin tool for Omnissa Workspace ONE UEM.

Wraps common WS1 admin tasks (device search, tagging, moving between organization groups) into a clean, fast desktop UI — skipping the clunky web console.

## Features

- **Device Search** — search by serial, user, or device name with bulk selection
- **Tagger** — add/remove tags from multiple devices at once
- **OG Mover** — move devices between organization groups via tree navigation
- **Basic & OAuth 2.0 auth** — credentials stored per-user, never sent to frontend

## Stack

- Tauri 2 (Rust backend) + React 19 + TypeScript
- Zustand for state, CSS Modules with dark theme design tokens
- Local credential storage via tauri-plugin-store

## Development

```bash
npm install
npm run tauri dev
```

## Building

```bash
npm run tauri build
```

Automated Windows/macOS/Linux builds run via GitHub Actions on every push — see the Actions tab for downloads.
