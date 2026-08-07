/**
 * Platform detection for platform-aware window chrome.
 * Mirrors filegraph-desktop's approach: userAgent sniffing works in the
 * Tauri webview on all platforms.
 */

export function getPlatform() {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('win')) return 'windows'
  if (ua.includes('linux')) return 'linux'
  return 'unknown'
}

export const isMac = () => getPlatform() === 'macos'
export const isWindows = () => getPlatform() === 'windows'
export const isLinux = () => getPlatform() === 'linux'
/** macOS uses native traffic lights; Windows/Linux use CSD buttons. */
export const useTrafficLights = () => isMac()
/** macOS traffic lights sit on the LEFT; Windows/Linux CSD on the RIGHT. */
export const controlsSide = () => (isMac() ? 'left' : 'right')
