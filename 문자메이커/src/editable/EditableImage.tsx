import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { say } from '../ui/dialog'
import { useStore, useValue } from '../lib/store'
import { readImageScaled } from '../lib/exportPng'

/** 클릭하거나 이미지를 끌어다 놓으면 교체되는 칸. */
export function EditableImage({
  k,
  className = '',
  style,
  hint = '클릭하거나\n이미지를 끌어다 놓기',
  children,
}: {
  k: string
  className?: string
  style?: CSSProperties
  hint?: string
  children?: ReactNode
}) {
  const src = useValue(k)
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
    <div
      className={`edimg ${className} ${over ? 'over' : ''} ${src ? '' : 'is-empty'}`}
      style={{ ...style, backgroundImage: src ? `url(${src})` : undefined }}
      role="button"
      tabIndex={0}
      aria-label="이미지 교체"
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          input.current?.click()
        }
      }}
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
      {children}
      <span className="edimg-hint">{hint}</span>
      <input
        ref={input}
        className="no-export"
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
