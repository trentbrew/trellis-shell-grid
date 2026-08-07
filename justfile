# ── Grid desktop app recipes ────────────────────────────────────────────────
# Package manager: pnpm | Tauri v2 | React 19 + Vite 8

# Run the desktop app with full PTY terminal support
run:
    pnpm tauri:dev

# Run the Vite dev server only (no desktop, no PTY terminals)
dev:
    pnpm dev

# Build the production desktop app
build:
    pnpm tauri:build

# Lint (oxlint)
lint:
    pnpm lint

# Lint + typecheck build
check:
    pnpm check

# Preview the production build
preview:
    pnpm preview

# Default: show available recipes
default:
    @just --list
