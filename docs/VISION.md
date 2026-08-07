# Grid

> A local-first spatial surface for your tools.

## The Metaphor

iTerm2 gives you a terminal surface for your shell. Warp gives you a modern terminal with IDE-like features. Grid gives you a **spatial surface for your workspace** — terminals, browsers, notes, dashboards, logs, whatever tools you use to build and run systems.

Seven layout modes let you arrange those tools however the task demands. Dashboard mode for monitoring twelve services. Freeform canvas for mapping architecture. Zen mode for deep-focus debugging. Tabs for reference docs. The surface adapts to the task — not the other way around.

This is the evolution of [filegraph-desktop](https://github.com/trentbrew/filegraph-desktop), a solo dev's ambitious everything-app that attempted to be Obsidian + Notion + VS Code + an AI agent in a single tool. It got many things right — the semantic workspace concept, the desktop-native feel, the PTY terminal integration. It got one thing wrong: scope. Thirty apps, fourteen stores, eighty dependencies. Grid takes the lesson: **build one thing perfectly.** That thing is the spatial surface itself.

## Core Principles

### Surface, Not Stack

Grid is the shell — the layout engine, the window manager, the command palette, the spatial metaphor. What runs inside the panes is your choice. Terminals, browsers, notes, dashboards. Your tools, your stack.

Trellis, Iroh, plain files, git — these are personal stacks you bring, not platforms Grid imposes. Content panes own their persistence. The shell just gives them a window.

### Modal Spatiality

Seven layout modes. You switch between them fluidly with `<cmd>1-7`, and FLIP animations sell the spatial transition:

| Key | Mode | Use |
|-----|------|-----|
| 1 | **Grid** | Uniform dashboard cells |
| 2 | **Canvas** | Zoomable freeform surface |
| 3 | **Niri** | Horizontal scrolling strip |
| 4 | **Windows** | Traditional floating |
| 5 | **Fibonacci** | Spiral tile |
| 6 | **Tabs** | One at a time, full height |
| 7 | **Stack** | Offset deck with z-ordering |

Modal spatiality is the core differentiator. No other tool does "same content, seven arrangements, animated transitions between them." Tmux is always tiling. Figma is always freeform. VS Code is always split panes. Grid's spatial model changes to match your mental model.

### Semantic Windowing

Windows aren't just rectangles — they know their purpose. Each window has a **kind** (terminal, service, note, logs, browser), a **status** (running, idle, warning, error, stopped), and a **group** (color + icon). This means window management can be semantic: "show all terminals in the Infra group," not "move the third rectangle to monitor two." The surface understands content.

### Local-First

No server. No sidecar. No API keys. No cloud dependency. Your layout is a file — back it up with `git`, sync it across devices with Iroh. Real PTY terminals via Tauri's `portable-pty`. Everything runs on your machine. Platform-native traffic lights, native menus, frameless transparent windows. Feels like the OS, not a website in a window.

### Emergent Graph

Notes support `[[wiki-links]]`. Terminals, services, and logs are addressable by ID. Linking creates structure. The graph reveals patterns you didn't plan — backlinks, clusters, unexpected connections. This is the Obsidian model: write freely, link deliberately, let the graph emerge. No schemas, no entity types, no EAV triples. Just references and traversal.

### Pluggable Content

Content panes are self-contained. They manage their own persistence, their own editor, their own data source. The shell provides a window — the pane decides what fills it:

| Pane | Stack |
|------|-------|
| Terminal | Built-in: real PTY via `portable-pty` + `xterm.js` |
| Note | TipTap (same rich text editor as turtlecode): WYSIWYG markdown, wiki-links, slash commands, callouts, code blocks |
| Browser | Embedded webview or iframe |
| Service | Metrics, dashboards, status panels — whatever monitoring stack you use |
| Logs | Tail streams, journald, structured log viewers |
| Your tool | The plugin interface lets you bring whatever you need |

## How It's Different

| Tool | Their paradigm | Grid's advantage |
|------|---------------|------------------|
| **iTerm2 / Warp** | Single-pane terminal | Multi-window spatial surface with dashboards, notes, browsers |
| **tmux / i3** | Text-only tiling | Visual surfaces — charts, dashboards, images, browsers |
| **VS Code** | File-first, fixed layout | Spatial-first, modal layouts, not just code |
| **Obsidian** | Document graph | Live systems as first-class content — terminals, services, logs |
| **Datadog / Grafana** | Team dashboard | Personal cockpit, your arrangement, your mental model |
| **Figma / Miro** | Canvas-only | Hybrid — dashboard + freeform + tiling + tabs + stack |
| **macOS Spaces** | Spatial rectangles | Semantic windowing — kind, status, group, meaning |

## Architecture

```
┌──────────────────────────────────────────┐
│  Grid Shell                              │
│  ┌────────────────────────────────────┐  │
│  │  Layout Engine (7 modes + FLIP)    │  │
│  │  Window Manager (spaces + groups)  │  │
│  │  Command Palette + Keybinds        │  │
│  │  Iroh Persistence                  │  │
│  │  Zen Mode                          │  │
│  │  Native Menu Bridge                │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ Content Panes (pluggable) ─────────┐ │
│  │  Terminal  ── built-in (PTY)        │ │
│  │  Browser   ── webview               │ │
│  │  Note      ── TipTap + wiki-links   │ │
│  │  Service   ── metrics/dashboards    │ │
│  │  Logs      ── tail/stream           │ │
│  │  ...your tool here                  │ │
│  └──────────────────────────────────────┘ │
│                                          │
│  ┌─ Your Personal Stack ───────────────┐ │
│  │  Trellis  │  Iroh  │  git  │  zsh  │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Stack:** Tauri 2 + React 19 + Vite 8 + Tailwind CSS 4

- Single `useReducer` for window manager state (spaces, windows, groups, camera, viewport, Zen)
- Seven pure layout compute functions: state → rects
- LayoutSurface: FLIP morphing, Figma-style pan/zoom/pinch, ghost animations for minimize/restore
- Iroh-backed document store for shell state (layout, window positions, group assignments)
- Content panes own their persistence — the shell never reaches into pane internals

## Relationship to turtlecode

Grid and [turtlecode](https://github.com/trentbrew/turtlecode) are separate products that share a namespace. Grid is the surface for operating systems. Turtlecode is the surface for writing code.

They interoperate through the terminal. Turtlecode can spawn terminals in Grid. Grid can host turtlecode's web build in a browser pane. The protocol is simple: a terminal registry, file-system awareness, and a command palette bridge. No tight coupling — just shared nouns.

## What's Built

- Seven layout modes with FLIP morph transitions between them
- Real PTY terminals via `portable-pty` + `xterm.js`
- Spaces (virtual desktops) with independent window sets and layout modes
- Semantic window groups (color + icon + label)
- Zen mode (full-bleed single-window immersion)
- Freeform canvas with Figma-style pan, zoom, pinch, and dot-matrix background
- Window resize in grid and freeform modes
- Command palette (global search + action dispatch)
- Platform-native menus (macOS menu bar → WM actions)
- Keyboard-driven: one command registry, three input surfaces (keydown, palette, OS menu)
- Space-scoped localStorage persistence with v1→v2 migration

## What's Next

- Iroh persistence layer (replaces localStorage, enables multi-device sync)
- TipTap note pane with rich text editing, wiki-links, slash commands, and callouts
- Wiki-link engine: parse `[[references]]`, resolve links, enable backlinks and graph traversal
- Content pane plugin interface for third-party pane types
- Real service monitor and log stream panes
- Embedded browser pane (webview)
- turtlecode interop: terminal registry + command palette bridge
- Multi-device Iroh sync (desktop ↔ laptop via discovery ticket)

## Non-Goals

- **Not a backend** — bring your own stack (Trellis, Iroh, plain files, git)
- **Not schema-enforced** — no EAV triples, no entity types, no pre-defined ontology. The graph emerges from linking.
- **Not a team dashboard** — personal cockpit, not shared readout
- **Not a web app** — desktop-native via Tauri, real system integration
- **Not filegraph-desktop** — surface only, one thing done well
