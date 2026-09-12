import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
import { TRACKS, trackById } from '../lib/bgm'
import { lastFailure, onYtTitle, player, type Source } from '../lib/player'
import { youtubeId } from '../lib/audioStore'
import { pickImage } from '../lib/img'
import { Ed } from './Ed'

/** 탭 id 가 어떤 주소로 가는지 — 이름과 표시 여부는 쓰는 사람이 정한다 */
const TAB_PATH: Record<string, string> = {
  home: '/home',
  profile: '/profile',
  diary: '/diary',
  photo: '/photo',
  board: '/board',
  paper: '/paper',
  guest: '/guest',
}

/** 큰 영문 제목 + 그 옆에 작게 붙는 회색 대문자 — 그 시절 섹션 머리 */
export function Sect({
  title,
  sub,
  children,
}: {
  title: string
  sub?: string
  children?: React.ReactNode
}) {
  return (
    <div className="sect">
      <h2>{title}</h2>
      {sub && <em>{sub}</em>}
      <span className="sp" />
      {children}
    </div>
  )
}

/** 브라우저가 소리를 막고 있는지 — 플레이어가 안내 문구를 띄우는 데 쓴다 */
let blockedListeners: ((b: boolean) => void)[] = []
const setBlockedGlobal = (b: boolean) => blockedListeners.forEach((f) => f(b))

/** 지금 설정으로 어떤 소리를 낼지 정한다 */
function useSource(): Source | null {
  const kind = useSite((s) => s.bgmKind)
  const songId = useSite((s) => s.songId)
  const ytUrl = useSite((s) => s.ytUrl)

  if (kind === 'file') return { kind: 'file' }
  if (kind === 'youtube') {
    const id = youtubeId(ytUrl)
    return id ? { kind: 'youtube', videoId: id } : null
  }
  return { kind: 'builtin', trackId: songId }
}

/**
 * 소리를 실제로 굴리는 곳. 화면 어디에도 나오지 않는다.
 * 페이지를 옮겨도 음악이 끊기면 안 되므로 앱 맨 위에 한 번만 붙인다.
 */
