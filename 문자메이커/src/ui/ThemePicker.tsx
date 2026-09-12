import { useEffect } from 'react'
import type { RetroTheme } from '../themes/registry'

export function ThemePicker({
  themes,
  currentId,
  onPick,
  onClose,
}: {
  themes: RetroTheme[]
  currentId: string
  onPick: (id: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="테마 고르기"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ width: 'min(680px, 100%)' }}>
        <div className="modal-h">
          <h2>어떤 화면으로 만들까요</h2>
          <p>테마마다 저장된 내용은 따로 보관됩니다. 옮겨다녀도 지워지지 않아요.</p>
        </div>
        <div className="theme-grid">
          {themes.map((t) => {
            const Sw = t.Swatch
            return (
              <button
                key={t.id}
                className="theme-card"
                aria-current={t.id === currentId}
                onClick={() => onPick(t.id)}
              >
                <span className="theme-card-art">
                  <Sw />
                </span>
                <span className="theme-card-meta">
                  <b>{t.name}</b>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
