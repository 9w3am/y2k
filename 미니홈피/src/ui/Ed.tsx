import { useEffect, useRef, type CSSProperties } from 'react'
import { useSite } from '../lib/store'

/**
 * 눌러서 바로 고치는 글자.
 * 타이핑 중에는 DOM 을 건드리지 않는다 — 건드리면 커서가 맨 앞으로 튄다.
 */
export function Ed({
  value,
  onChange,
  ph = '',
  multiline = true,
  maxChars,
  className = '',
  style,
  label,
}: {
  value: string
  onChange: (v: string) => void
  ph?: string
  multiline?: boolean
  maxChars?: number
  className?: string
  style?: CSSProperties
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // 남의 기록장을 구경하는 중에는 고칠 수 없다
  const viewing = useSite((s) => s.viewing)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    if (el.innerText.replace(/\n$/, '') !== value) el.innerText = value
  }, [value])

  const commit = () => {
    const el = ref.current
    if (!el) return
    let next = el.innerText.replace(/\n$/, '')
    if (maxChars != null && [...next].length > maxChars) {
      next = [...next].slice(0, maxChars).join('')
      el.innerText = next
      const r = document.createRange()
      r.selectNodeContents(el)
      r.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(r)
    }
    onChange(next)
  }

  return (
    <div
      ref={ref}
      className={`ed ${className}`}
      style={style}
      contentEditable={viewing ? false : 'plaintext-only'}
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={label ?? ph}
      tabIndex={viewing ? -1 : 0}
      data-ph={ph}
      onInput={commit}
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') e.preventDefault()
        e.stopPropagation()
      }}
      onPaste={(e) => {
        e.preventDefault()
        const t = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, multiline ? t : t.replace(/\s*\n\s*/g, ' '))
      }}
    />
  )
}
