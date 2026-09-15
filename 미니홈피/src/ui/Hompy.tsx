import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/store'
import { lastFailure, onYtTitle, player, type Source } from '../lib/player'
import { youtubeId } from '../lib/audioStore'
import { pickImage } from '../lib/img'
import { deleteImage, putImage, useImg } from '../lib/imageStore'
import { useFriends, useHomeOwner } from '../lib/social'
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
  const fileName = useSite((s) => s.fileName)
  const ytUrl = useSite((s) => s.ytUrl)

  // 올린 것이 없으면 소리를 내지 않는다 — 없는 파일을 찾다가 오류 문구가 뜨지 않게
  if (kind === 'file') return fileName ? { kind: 'file' } : null
  const id = youtubeId(ytUrl)
  return id ? { kind: 'youtube', videoId: id } : null
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
  const {
    playing,
    togglePlay,
    volume,
    setVolume,
    bgmKind,
    fileName,
    ytTitle,
    bgmTag,
    setBgmTag,
  } = useSite()
  const [blocked, setBlocked] = useState(false)
  const [pos, setPos] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const src = useSource()
  const sounding = playing && !blocked && !!src

  /* 지금 무슨 소리가 나는지 한 줄로 */
  const title =
    bgmKind === 'youtube'
      ? ytTitle || (src ? '유튜브 음악' : '유튜브 주소를 넣어주세요')
      : fileName || '올린 음악이 없습니다'
  const by = bgmKind === 'youtube' ? '유튜브' : '내 파일'

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
      {/* 도는 CD — 소리가 날 때만 돈다 */}
      <span className="bgm-disc" aria-hidden="true" />
      <div className="bgm-meta">
        <b className="bgm-name">{title}</b>
        {/* 작은 이름표는 쓰는 사람이 바로 눌러 고친다 — 비우면 기본 글자 */}
        <Ed
          className="bgm-by"
          value={bgmTag?.[bgmKind] || by}
          onChange={(v) => setBgmTag(bgmKind, v)}
          multiline={false}
          maxChars={16}
          ph={by}
          label="음악 이름표"
        />
      </div>
      {blocked && (
        <span className="bgm-warn">
          {lastFailure() === 'missing'
            ? bgmKind === 'youtube'
              ? '유튜브를 불러오지 못했습니다'
              : '음악 파일을 찾지 못했습니다'
            : '눌러서 소리 켜기'}
        </span>
      )}

      {/* 글자 기호(◀◀ ❚❚)는 폰마다 모양·높이가 달라 삐뚤어 보인다 — 그림으로 그린다 */}
      <div className="bgm-ctl">
        <button
          className="bgm-btn bgm-play"
          onClick={onPlay}
          disabled={!src}
          aria-label={sounding ? '일시정지' : '재생'}
        >
          {sounding ? (
            <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
              <rect x="2.6" y="2.2" width="2.4" height="7.6" rx="1" fill="currentColor" />
              <rect x="7" y="2.2" width="2.4" height="7.6" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3.8 2.2v7.6L10 6z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <label className="bgm-volw">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 5.2h2.2L7.4 2.6v8.8L4.2 8.8H2z" fill="currentColor" />
            <path d="M9.6 4.8a3 3 0 0 1 0 4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {/* 막대는 보통 칸으로 그린다 — 브라우저 슬라이더 모양은 PNG 저장에 안 담긴다 */}
          <span className="bgm-volbox">
            <i className="bgm-vol-track">
              <b style={{ width: `${volume}%` }} />
            </i>
            <i className="bgm-vol-knob" style={{ left: `calc((100% - 14px) * ${volume / 100})` }} />
            <input
              className="bgm-vol"
              type="range"
              min={0}
              max={100}
              value={volume}
              aria-label="소리 크기"
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </span>
        </label>
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
export function Counter({
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
  const { me, setMe, todayCount, totalCount, tabs, setCount, viewing } = useSite()
  // 로그타기는 이 기록장 주인의 진짜 단짝에게로
  const homeOwner = useHomeOwner()
  const friends = useFriends(homeOwner?.id ?? null).list.filter((f) => f.status === 'accepted')
  const nav = useNavigate()
  const loc = useLocation()
  const photoUrl = useImg(me.photo)
  // 새 사진은 보관소에 넣고, 밀려난 사진은 보관소에서 지운다
  const pickPhoto = () =>
    pickImage(async (src) => {
      const old = useSite.getState().me.photo
      setMe({ photo: await putImage(src) })
      void deleteImage(old)
    })
  const [target, setTarget] = useState('')

  // 폰에서는 대문이 아닌 곳이면 누른 페이지를 프로필보다 먼저 보여준다 (responsive.css)
  return (
    <div className={`hompy ${loc.pathname === '/home' ? 'is-home' : ''}`}>
      <svg className="hompy-ribbon" width="92" height="26" viewBox="0 0 92 26" aria-hidden="true">
        <path d="M6 4 L30 13 L6 22 Z" style={{ fill: 'var(--accent)' }} />
        <path d="M86 4 L62 13 L86 22 Z" style={{ fill: 'var(--accent)' }} />
        <rect x="28" y="3" width="36" height="20" rx="9" style={{ fill: 'var(--accent-2)' }} />
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
        {!viewing && <span className="editmark">EDIT</span>}
      </div>

      <div className="hompy-body">
        <aside className="side">
          <div
            className="side-pic"
            style={{ backgroundImage: photoUrl ? `url(${photoUrl})` : undefined }}
            role={viewing ? undefined : 'button'}
            tabIndex={viewing ? undefined : 0}
            onClick={viewing ? undefined : pickPhoto}
            onKeyDown={(e) => !viewing && e.key === 'Enter' && pickPhoto()}
            title={viewing ? undefined : '눌러서 사진 바꾸기'}
          >
            {!me.photo && !viewing && (
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
            {!viewing && <span className="side-edit">▶EDIT ▶HISTORY</span>}
          </div>

          <div className="wave">
            <select
              value={target || friends[0]?.handle || ''}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="로그타기로 갈 단짝"
              disabled={friends.length === 0}
            >
              {friends.length === 0 ? (
                <option value="">단짝이 없습니다</option>
              ) : (
                friends.map((f) => (
                  <option key={f.id} value={f.handle}>
                    {f.handle} — {f.title}
                  </option>
                ))
              )}
            </select>
            <button
              disabled={friends.length === 0}
              onClick={() => {
                const h = target || friends[0]?.handle
                if (h) nav(`/u/${h}`)
              }}
            >
              로그타기
            </button>
          </div>

          <div className="side-foot">
            단짝 <b>{friends.length}</b>명 · <NavLink to="/jjak">모두 보기</NavLink>
          </div>
        </aside>

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
