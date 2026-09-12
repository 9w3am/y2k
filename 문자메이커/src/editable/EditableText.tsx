import { useEffect, useRef, type CSSProperties } from 'react'
import { useStore, useValue } from '../lib/store'
import { clampBytes, krByte } from '../lib/krByte'

export interface EditableTextProps {
  /** 스토어 키 */
  k: string
  /** 넘으면 더 이상 입력되지 않는다 */
  maxBytes?: number
  /** 빈 값일 때만 회색으로 뜬다 */
  placeholder?: string
  /** false 면 Enter 가 막힌다 */
  multiline?: boolean
  className?: string
  style?: CSSProperties
  /** 글자수 대신 글자 개수로 제한 (이름 칸 등) */
  maxChars?: number
}

/** 바이트 초과를 바이트 카운터에게 알린다 */
export const OVERFLOW_EVENT = 'retro:overflow'

function caretToEnd(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

export function EditableText({
  k,
  maxBytes,
  maxChars,
  placeholder,
  multiline = true,
  className = '',
  style,
}: EditableTextProps) {
  const value = useValue(k)
  const set = useStore((s) => s.set)
  const ref = useRef<HTMLDivElement>(null)

  // 외부에서 값이 바뀐 경우(되돌리기, 초기화, 테마 로드)에만 DOM 을 덮어쓴다.
  // 타이핑 중에는 건드리지 않는다 — 건드리면 캐럿이 맨 앞으로 튄다.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.innerText.replace(/\n$/, '') !== value) el.innerText = value
  }, [value])

  const commit = () => {
    const el = ref.current
    if (!el) return
    const raw = el.innerText.replace(/\n$/, '')
    let next = raw

    if (maxBytes != null && krByte(raw) > maxBytes) next = clampBytes(raw, maxBytes)
    if (maxChars != null && [...next].length > maxChars) next = [...next].slice(0, maxChars).join('')

    if (next !== raw) {
      el.innerText = next
      caretToEnd(el)
      window.dispatchEvent(new CustomEvent(OVERFLOW_EVENT, { detail: { key: k } }))
    }
    set(k, next)
  }

  return (
    <div
      ref={ref}
      className={`ed ${className}`}
      style={style}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label={placeholder ?? k}
      tabIndex={0}
      data-ph={placeholder ?? ''}
      onInput={commit}
      onBlur={commit}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') e.preventDefault()
        // 편집 중에는 전역 단축키(테마 전환 등)로 새지 않게 막는다
        e.stopPropagation()
      }}
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, multiline ? text : text.replace(/\s*\n\s*/g, ' '))
      }}
      onDrop={(e) => e.preventDefault()}
    />
  )
}

/**
 * 자동 계산이 기본. 클릭해서 숫자를 직접 고치면 그 값으로 고정된다.
 * (그 시절 스크린샷의 `58 / 90 byte` 를 원하는 숫자로 맞추기 위한 장치)
 */
export function ByteCounter({
  sourceKey,
  overrideKey,
  max,
  className = '',
}: {
  sourceKey: string
  overrideKey: string
  max: number
  className?: string
}) {
  const body = useValue(sourceKey)
  const override = useValue(overrideKey)
  const ref = useRef<HTMLSpanElement>(null)
  const auto = String(krByte(body))
  const shown = override.trim() === '' ? auto : override

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const blink = (e: Event) => {
      if ((e as CustomEvent).detail?.key !== sourceKey) return
      el.classList.remove('byte-blink')
      void el.offsetWidth
      el.classList.add('byte-blink')
      setTimeout(() => el.classList.remove('byte-blink'), 1000)
    }
    window.addEventListener(OVERFLOW_EVENT, blink)
    return () => window.removeEventListener(OVERFLOW_EVENT, blink)
  }, [sourceKey])

  return (
    <span ref={ref} className={`byte-counter ${className}`}>
      <EditableTextInline k={overrideKey} display={shown} maxChars={3} />
      {` / ${max} `}
    </span>
  )
}

/** 표시값과 저장값이 다른 인라인 칸 (비어 있으면 자동 계산치를 보여준다) */
function EditableTextInline({
  k,
  display,
  maxChars,
}: {
  k: string
  display: string
  maxChars: number
}) {
  const value = useValue(k)
  const set = useStore((s) => s.set)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    if (el.innerText !== display) el.innerText = display
  }, [display, value])

  return (
    <span
      ref={ref}
      className="ed ed-inline"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label="바이트 수"
      tabIndex={0}
      onInput={() => {
        const el = ref.current!
        const digits = el.innerText.replace(/\D/g, '').slice(0, maxChars)
        if (digits !== el.innerText) {
          el.innerText = digits
          caretToEnd(el)
        }
        set(k, digits)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
        e.stopPropagation()
      }}
      onPaste={(e) => e.preventDefault()}
    />
  )
}
