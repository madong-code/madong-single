<div align="center">

<img src="https://raw.githubusercontent.com/madong-code/madong-admin/main/public/logo.png" alt="Madong Logo" width="120" />

# MaDong Admin

An admin front end rebuilt on **Vue Vben Admin `v5.7.0`**, adapted for the **MaDong 5.1+ backend**

[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-409EFF?logo=element&logoColor=white)](https://element-plus.org)
[![Vben Admin](https://img.shields.io/badge/Vben%20Admin-5.7.0-0960BD)](https://github.com/vbenjs/vue-vben-admin)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[![Docs](https://img.shields.io/badge/Docs-madong.tech-7C3AED)](https://madong.tech)
[![Demo](https://img.shields.io/badge/Demo-v5.madong.tech-10B981)](http://v5.madong.tech/admin)

[中文](./README.md) | **English**

</div>

- **Backend-ready**: API contracts are aligned with `adminapi` (response envelope, pagination, error codes, permission codes, SSE), so it connects directly to the MaDong 5.1+ Webman backend.
- **Runs standalone**: ships a built-in Nitro Mock server (`tooling/mock`) that fully demonstrates login, menus, CRUD, dictionaries and code generation without any backend. Switching to a real backend only requires changing one environment variable.
- **Shared with the monorepo**: `src/components`, `src/adapter` and `src/core` reuse the same components and wrappers as the `madong-multi-vue` monorepo edition, keeping upgrade and porting costs low.

The runtime source has been merged from the original `apps`/`packages` workspaces into the root `src`. Licensable packages live in `lib`, build and deployment config in `build`, and Mock/tooling in `tooling`.

## Tech Stack

- Vue 3 / Vite 8 / TypeScript / Pinia / Vue Router
- Element Plus / Tailwind CSS 4 / VXE Table / Vitest

## Quick Start

Requires Node.js `22.18+` or `24+`, and pnpm `10+`.

```bash
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:5500`, using the hash routing mode (paths include `#`).

### Switching API mode

Controlled by `VITE_NITRO_MOCK` in `.env.development`; restart `pnpm dev` after changing it:

```bash
VITE_NITRO_MOCK=true   # Standalone: APIs served by the local Nitro Mock (port 5320)
VITE_NITRO_MOCK=false  # Connect to backend: APIs proxied to the real backend (http://127.0.0.1:8500/adminapi)
```

- **Mock mode** test account: `admin / 123456` (Nitro Mock runs standalone — see `tooling/mock/README.md`)
- **Real backend** test account: depends on the administrator initialized by MaDong

### Key configuration (`.env.development`)

| Variable | Description |
|---|---|
| `VITE_NITRO_MOCK` | `true` standalone / `false` connect to real backend |
| `VITE_ROUTER_HISTORY` | `hash` with `#` (recommended, no server fallback config) / `history` without `#` |
| `VITE_GLOB_API_URL` | API prefix, fixed to `/adminapi` |

## Directory Structure

```text
.
├─ build/                  # Vite build config and deployment scripts
├─ lib/                    # Local licensed packages
├─ public/                 # Static assets
├─ tooling/mock/           # Nitro Mock server (standalone API implementation)
└─ src/
   ├─ adapter/             # Element Plus component, form and table adapters
   ├─ api/                 # Application APIs
   ├─ core/                # Vben framework core (access/layouts/request/shared/ui, etc.)
   ├─ components/          # Project-level shared components
   ├─ layouts/             # Application layout assembly
   ├─ locales/             # Application language packs
   ├─ plugin/              # Front-end source of plugins (workflow, etc., matched with backend download package)
   ├─ router/              # Application routes
   ├─ store/               # Application state
   └─ views/               # Pages
```

## Common Commands

```bash
pnpm dev        # Development
pnpm build      # Production build, outputs dist/, generates dist.zip per .env.production
pnpm preview    # Preview the build output
pnpm typecheck  # Type checking
pnpm lint       # Linting
pnpm test:unit  # Unit tests
```

## Documentation

- [Docs index](./docs/README.md)
- [Architecture](./docs/architecture.md)
- [Mock service](./tooling/mock/README.md)

## Credits

This project is based on [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) `v5.7.0` and follows its MIT License.
