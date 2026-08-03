/**
 * Trellis persistence adapter (dormant by default).
 *
 * Browser `TrellisDb` is remote-only (HTTP + WebSocket). Enable by:
 *   1. `pnpm add trellis`
 *   2. set VITE_TRELLIS_URL (and optional VITE_TRELLIS_TOKEN) in .env
 *   3. this adapter auto-activates
 *
 * Schema (trellis/schema):
 *   Window — one per terminal/service/note window
 *   Group  — cross-cutting color/icon label
 *   Space  — a workspace; owns many windows (relation)
 *
 * All trellis/zod imports are deferred so the sandbox builds and runs with
 * just the localStorage adapter when trellis isn't installed/configured.
 */
const SCHEMA_IDEAL = `import { defineType, rel } from 'trellis/schema'
import { z } from 'zod'

export const WindowType = defineType('Window', {
  title: z.string(),
  kind: z.string(),
  status: z.string(),
  groupId: z.string().nullable(),
  x: z.number(), y: z.number(), w: z.number(), h: z.number(),
  z: z.number().optional(),
  minimized: z.boolean().optional(),
}, { title: 'title' })

export const GroupType = defineType('Group', {
  label: z.string(), color: z.string(), icon: z.string(),
}, { title: 'label' })

export const SpaceType = defineType('Space', {
  name: z.string(), mode: z.string(),
  focusId: z.string().nullable(),
  camera: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
}, { title: 'name', relations: { windows: rel(() => WindowType, 'many') } })`

// Optional-dependency loader. trellis is NOT a hard dep of this sandbox, so we
// can't use static `import('trellis/...')` — Vite's dev import-analysis resolves
// those strings even with @vite-ignore. `new Function` defeats static analysis,
// turning the specifiers into runtime imports that only resolve when trellis is
// installed and VITE_TRELLIS_URL is set. (npm-installed bare specifiers resolve
// fine at runtime in the browser via node_modules / import maps.)
const runtimeImport = new Function('s', 'return import(s)')

async function trellis() {
  const [{ defineType, rel }, { z }, { TrellisDb, liveEntities }, { entityMutations }] =
    await Promise.all([
      runtimeImport('trellis/schema'),
      runtimeImport('zod'),
      runtimeImport('trellis/client'),
      runtimeImport('trellis/schema'),
    ])

  const WindowType = defineType(
    'Window',
    {
      title: z.string(),
      kind: z.string(),
      status: z.string(),
      groupId: z.string().nullable(),
      x: z.number(),
      y: z.number(),
      w: z.number(),
      h: z.number(),
      z: z.number().optional(),
      minimized: z.boolean().optional(),
    },
    { title: 'title' },
  )
  const GroupType = defineType(
    'Group',
    { label: z.string(), color: z.string(), icon: z.string() },
    { title: 'label' },
  )
  const SpaceType = defineType(
    'Space',
    {
      name: z.string(),
      mode: z.string(),
      focusId: z.string().nullable(),
      camera: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
    },
    { title: 'name', relations: { windows: rel(() => WindowType, 'many') } },
  )

  return { WindowType, GroupType, SpaceType, TrellisDb, liveEntities, entityMutations }
}

const env = () => import.meta.env ?? {}

export const trellisAdapter = {
  name: 'trellis',
  get enabled() {
    return Boolean(env().VITE_TRELLIS_URL)
  },

  async load() {
    const mod = await trellis()
    const client = new mod.TrellisDb({
      url: import.meta.env.VITE_TRELLIS_URL,
      token: import.meta.env.VITE_TRELLIS_TOKEN,
    })
    try {
      const [spaces, windows, groups] = await Promise.all([
        client.list('Space', { limit: 500 }),
        client.list('Window', { limit: 2000 }),
        client.list('Group', { limit: 200 }),
      ])
      return {
        spaces: spaces.items.map((s) => ({
          id: s.id,
          name: s.name,
          mode: s.mode,
          focusId: s.focusId ?? null,
          camera: s.camera ?? { x: 0, y: 0, zoom: 1 },
          windows: (s.windows ?? [])
            .map((wid) => {
              const w = windows.items.find((i) => i.id === wid)
              if (!w) return null
              return {
                id: w.id,
                title: w.title,
                kind: w.kind,
                status: w.status,
                groupId: w.groupId,
                x: w.x,
                y: w.y,
                w: w.w,
                h: w.h,
                z: w.z ?? 1,
                minimized: w.minimized ?? false,
              }
            })
            .filter(Boolean),
        })),
        groups: groups.items.map((g) => ({
          id: g.id,
          label: g.label,
          color: g.color,
          icon: g.icon,
        })),
        activeSpaceId: null,
      }
    } finally {
      client.close()
    }
  },

  async save(snapshot) {
    const mod = await trellis()
    const client = new mod.TrellisDb({
      url: import.meta.env.VITE_TRELLIS_URL,
      token: import.meta.env.VITE_TRELLIS_TOKEN,
    })
    try {
      const windows = mod.entityMutations(client, mod.WindowType)
      const groups = mod.entityMutations(client, mod.GroupType)
      const spaces = mod.entityMutations(client, mod.SpaceType)

      const groupIdMap = new Map()
      for (const g of snapshot.groups) {
        const id = await groups.create({ label: g.label, color: g.color, icon: g.icon })
        groupIdMap.set(g.id, id)
      }

      for (const sp of snapshot.spaces) {
        const windowIds = []
        for (const w of sp.windows) {
          const wid = await windows.create({
            title: w.title,
            kind: w.kind,
            status: w.status,
            groupId: w.groupId ? (groupIdMap.get(w.groupId) ?? null) : null,
            x: w.x,
            y: w.y,
            w: w.w,
            h: w.h,
            z: w.z,
            minimized: w.minimized,
          })
          windowIds.push(wid)
        }
        const spaceId = await spaces.create({
          name: sp.name,
          mode: sp.mode,
          focusId: sp.focusId,
          camera: sp.camera,
        })
        await client.update(spaceId, { windows: windowIds })
      }
    } finally {
      client.close()
    }
  },

  subscribeSpaces() {
    // future: liveEntities(client, SpaceType).subscribe(cb) → realtime
    return () => {}
  },
}

export { SCHEMA_IDEAL }
