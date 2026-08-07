import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Moon, Sun, X } from 'lucide-react'
import { formatChord } from '../settings'

export function SettingsDialog({ open, onClose, settings, onSave }) {
  const [local, setLocal] = useState(settings)

  useEffect(() => {
    if (open) setLocal(settings)
  }, [open, settings])

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  const handleThemeChange = (theme) => {
    setLocal((prev) => ({ ...prev, theme }))
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content className="settings-dialog">
          <div className="settings-header">
            <Dialog.Title className="settings-title">Settings</Dialog.Title>
            <button
              type="button"
              className="settings-close"
              onClick={onClose}
              aria-label="Close settings"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="settings-body">
            <section className="settings-section">
              <h3 className="settings-section-title">Theme</h3>
              <div className="theme-options">
                <label className={`theme-option${local.theme === 'dark' ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={local.theme === 'dark'}
                    onChange={() => handleThemeChange('dark')}
                  />
                  <Moon size={14} strokeWidth={2} />
                  <span>Dark</span>
                </label>
                <label className={`theme-option${local.theme === 'light' ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={local.theme === 'light'}
                    onChange={() => handleThemeChange('light')}
                  />
                  <Sun size={14} strokeWidth={2} />
                  <span>Light</span>
                </label>
              </div>
            </section>

            <section className="settings-section">
              <h3 className="settings-section-title">Keyboard shortcuts</h3>
              <div className="keybindings-list">
                {(local.keybindings ?? []).map((b) => (
                  <div key={b.id} className="keybinding-row">
                    <span className="keybinding-label">{b.label}</span>
                    <span className="keybinding-keys">
                      <kbd className="keybinding-kbd">{formatChord(b.chord)}</kbd>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="settings-footer">
            <button type="button" className="settings-btn settings-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="settings-btn settings-btn-primary" onClick={handleSave}>
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