export function BgmHost() {
  const playing = useSite((s) => s.playing)
  const volume = useSite((s) => s.volume)
  const src = useSource()
  const key = src ? JSON.stringify(src) : ''

  useEffect(() => {
    let alive = true
    if (playing && src) {
      void player.play(src).then((ok) => alive && setBlockedGlobal(!ok))
    } else {
      player.pause()
      setBlockedGlobal(false)
    }
    return () => {
      alive = false
    }
    // src 는 매 렌더마다 새 객체라 내용으로 비교한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, key])

  useEffect(() => {
    player.setVolume(volume / 100)
  }, [volume])

  // 유튜브가 영상 제목을 알려주면 받아 적는다 — 손으로 안 써도 되게
  useEffect(
    () =>
      onYtTitle((title) => {
        const s = useSite.getState()
        if (s.bgmKind === 'youtube' && s.ytTitle !== title) s.setYt(s.ytUrl, title)
      }),
    [],
  )

  // 창을 닫거나 새로고침할 때 소리가 남지 않게
  useEffect(() => {
    const stop = () => player.pause()
    window.addEventListener('pagehide', stop)
    return () => {
      window.removeEventListener('pagehide', stop)
      player.pause()
    }
  }, [])

  return null
}

export function Bgm() {
  const { songId, playing, togglePlay, setSong, volume, setVolume, bgmKind, fileName, ytTitle } =
    useSite()
  const [blocked, setBlocked] = useState(false)
  const [pos, setPos] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const src = useSource()
  const sounding = playing && !blocked && !!src

  const cur = trackById(songId)
  const i = TRACKS.findIndex((t) => t.id === cur.id)

  /* 지금 무슨 소리가 나는지 한 줄로 */
  const title =
    bgmKind === 'file'
      ? fileName || '올린 음악이 없습니다'
      : bgmKind === 'youtube'
        ? ytTitle || (src ? '유튜브 음악' : '유튜브 주소를 넣어주세요')
        : cur.title
  const by =
    bgmKind === 'file' ? '내 파일' : bgmKind === 'youtube' ? '유튜브' : cur.artist

  useEffect(() => {
    blockedListeners.push(setBlocked)
    return () => {
      blockedListeners = blockedListeners.filter((f) => f !== setBlocked)
    }
  }, [])

  // 재생 위치를 따라가는 막대
  useEffect(() => {
    if (!sounding) return
    const id = window.setInterval(() => setPos(player.progress), 200)
    return () => clearInterval(id)
  }, [sounding])

  const go = (d: number) => setSong(TRACKS[(i + d + TRACKS.length) % TRACKS.length].id)

  /** 브라우저가 막고 있으면 먼저 풀고, 아니면 그냥 껐다 켠다 */
  const onPlay = async () => {
    if (!src) return
    if (blocked || !playing) {
      const ok = await player.play(src)
      setBlocked(!ok)
      if (!playing) togglePlay()
    } else {
      togglePlay()
    }
  }

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = bar.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    player.seek(frac)
    setPos(frac)
  }

  return (
    <div className={`bgm ${sounding ? 'on' : ''}`}>
      <div className="bgm-row">
        <span className="bgm-eq" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="bgm-name">
          {title} <em>{by}</em>
        </span>
        {blocked && (
          <span className="bgm-warn">
            {lastFailure() === 'missing'
              ? bgmKind === 'youtube'
                ? '유튜브를 불러오지 못했습니다'
                : '음악 파일을 찾지 못했습니다'
              : '눌러서 소리 켜기'}
          </span>
        )}
        {bgmKind === 'builtin' && (
          <button onClick={() => go(-1)} aria-label="이전 곡" title="이전 곡">
            ◀◀
          </button>
        )}
        <button
          onClick={onPlay}
          disabled={!src}
          aria-label={sounding ? '일시정지' : '재생'}
          title={sounding ? '일시정지' : '재생'}
        >
          {sounding ? '❚❚' : '▶'}
        </button>
        {bgmKind === 'builtin' && (
          <button onClick={() => go(1)} aria-label="다음 곡" title="다음 곡">
            ▶▶
          </button>
        )}
        <input
          className="bgm-vol"
          type="range"
          min={0}
          max={100}
          value={volume}
          aria-label="소리 크기"
          title="소리 크기"
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>

      <div
        className="bgm-bar"
        ref={bar}
        role="slider"
        tabIndex={0}
        aria-label="재생 위치"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        onClick={seekTo}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') player.seek(Math.min(1, pos + 0.05))
          if (e.key === 'ArrowLeft') player.seek(Math.max(0, pos - 0.05))
        }}
      >
        <i style={{ width: `${pos * 100}%` }} />
      </div>
    </div>
  )
}

/** TODAY·TOTAL 숫자 한 칸 — 눌러서 직접 고친다 */
function Counter({
  label,
  value,
  onSet,
}: {
  label: string
  value: number
  onSet: (n: number) => void
}) {
  const viewing = useSite((s) => s.viewing)
  const [fix, setFix] = useState(false)
  const [draft, setDraft] = useState('')

  const done = () => {
    const n = Number(draft.replace(/[^\d]/g, ''))
    if (Number.isFinite(n) && draft.trim() !== '') onSet(n)
    setFix(false)
  }

  if (fix)
    return (
      <>
        {label}{' '}
        <input
          className="counter-in"
          value={draft}
          autoFocus
          inputMode="numeric"
          aria-label={`${label} 숫자`}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={done}
          onKeyDown={(e) => {
            if (e.key === 'Enter') done()
            if (e.key === 'Escape') setFix(false)
          }}
        />
      </>
    )

  return (
    <>
      {label}{' '}
      <b
        className={viewing ? '' : 'counter-hit'}
        role={viewing ? undefined : 'button'}
        tabIndex={viewing ? undefined : 0}
        title={viewing ? undefined : '눌러서 숫자 고치기'}
        onClick={() => {
          if (viewing) return
          setDraft(String(value))
          setFix(true)
        }}
        onKeyDown={(e) => {
          if (viewing || e.key !== 'Enter') return
          setDraft(String(value))
          setFix(true)
        }}
      >
        {value.toLocaleString()}
      </b>
    </>
  )
}

