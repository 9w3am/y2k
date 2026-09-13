import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Stage } from './ui/Stage'
import { Notice } from './ui/Notice'
import { ThemePicker } from './ui/ThemePicker'
import { byId, themes } from './themes/registry'
import { useStore } from './lib/store'
import { exportPng } from './lib/exportPng'
import { DialogHost, ask, say } from './ui/dialog'

export function App() {
  const { themeId = '' } = useParams()
  const nav = useNavigate()
  const theme = byId(themeId)

  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [picker, setPicker] = useState(false)
  const [notice, setNotice] = useState(() => localStorage.getItem('retro:seen') !== '1')

  const current = useStore((s) => s.current)
  const round = useStore((s) => {
    const d = s.data[s.current] ?? {}
    const f = s.defaults[s.current] ?? {}
    return (d.screenShape ?? f.screenShape) === 'square' ? 0 : Number(d.screenRound ?? f.screenRound ?? 30)
  })
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)

  // 주소가 실제 테마가 아니면 첫 테마로 보낸다
  useEffect(() => {
    if (theme.id !== themeId) nav(`/${theme.id}`, { replace: true })
  }, [theme.id, themeId, nav])

  // 그리기 전에 값을 얹는다 — 빈 화면이 한 프레임도 보이면 안 된다
  useLayoutEffect(() => {
    useStore.getState().mount(theme.id, theme.defaults)
    setZoom(1)
  }, [theme])

  const save = () => {
    // 저장은 2배 고정 — 고르게 해봤자 뭘 고르는지 알기 어렵다
    // 배율은 넘기지 않는다 — 캔버스 한도 안에서 가장 크게 알아서 고른다
    if (canvasRef.current) void exportPng(canvasRef.current, theme.id, undefined, round)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        e.shiftKey ? useStore.getState().redo() : useStore.getState().undo()
      } else if (k === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const savePreset = () => {
    const data = useStore.getState().data[theme.id] ?? {}
    const blob = new Blob([JSON.stringify({ theme: theme.id, data }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `retro_${theme.id}_preset.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const loadPreset = (file: File) => {
    const fr = new FileReader()
    fr.onload = () => {
      try {
        const p = JSON.parse(String(fr.result)) as { theme?: string; data?: Record<string, string> }
        if (!p.data) throw new Error('bad')
        if (p.theme && p.theme !== theme.id) {
          void say('다른 테마의 프리셋입니다', `이 파일은 '${byId(p.theme).name}' 테마의 것입니다. 해당 테마로 옮긴 뒤 불러와 주세요.`)
          return
        }
        const set = useStore.getState().set
        for (const [k, v] of Object.entries(p.data)) set(k, String(v))
      } catch {
        void say('프리셋을 읽지 못했습니다', '다른 파일로 다시 시도해 주세요.')
      }
    }
    fr.readAsText(file)
  }

  const presetInput = useRef<HTMLInputElement>(null)
  const Th = theme.Screen
  const Pn = theme.Panel

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <b>수신함</b>
          <span>그 시절 화면을 그대로</span>
        </span>

        <button className="theme-switch" onClick={() => setPicker(true)}>
          {theme.name}
          <svg width="9" height="6" viewBox="0 0 9 6" aria-hidden="true">
            <path d="M0 0l4.5 6L9 0z" fill="currentColor" />
          </svg>
        </button>

        <span className="topbar-spacer" />

        <button className="btn btn-primary" onClick={save}>
          PNG 저장
        </button>
        <input
          ref={presetInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) loadPreset(f)
            e.target.value = ''
          }}
        />
      </header>

      <Stage
        w={theme.canvas.w}
        h={theme.canvas.h}
        zoom={zoom}
        round={round}
        canvasRef={canvasRef}
        hint="화면 속 글자를 눌러 바로 고치세요 · 보이는 그대로 저장됩니다"
        tools={
          <div className="floaters">
            <button
              className="fbtn"
              disabled={!canUndo}
              title="되돌리기 (Ctrl+Z)"
              aria-label="되돌리기"
              onClick={() => useStore.getState().undo()}
            >
              {/* 동그라미로 보이지 않게 — 화살촉이 분명한 U턴 화살표 */}
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M5.5 3 2.5 6l3 3M2.8 6h6.7a3.5 3.5 0 0 1 0 7H6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="fbtn"
              disabled={!canRedo}
              title="다시 실행 (Ctrl+Shift+Z)"
              aria-label="다시 실행"
              onClick={() => useStore.getState().redo()}
            >
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M10.5 3l3 3-3 3M13.2 6H6.5a3.5 3.5 0 0 0 0 7H10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="fbtn"
              title="축소"
              aria-label="축소"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            >
              {/* 글자 기호는 글꼴 기준선 때문에 가운데가 안 맞는다 — 도형으로 그린다 */}
              <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                <rect x="1.5" y="5.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <button className="fbtn fbtn-w" title="원래 크기" onClick={() => setZoom(1)}>
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="fbtn"
              title="확대"
              aria-label="확대"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                <rect x="1.5" y="5.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
                <rect x="5.75" y="1.5" width="1.5" height="10" rx="0.75" fill="currentColor" />
              </svg>
            </button>
          </div>
        }
      >
        {current === theme.id && <Th />}
      </Stage>


      <aside className="panel">
        <Pn />
        <section className="sec">
          <header className="sec-h">
            <span className="sec-n">＋</span>
            <h2 className="sec-t">내 작업</h2>
          </header>
          <p className="sec-note">
            지금 만든 내용을 파일로 받아두면, 나중에 불러와 이어서 고칠 수 있습니다.
          </p>
          <div className="btn-row">
            <button className="btn" onClick={savePreset}>
              프리셋 저장
            </button>
            <button className="btn" onClick={() => presetInput.current?.click()}>
              불러오기
            </button>
          </div>
          <button
            className="btn"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => {
              void ask('이 테마를 초기화할까요?', '지금 쓴 글과 설정이 처음 상태로 돌아갑니다.', '초기화').then((yes) => {
                if (yes) useStore.getState().reset()
              })
            }}
          >
            이 테마 초기화
          </button>
        </section>
      </aside>

      <DialogHost />
      {notice && (
        <Notice
          onClose={() => {
            localStorage.setItem('retro:seen', '1')
            setNotice(false)
          }}
        />
      )}
      {picker && (
        <ThemePicker
          themes={themes}
          currentId={theme.id}
          onPick={(id) => {
            setPicker(false)
            nav(`/${id}`)
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  )
}
