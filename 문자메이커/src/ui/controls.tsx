import { useRef, useState, type ReactNode } from 'react'
import { say } from './dialog'
import { useStore, useValue } from '../lib/store'
import { readImageScaled } from '../lib/exportPng'

export function Section({
  n,
  title,
  note,
  children,
}: {
  n: string
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="sec">
      <header className="sec-h">
        <span className="sec-n">{n}</span>
        <h2 className="sec-t">{title}</h2>
      </header>
      {note && <p className="sec-note">{note}</p>}
      {children}
    </section>
  )
}

export function Field({
  label,
  right,
  children,
}: {
  label?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="field">
      {(label || right) && (
        <div className="field-l">
          <span>{label}</span>
          {right != null && <i>{right}</i>}
        </div>
      )}
      {children}
    </div>
  )
}

/** 한글 / English 같은 2~4지선다 */
export function Seg({
  k,
  options,
  label,
}: {
  k: string
  label?: string
  options: { value: string; label: string }[]
}) {
  const v = useValue(k)
  const set = useStore((s) => s.set)
  return (
    <Field label={label}>
      <div className="seg" role="group" aria-label={label ?? k}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={v === o.value}
            onClick={() => set(k, o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

export function Slider({
  k,
  label,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  k: string
  label: string
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  const v = useValue(k)
  const set = useStore((s) => s.set)
  return (
    <Field label={label} right={`${v}${suffix}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(v)}
        aria-label={label}
        onChange={(e) => set(k, e.target.value)}
      />
    </Field>
  )
}

export function ColorField({ k, label }: { k: string; label: string }) {
  const v = useValue(k)
  const set = useStore((s) => s.set)
  return (
    <Field label={label}>
      <div className="color-row">
        <input type="color" value={v} aria-label={label} onChange={(e) => set(k, e.target.value)} />
        <input
          className="txt"
          value={v}
          spellCheck={false}
          aria-label={`${label} 색상 코드`}
          onChange={(e) => set(k, e.target.value)}
        />
      </div>
    </Field>
  )
}

export function SwitchField({ k, label }: { k: string; label: string }) {
  const v = useValue(k) === '1'
  const set = useStore((s) => s.set)
  return (
    <div className="field row-between">
      <span style={{ fontSize: 12 }}>{label}</span>
      <button
        type="button"
        className="sw"
        aria-pressed={v}
        aria-label={label}
        onClick={() => set(k, v ? '0' : '1')}
      />
    </div>
  )
}

export function TextField({
  k,
  label,
  placeholder,
}: {
  k: string
  label: string
  placeholder?: string
}) {
  const v = useValue(k)
  const set = useStore((s) => s.set)
  return (
    <Field label={label}>
      <input
        className="txt"
        style={{ width: '100%' }}
        value={v}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => set(k, e.target.value)}
      />
    </Field>
  )
}

export function ImageField({
  k,
  label,
  note = 'JPG, PNG, WEBP',
}: {
  k: string
  label: string
  note?: string
}) {
  const v = useValue(k)
  const set = useStore((s) => s.set)
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = async (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      set(k, await readImageScaled(file))
    } catch {
      void say('이미지를 불러오지 못했습니다', '다른 파일로 다시 시도해 주세요.')
    }
  }

  return (
    <div className="field">
      <button
        type="button"
        className={`drop ${over ? 'over' : ''}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void take(e.dataTransfer.files?.[0])
        }}
      >
        <span className="drop-thumb" style={{ backgroundImage: v ? `url(${v})` : undefined }}>
          {v ? '' : '＋'}
        </span>
        <span style={{ flex: 1 }}>
          <b>{v ? '이미지 바꾸기' : label}</b>
          <span>{note}</span>
        </span>
      </button>
      {v && (
        <button type="button" className="link-mute" style={{ marginTop: 7 }} onClick={() => set(k, '')}>
          이미지 빼기
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void take(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