/** 미니홈피 본체 — 왼쪽 프로필 / 링 / 오른쪽 내용 / 세로 탭 */
export function Hompy() {
  const { me, setMe, jjak, todayCount, totalCount, tabs, setCount } = useSite()
  const nav = useNavigate()
  const [target, setTarget] = useState(jjak[0]?.id ?? '')

  return (
    <div className="hompy">
      <svg className="hompy-ribbon" width="92" height="26" viewBox="0 0 92 26" aria-hidden="true">
        <path d="M6 4 L30 13 L6 22 Z" fill="var(--accent)" />
        <path d="M86 4 L62 13 L86 22 Z" fill="var(--accent)" />
        <rect x="28" y="3" width="36" height="20" rx="9" fill="var(--accent-2)" />
        <circle cx="46" cy="13" r="4" fill="#fff" />
      </svg>
      <div className="hompy-top">
        <span className="counter">
          <Counter label="TODAY" value={todayCount} onSet={(n) => setCount({ todayCount: n })} />{' '}
          <span className="bar">|</span>{' '}
          <Counter label="TOTAL" value={totalCount} onSet={(n) => setCount({ totalCount: n })} />
        </span>
        <span className="sp" />
        <h1 className="hompy-title">
          <Ed
            value={me.homeTitle}
            onChange={(v) => setMe({ homeTitle: v })}
            multiline={false}
            maxChars={24}
            ph="기록장 이름"
            label="기록장 이름"
          />
        </h1>
        <span className="editmark">EDIT</span>
      </div>

      <div className="hompy-body">
        <aside className="side">
          <div
            className="side-pic"
            style={{ backgroundImage: me.photo ? `url(${me.photo})` : undefined }}
            role="button"
            tabIndex={0}
            onClick={() => pickImage((src) => setMe({ photo: src }))}
            onKeyDown={(e) => e.key === 'Enter' && pickImage((src) => setMe({ photo: src }))}
            title="눌러서 사진 바꾸기"
          >
            {!me.photo && (
              <span>
                눌러서 사진 넣기
                <br />
                <span style={{ fontSize: 10 }}>JPG · PNG</span>
              </span>
            )}
          </div>

          <div className="todayis">
            <span>TODAY IS</span>
            <b>♡</b>
            <Ed
              value={me.motto}
              onChange={(v) => setMe({ motto: v })}
              multiline={false}
              maxChars={18}
              ph="오늘 기분"
              label="오늘 기분"
            />
          </div>

          <Ed
            className="side-intro"
            value={me.intro}
            onChange={(v) => setMe({ intro: v })}
            ph="자기소개를 써보세요"
            label="자기소개"
          />

          <div className="side-name">
            <Ed
              value={me.name}
              onChange={(v) => setMe({ name: v })}
              multiline={false}
              maxChars={12}
              ph="이름"
              label="이름"
              style={{ display: 'inline' }}
            />
            <em>
              {' ('}
              <Ed
                value={me.gender}
                onChange={(v) => setMe({ gender: v })}
                multiline={false}
                maxChars={2}
                label="성별 기호"
                style={{ display: 'inline' }}
              />
              {')'}
            </em>
            <span className="sp" />
            <span className="side-edit">▶EDIT ▶HISTORY</span>
          </div>

          <div className="wave">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="로그타기로 갈 단짝"
            >
              {jjak.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nick} — {j.title}
                </option>
              ))}
            </select>
            <button onClick={() => target && nav(`/jjak/${target}`)}>로그타기</button>
          </div>

          <div className="side-foot">
            단짝 <b>{jjak.length}</b>명 · <NavLink to="/jjak">모두 보기</NavLink>
          </div>
        </aside>

        <div className="rings" aria-hidden="true">
          <i />
          <i />
        </div>

        <main className="main">
          <Outlet />
        </main>

        <nav className="tabs">
          {tabs
            .filter((t) => t.on && TAB_PATH[t.id])
            .map((t) => (
              <NavLink
                key={t.id}
                to={TAB_PATH[t.id]}
                className={({ isActive }) => (isActive ? 'on' : '')}
              >
                {t.label}
              </NavLink>
            ))}
        </nav>
      </div>
    </div>
  )
}
