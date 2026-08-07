import { layoutGrid } from './grid'
import { layoutTable } from './table'
import { layoutFreeform } from './freeform'
import { layoutNiri } from './niri'
import { layoutFloating } from './floating'
import { layoutFibonacci } from './fibonacci'
import { layoutTabs } from './tabs'
import { layoutStack } from './stack'

export const layouts = {
  grid: layoutGrid,
  table: layoutTable,
  freeform: layoutFreeform,
  niri: layoutNiri,
  floating: layoutFloating,
  fibonacci: layoutFibonacci,
  tabs: layoutTabs,
  stack: layoutStack,
}

export function computeLayout(mode, ctx) {
  const fn = layouts[mode] ?? layoutGrid
  return fn(ctx)
}

/** Modes where window world geometry is directly editable by drag. */
export const DIRECT_GEOMETRY_MODES = new Set(['freeform', 'floating'])

/** Modes where resize handles are shown. */
export const RESIZABLE_MODES = new Set(['freeform', 'floating'])

/** Modes that use a pan/zoom camera on a world layer. */
export const WORLD_CAMERA_MODES = new Set(['freeform'])
