# Grid

> A local-first spatial surface for your tools.

Grid gives you a **spatial surface for your workspace** — terminals, browsers, notes, dashboards, logs, whatever tools you use to build and run systems. The surface adapts to the task, not the other way around.

---

## Demo

<iframe
  src="https://player.mux.com/1I0101tkW02qn2BvYIJz1jkDO4TAGku8eorz8uFWqjt02XU?metadata-video-title=CleanShot+2026-08-07+at+02&video-title=CleanShot+2026-08-07+at+02"
  style="width: 100%; border: none; aspect-ratio: 640/311;"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen
></iframe>

---

## Layout Modes

Four arrangements, switched with `⌘1-4`. FLIP animations morph between them:

| Key | Mode | Use |
|-----|------|-----|
| 1 | **Niri** | Horizontal scrolling strip, focused column centered |
| 2 | **Grid** | Uniform dashboard cells |
| 3 | **Fibonacci** | Spiral tile |
| 4 | **Canvas** | Zoomable freeform surface |

Double-click a window titlebar to focus it in Niri mode. Double-click again to restore.

## Running

```bash
pnpm dev          # Vite dev server (browser)
pnpm tauri:dev    # Full desktop app with PTY terminals
pnpm build        # Production build
```

## Features

- **Spaces** — virtual desktops, each with its own windows and layout mode
- **Semantic windowing** — every window has a kind, status, and color-coded group
- **Zen mode** — full-bleed single-window immersion (`⌥Z`)
- **Command palette** — global search + action dispatch (`⌥Space`)
- **Dark / light themes** — toggle in settings (`⌘⇧,`)
- **Real PTY terminals** via Tauri `portable-pty` + `xterm.js` (desktop only)
- **Keyboard-driven** — one command registry, multiple input surfaces
- **Local-first** — layout persists to `localStorage`; Iroh sync coming

## Architecture

**Stack:** Tauri 2 + React 19 + Vite 8 + Tailwind CSS 4

- Single `useReducer` for window manager state
- Pure layout compute functions: state → rects
- FLIP morphing between layout modes
- Content panes own their persistence — the shell never reaches into pane internals

## Relationship to turtlecode

Grid is the surface for operating systems. [turtlecode](https://github.com/trentbrew/turtlecode) is the surface for writing code. They interoperate through the terminal: turtlecode can spawn terminals in Grid; Grid can host turtlecode's web build in a browser pane.
