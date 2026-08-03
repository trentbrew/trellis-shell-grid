import { DynamicIcon } from 'lucide-react/dynamic'
import { Folder } from 'lucide-react'
import { normalizeLucideIconName } from './lucide-icons'

export function EntityIcon({ name, size = 14, className = '', style, strokeWidth = 1.75 }) {
  const iconName = normalizeLucideIconName(name)
  return (
    <DynamicIcon
      name={iconName}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      fallback={() => (
        <Folder size={size} strokeWidth={strokeWidth} className={className} style={style} />
      )}
    />
  )
}
