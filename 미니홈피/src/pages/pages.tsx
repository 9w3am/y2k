import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SKINS, useSite } from '../lib/store'
import { TRACKS } from '../lib/bgm'
import { pickImage } from '../lib/img'
import { Bgm } from '../ui/Hompy'
import { Ed } from '../ui/Ed'
import { Posts } from './Posts'
import { ask, say } from '../ui/dialog'
import { InkJar } from '../ui/InkJar'
import { clearAudio, saveAudio, youtubeId } from '../lib/audioStore'
import { resetAudio } from '../lib/player'
import { makeShareLink } from '../lib/share'

/* ── 대문 ────────────────────────────────────────────────── */
export function Home() {
  const { me, setMe, diary, guest, photo, jjak } = useSite()
  const recent = diary.slice(0, 3)
  const lastGuest = guest[0]

  return (
    <>
      <div className="sect">
        <h2>Updated news</h2>
        <em>today story</em>
        <span className="sp" />
        <small>최근에 올라온 것들</small>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: 11.5 }}>
          {recent.length === 0 ? (
            <span style={{ color: 'var(--ink-dim)' }}>아직 올린 글이 없습니다.</span>
          ) : (
            recent.map((d) => (
              <div key={d.id} style={{ borderBottom: '1px dotted var(--line)', padding: '2px 0' }}>
                <span className="mood">{d.mood}</span> {d.title}
              </div>
            ))
          )}
        </div>
        <div className="counts" style={{ width: 190, flex: 'none' }}>
          <span>
            <b>다이어리</b>
            {diary.length}
          </span>
          <span>
            <b>방명록</b>
            {guest.length}
          </span>
          <span>
            <b>사진첩</b>
            {photo.length}
          </span>
          <span>
            <b>단짝</b>
            {jjak.length}
          </span>
        </div>
      </div>

      <Bgm />

      <div className="sect">
        <h2>Mini Room</h2>
        <em>express yourself</em>
        <span className="sp" />
        <small>눌러서 사진 바꾸기</small>
      </div>
      <div
        className="room"
        style={{ backgroundImage: me.room ? `url(${me.room})` : undefined }}
        role="button"
        tabIndex={0}
        onClick={() => pickImage((src) => setMe({ room: src }))}
        onKeyDown={(e) => e.key === 'Enter' && pickImage((src) => setMe({ room: src }))}
      >
        {!me.room && <span>내 방을 꾸며보세요 — 눌러서 사진 넣기</span>}
      </div>

      <div className="sect">
        <h2>Jjak says</h2>
        <em>what friends say</em>
        <span className="sp" />
        <Link to="/guest" style={{ fontSize: 11 }}>
          방명록 가기 →
        </Link>
      </div>
      {lastGuest ? (
        <div className="item-b">
          “{lastGuest.body}” <span style={{ color: 'var(--ink-dim)' }}>— {lastGuest.nick}</span>
        </div>
      ) : (
        <div className="empty">아직 남겨진 말이 없습니다.</div>
      )}
    </>
  )
}

/* ── 프로필 ──────────────────────────────────────────────── */
export function Profile() {
  const { me, setMe, jjak, totalCount } = useSite()
  const row = (label: string, node: React.ReactNode) => (
    <div className="form-row">
      <label>{label}</label>
      <div>{node}</div>
    </div>
  )

  return (
    <>
      <div className="sect">
        <h2>Profile</h2>
        <em>about me</em>
        <span className="sp" />
        <small>글자를 눌러 바로 고칠 수 있습니다</small>
      </div>

      {row('이름', <Ed value={me.name} onChange={(v) => setMe({ name: v })} multiline={false} maxChars={12} ph="이름" />)}
      {row('아이디', <span style={{ color: 'var(--ink-dim)' }}>{me.nick}</span>)}
      {row('성별', <Ed value={me.gender} onChange={(v) => setMe({ gender: v })} multiline={false} maxChars={4} ph="♀ / ♂" />)}
      {row('생일', <Ed value={me.birth} onChange={(v) => setMe({ birth: v })} multiline={false} maxChars={12} ph="00.00.00" />)}
      {row('좌우명', <Ed value={me.motto} onChange={(v) => setMe({ motto: v })} multiline={false} maxChars={30} ph="한 줄로" />)}
      {row('자기소개', <Ed value={me.intro} onChange={(v) => setMe({ intro: v })} ph="자기소개" />)}
      {row('단짝', `${jjak.length}명`)}
      {row('총 방문', `${totalCount.toLocaleString()}회`)}
    </>
  )
}

/* ── 다이어리 / 게시판 / 페이퍼 ──────────────────────────── */
export const Diary = () => <Posts kind="diary" />
export const Board = () => <Posts kind="board" />
export const Paper = () => <Posts kind="paper" />

/* ── 사진첩 ──────────────────────────────────────────────── */
export function Photo() {
  const { photo, addPic, setPic, delPic, addInk } = useSite()
  const viewing = useSite((s) => s.viewing)
  return (
    <>
      <div className="sect">
        <h2>Photo</h2>
        <em>my album</em>
        <span className="sp" />
        <small>{photo.length}장</small>
        <button
          className="btn btn-main"
          onClick={() =>
            pickImage((src) => {
              addPic(src, '')
              addInk(1)
            })
          }
        >
          사진 올리기
        </button>
      </div>

      {photo.length === 0 ? (
        <div className="empty">
          아직 올린 사진이 없습니다.
          <br />
          사진을 올리면 잉크가 한 방울 모입니다.
        </div>
      ) : (
        <div className="grid-pic">
          {photo.map((p) => (
            <figure className="pic" key={p.id} style={{ margin: 0 }}>
              <div className="ph" style={{ backgroundImage: `url(${p.src})` }} />
              <figcaption className="cap">
                <Ed
                  value={p.cap}
                  onChange={(v) => setPic(p.id, { cap: v })}
                  multiline={false}
                  maxChars={40}
                  ph="설명 달기"
                  label="사진 설명"
                />
                {!viewing && (
                  <button
                    className="btn-x"
                    onClick={() =>
                      void ask('이 사진을 뺄까요?', p.cap || '설명 없는 사진', '빼기').then(
                        (yes) => yes && delPic(p.id),
                      )
                    }
                    aria-label="사진 지우기"
                  >
                    ✕
                  </button>
                )}
              </figcaption>
              <div className="cap-date">{p.date}</div>
            </figure>
          ))}
        </div>
      )}
    </>
  )
}

/* ── 방명록 ──────────────────────────────────────────────── */
export function Guest() {
  const { guest, addGuest, delGuest, replyGuest, me } = useSite()
  const [nick, setNick] = useState('')
  const [body, setBody] = useState('')
  const [secret, setSecret] = useState(false)
  const [replyTo, setReplyTo] = useState('')
  const [replyText, setReplyText] = useState('')

  const submit = () => {
    if (!body.trim()) {
      void say('남길 말을 적어 주세요')
      return
    }
    addGuest(nick.trim() || '이름없음', body.trim(), secret)
    setNick('')
    setBody('')
    setSecret(false)
  }

  return (
    <>
      <div className="sect">
        <h2>Guest book</h2>
        <em>leave a word</em>
        <span className="sp" />
        <small>{guest.length}개</small>
      </div>

      <div style={{ border: '1px solid var(--line)', padding: 9, background: 'var(--tab)' }}>
        <div className="rowform" style={{ marginBottom: 6 }}>
          <input
            className="inp"
            style={{ width: 130 }}
            placeholder="이름"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={16}
          />
          <label className="chk">
            <input type="checkbox" checked={secret} onChange={(e) => setSecret(e.target.checked)} />
            비밀글
          </label>
        </div>
        <textarea
          className="ta"
          style={{ minHeight: 58 }}
          placeholder="남기고 싶은 말을 적어주세요"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div style={{ textAlign: 'right', marginTop: 6 }}>
          <button className="btn btn-main" onClick={submit}>
            남기기
          </button>
        </div>
      </div>

      <div className="list">
        {guest.map((g) => (
          <article className="item" key={g.id}>
            <div className="item-h">
              <b>
                {g.secret && <span className="lockmark" title="비밀글">[비밀]</span>}
                {g.nick}
              </b>
              <span className="sp" />
              <small>{g.date}</small>
              <button
                className="btn-x"
                onClick={() => setReplyTo(replyTo === g.id ? '' : g.id)}
                style={{ color: 'var(--accent)' }}
              >
                답글
              </button>
              <button
                className="btn-x"
                onClick={() =>
                  void ask('이 방명록을 지울까요?', `${g.nick} 님이 남긴 글`, '지우기').then(
                    (yes) => yes && delGuest(g.id),
                  )
                }
                aria-label="지우기"
              >
                ✕
              </button>
            </div>
            <div className="item-b">
              {g.secret ? '※ 비밀글입니다. 주인만 볼 수 있어요.' : g.body}
            </div>
            {g.reply && (
              <div className="reply">
                <b>{me.name}</b> — {g.reply}
              </div>
            )}
            {replyTo === g.id && (
              <div className="rowform" style={{ marginTop: 6 }}>
                <input
                  className="inp"
                  placeholder="답글 달기"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && replyText.trim()) {
                      replyGuest(g.id, replyText.trim())
                      setReplyText('')
                      setReplyTo('')
                    }
                  }}
                />
                <button
                  className="btn"
                  onClick={() => {
                    if (!replyText.trim()) return
                    replyGuest(g.id, replyText.trim())
                    setReplyText('')
                    setReplyTo('')
                  }}
                >
                  등록
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

/* ── 단짝 목록 ───────────────────────────────────────────── */
export function JjakList() {
  const { jjak, addJjak, setJjak, delJjak } = useSite()
  const viewing = useSite((s) => s.viewing)
  /** 손질 모드 — 켜면 이름·색을 고치고 뺄 수 있다 */
  const [fix, setFix] = useState(false)

  return (
    <>
      <div className="sect">
        <h2>Jjak</h2>
        <em>my close friends</em>
        <span className="sp" />
        <small>{jjak.length}명</small>
        {!viewing && (
          <>
            <button className="btn" onClick={() => setFix((v) => !v)}>
              {fix ? '다 고쳤어요' : '손질하기'}
            </button>
            <button className="btn btn-main" onClick={addJjak}>
              단짝 늘리기
            </button>
          </>
        )}
      </div>

      {jjak.length === 0 ? (
        <div className="empty">
          단짝이 없습니다.
          <br />
          위의 &lsquo;단짝 늘리기&rsquo; 로 이웃을 만들어 보세요.
        </div>
      ) : (
        <div className="jjak-grid">
          {jjak.map((j) => (
            <div className="jjak-cell" key={j.id}>
              {fix ? (
                <div className="jjak">
                  <input
                    className="jjak-hue"
                    type="color"
                    value={j.hue}
                    aria-label={`${j.nick} 색`}
                    title="색 고르기"
                    onChange={(e) => setJjak(j.id, { hue: e.target.value })}
                  />
                  <span>
                    <Ed
                      value={j.nick}
                      onChange={(v) => setJjak(j.id, { nick: v })}
                      multiline={false}
                      maxChars={14}
                      ph="이름"
                      label="단짝 이름"
                      style={{ fontWeight: 700 }}
                    />
                    <Ed
                      value={j.title}
                      onChange={(v) => setJjak(j.id, { title: v })}
                      multiline={false}
                      maxChars={22}
                      ph="기록장 이름"
                      label="단짝 기록장 이름"
                      style={{ fontSize: 11, color: 'var(--ink-dim)' }}
                    />
                  </span>
                  <button
                    className="btn-x"
                    aria-label={`${j.nick} 빼기`}
                    onClick={() =>
                      void ask('이 단짝을 뺄까요?', j.nick, '빼기').then(
                        (yes) => yes && delJjak(j.id),
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <Link className="jjak" to={`/jjak/${j.id}`} style={{ color: 'inherit' }}>
                  <i style={{ background: j.hue }} />
                  <span>
                    <b>{j.nick}</b>
                    <small>{j.title}</small>
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: 'var(--ink-dim)', fontSize: 11, marginTop: 10 }}>
        {fix
          ? '이름을 눌러 고치고, 동그라미를 눌러 색을 바꿉니다.'
          : '단짝은 지금 이 브라우저 안에만 있는 이웃입니다. 여러 사람이 실제로 오가는 기능은 나중에 붙일 수 있도록 저장소를 따로 떼어 두었습니다.'}
      </p>
    </>
  )
}

/* ── 단짝네 놀러가기 (읽기 전용) ─────────────────────────── */
export function JjakView() {
  const { id = '' } = useParams()
  const jjak = useSite((s) => s.jjak)
  const j = jjak.find((x) => x.id === id)
  if (!j) return <div className="empty">없는 단짝입니다.</div>

  const seed = [...id].reduce((n, c) => n + c.charCodeAt(0), 0)
  const lines = [
    '단짝네 기록장 견본 글 1',
    '단짝네 기록장 견본 글 2',
    '단짝네 기록장 견본 글 3',
    '단짝네 기록장 견본 글 4',
    '단짝네 기록장 견본 글 5',
  ]

  return (
    <>
      <div className="sect">
        <h2>{j.title}</h2>
        <span className="sp" />
        <Link to="/jjak" style={{ fontSize: 11 }}>
          ← 단짝 목록
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <i
          style={{
            width: 62,
            height: 62,
            background: j.hue,
            border: '1px solid rgba(0,0,0,.12)',
            flex: 'none',
          }}
        />
        <div>
          <b style={{ fontSize: 13 }}>{j.nick}</b>
          <div style={{ color: 'var(--ink-dim)', fontSize: 11.5 }}>{j.memo}</div>
          <div style={{ fontSize: 11, color: 'var(--accent)' }}>
            TODAY {(seed % 90) + 3} · TOTAL {(seed * 137).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="sect" style={{ marginTop: 8 }}>
        <h2>DIARY</h2>
      </div>
      <div className="list">
        {lines.slice(0, 3 + (seed % 3)).map((t, i) => (
          <div className="item" key={i}>
            <div className="item-h">
              <b>{t}</b>
              <span className="sp" />
              <small>2026.0{(seed + i) % 9}.1{(seed + i) % 9}</small>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--ink-dim)', fontSize: 11, marginTop: 10 }}>
        방명록을 남기려면 주인의 허락이 필요합니다. 지금은 구경만 할 수 있어요.
      </p>
    </>
  )
}

/* ── 상점 ────────────────────────────────────────────────── */
export function Shop() {
  const { ink, owned, skin, buySkin, setSkin, stamp } = useSite()

  const buy = (id: string) => {
    const r = buySkin(id)
    if (r === 'poor') void say('잉크가 모자랍니다', '다이어리나 게시판에 글을 올리면 한 방울씩 모입니다.')
  }

  return (
    <>
      <div className="sect">
        <h2>Shop</h2>
        <em>skin &amp; ink</em>
        <span className="sp" />
        <small>
          내 잉크 <b style={{ color: 'var(--accent)' }}>{ink}</b>방울
        </small>
      </div>

      <div className="shop-grid">
        {SKINS.map((s) => {
          const has = owned.includes(s.id)
          const on = skin === s.id
          return (
            <div className="shop-card" key={s.id}>
              <div className="pv" data-pv={s.id} style={pv(s.id)} />
              <b>{s.name}</b>
              <small>{s.desc}</small>
              <div style={{ marginTop: 6 }}>
                {on ? (
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>쓰는 중</span>
                ) : has ? (
                  <button className="btn" onClick={() => setSkin(s.id)}>
                    이걸로 바꾸기
                  </button>
                ) : (
                  <button className="btn btn-main" onClick={() => buy(s.id)}>
                    잉크 {s.price}방울
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="sect" style={{ marginTop: 14 }}>
        <h2>Ink</h2>
        <em>how to earn</em>
        <span className="sp" />
        <small>지금 {ink}방울</small>
      </div>
      <div className="inkbox">
        <InkJar amount={ink} />
        <div>
          <b>잉크는 이렇게 모입니다</b>
          <ul className="ink-how">
            <li>다이어리·게시판·페이퍼에 글 한 개 — <i>+1방울</i></li>
            <li>사진첩에 사진 한 장 — <i>+1방울</i></li>
            <li>하루 한 번 출석 도장 — <i>+1방울</i></li>
          </ul>
          <button
            className="btn btn-main"
            onClick={() => {
              if (stamp() === 'done')
                void say('오늘은 이미 찍었습니다', '도장은 하루에 한 번만 받을 수 있어요.')
            }}
          >
            출석 도장 찍기
          </button>
        </div>
      </div>
    </>
  )
}

const pv = (id: string): React.CSSProperties => {
  const map: Record<string, string> = {
    sky: 'linear-gradient(175deg,#bfe6fb,#8fd0f4 52%,#63b7e8)',
    pink: 'linear-gradient(175deg,#ffe6f0,#ffc6dd 52%,#ff9fc5)',
    lemon: 'linear-gradient(175deg,#fff5cf,#ffe79a 52%,#ffd75e)',
    grid: 'linear-gradient(175deg,#f2f4f7,#e4e8ee 52%,#d3d9e2)',
    night: 'linear-gradient(175deg,#2b3158,#1d2242 52%,#12162e)',
    mint: 'linear-gradient(175deg,#cdeee3,#9fdcc9 52%,#62c0a7)',
  }
  return { background: map[id] ?? map.sky }
}

/* ── 설정 ────────────────────────────────────────────────── */
export function Setting() {
  const {
    me, setMe, songId, setSong, volume, setVolume, skin, owned, setSkin, resetAll, shell, setShell,
    bgmKind, setBgmKind, fileName, setFileName, ytUrl, ytTitle, setYt,
    custom, setCustom,
    tabs, setTab, moveTab,
  } = useSite()

  /** 음악 파일 고르기 — 파일은 IndexedDB 에 넣고 이름만 설정에 남긴다 */
  const pickAudio = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      if (f.size > 30 * 1024 * 1024) {
        void say('파일이 너무 큽니다', '30MB 아래 파일로 올려 주세요.')
        return
      }
      try {
        await saveAudio(f)
        resetAudio()
        setFileName(f.name)
        setBgmKind('file')
      } catch {
        void say('음악을 저장하지 못했습니다', '다른 파일로 다시 시도해 주세요.')
      }
    }
    input.click()
  }

  const [link, setLink] = useState('')

  /** 지금 상태를 주소 하나에 담는다 */
  const shareLink = async () => {
    const { url, dropped, kb } = await makeShareLink(useSite.getState() as never)
    setLink(url)
    try {
      await navigator.clipboard.writeText(url)
      void say(
        '링크를 복사했습니다',
        dropped.length
          ? `사진은 빠졌습니다 (주소 길이 ${kb}KB). 사진까지 옮기려면 파일로 내보내기를 쓰세요.`
          : `주소 길이 ${kb}KB. 붙여넣어 공유하세요.`,
      )
    } catch {
      void say('링크를 만들었습니다', '아래 칸의 주소를 직접 복사해 주세요.')
    }
  }

  /** 내보낸 파일을 도로 읽어들인다 */
  const importJson = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return
      const fr = new FileReader()
      fr.onload = () => {
        try {
          const data = JSON.parse(String(fr.result)) as Record<string, unknown>
          if (!data.me) throw new Error('bad')
          void ask('이 파일로 바꿀까요?', '지금 쓰던 내용은 덮어써집니다.', '불러오기').then(
            (yes) => {
              if (!yes) return
              useSite.setState({ ...(data as Record<string, unknown>), viewing: false } as never)
            },
          )
        } catch {
          void say('파일을 읽지 못했습니다', '아이로그에서 내보낸 파일인지 확인해 주세요.')
        }
      }
      fr.readAsText(f)
    }
    input.click()
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(useSite.getState(), null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ilog-backup.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <div className="sect">
        <h2>Setting</h2>
        <em>my account</em>
      </div>

      <div className="form-row">
        <label>기록장 이름</label>
        <div>
          <input
            className="inp"
            value={me.homeTitle}
            onChange={(e) => setMe({ homeTitle: e.target.value })}
            maxLength={24}
          />
        </div>
      </div>

      <div className="form-row">
        <label>아이디</label>
        <div>
          <input
            className="inp"
            value={me.nick}
            onChange={(e) => setMe({ nick: e.target.value })}
            maxLength={16}
          />
        </div>
      </div>

      <div className="form-row">
        <label>스킨</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {SKINS.filter((s) => owned.includes(s.id)).map((s) => (
            <button
              key={s.id}
              className={`btn ${skin === s.id ? 'btn-main' : ''}`}
              onClick={() => setSkin(s.id)}
            >
              {s.name}
            </button>
          ))}
          <Link className="btn" to="/shop" style={{ textDecoration: 'none' }}>
            상점에서 더 보기
          </Link>
        </div>
      </div>

      <div className="form-row">
        <label>탭 이름</label>
        <div>
          <div className="tabcfg">
            {tabs.map((t, i) => (
              <div className="tabcfg-row" key={t.id}>
                <input
                  className="inp"
                  value={t.label}
                  maxLength={8}
                  aria-label={`${t.label} 탭 이름`}
                  onChange={(e) => setTab(t.id, { label: e.target.value })}
                />
                <button
                  className="btn"
                  disabled={i === 0}
                  aria-label="위로"
                  onClick={() => moveTab(t.id, -1)}
                >
                  ↑
                </button>
                <button
                  className="btn"
                  disabled={i === tabs.length - 1}
                  aria-label="아래로"
                  onClick={() => moveTab(t.id, 1)}
                >
                  ↓
                </button>
                <button
                  className={`btn ${t.on ? 'btn-main' : ''}`}
                  onClick={() => setTab(t.id, { on: !t.on })}
                >
                  {t.on ? '보임' : '숨김'}
                </button>
              </div>
            ))}
          </div>
          <p className="hint">
            이름을 바꾸고, 순서를 옮기고, 안 쓰는 탭은 숨길 수 있습니다.
            <br />
            숨겨도 안에 쓴 글은 지워지지 않습니다.
          </p>
        </div>
      </div>

      <div className="form-row">
        <label>공유</label>
        <div>
          <div className="pickrow">
            <button className="btn btn-main" onClick={shareLink}>
              공유 링크 만들기
            </button>
            <button className="btn" onClick={exportJson}>
              파일로 내보내기
            </button>
            <button className="btn" onClick={importJson}>
              파일 불러오기
            </button>
          </div>
          {link && (
            <input
              className="inp"
              style={{ marginTop: 7 }}
              value={link}
              readOnly
              aria-label="공유 링크"
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
          <p className="hint">
            링크는 글·설정만 담고 <b>사진은 빠집니다</b> (주소에 담기엔 너무 큽니다).
            <br />
            사진까지 그대로 옮기려면 <b>파일로 내보내기</b>를 쓰세요.
          </p>
        </div>
      </div>

      <div className="form-row">
        <label>직접 꾸미기</label>
        <div>
          <div className="pickrow">
            <button
              className={`btn ${custom.on ? 'btn-main' : ''}`}
              onClick={() => setCustom({ on: !custom.on })}
            >
              {custom.on ? '내 꾸밈새 쓰는 중' : '내 꾸밈새로 바꾸기'}
            </button>
          </div>

          {custom.on && (
            <div className="deco-box">
              <div className="deco-row">
                <span>바탕색</span>
                <input
                  type="color"
                  value={custom.bgColor}
                  aria-label="바탕색"
                  onChange={(e) => setCustom({ bgColor: e.target.value })}
                />
                <span>포인트색</span>
                <input
                  type="color"
                  value={custom.accent}
                  aria-label="포인트색"
                  onChange={(e) => setCustom({ accent: e.target.value })}
                />
                <span>연한 포인트</span>
                <input
                  type="color"
                  value={custom.accent2}
                  aria-label="연한 포인트색"
                  onChange={(e) => setCustom({ accent2: e.target.value })}
                />
                <span>종이색</span>
                <input
                  type="color"
                  value={custom.paper}
                  aria-label="종이색"
                  onChange={(e) => setCustom({ paper: e.target.value })}
                />
              </div>

              <div className="pickrow" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  onClick={() => pickImage((src) => setCustom({ bgImage: src }), 1400)}
                >
                  {custom.bgImage ? '바탕 그림 바꾸기' : '바탕 그림 넣기'}
                </button>
                {custom.bgImage && (
                  <button className="btn" onClick={() => setCustom({ bgImage: '' })}>
                    그림 빼기
                  </button>
                )}
              </div>

              {custom.bgImage && (
                <>
                  <div className="pickrow" style={{ marginTop: 6 }}>
                    <button
                      className={`btn ${custom.bgFit === 'tile' ? 'btn-main' : ''}`}
                      onClick={() => setCustom({ bgFit: 'tile' })}
                    >
                      무늬처럼 반복
                    </button>
                    <button
                      className={`btn ${custom.bgFit === 'cover' ? 'btn-main' : ''}`}
                      onClick={() => setCustom({ bgFit: 'cover' })}
                    >
                      꽉 채우기
                    </button>
                  </div>
                  {custom.bgFit === 'tile' && (
                    <div style={{ marginTop: 6 }}>
                      <div className="field-l" style={{ fontSize: 10.5 }}>
                        <span>무늬 크기</span>
                        <i>{custom.bgSize}px</i>
                      </div>
                      <input
                        type="range"
                        min={16}
                        max={320}
                        value={custom.bgSize}
                        aria-label="무늬 크기"
                        style={{ width: '100%' }}
                        onChange={(e) => setCustom({ bgSize: Number(e.target.value) })}
                      />
                    </div>
                  )}
                </>
              )}

              <p className="hint">
                상점 스킨을 고르면 내 꾸밈새는 잠시 꺼집니다. 다시 켜면 고른 색이 그대로 돌아옵니다.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <label>노래</label>
        <div>
          <div className="pickrow">
            {(
              [
                ['builtin', '내장곡'],
                ['file', '내 파일'],
                ['youtube', '유튜브'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                className={`btn ${bgmKind === k ? 'btn-main' : ''}`}
                onClick={() => setBgmKind(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {bgmKind === 'builtin' && (
            <select
              className="inp"
              style={{ marginTop: 7 }}
              value={songId}
              onChange={(e) => setSong(e.target.value)}
            >
              {TRACKS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {s.artist}
                </option>
              ))}
            </select>
          )}

          {bgmKind === 'file' && (
            <div style={{ marginTop: 7 }}>
              <div className="pickrow">
                <button className="btn" onClick={pickAudio}>
                  {fileName ? '다른 파일 고르기' : '음악 파일 고르기'}
                </button>
                {fileName && (
                  <button
                    className="btn"
                    onClick={() => {
                      void clearAudio()
                      resetAudio()
                      setFileName('')
                    }}
                  >
                    빼기
                  </button>
                )}
              </div>
              <p className="hint">
                {fileName ? `지금 올린 파일 — ${fileName}` : 'mp3 · m4a · wav 같은 음악 파일'}
                <br />
                파일은 이 브라우저 안에만 저장되고 어디로도 전송되지 않습니다.
              </p>
            </div>
          )}

          {bgmKind === 'youtube' && (
            <div style={{ marginTop: 7 }}>
              <input
                className="inp"
                placeholder="유튜브 주소를 붙여넣으세요"
                value={ytUrl}
                onChange={(e) => setYt(e.target.value, ytTitle)}
              />
              <input
                className="inp"
                style={{ marginTop: 5 }}
                placeholder="화면에 보일 곡 이름 (선택)"
                value={ytTitle}
                onChange={(e) => setYt(ytUrl, e.target.value)}
                maxLength={40}
              />
              <p className="hint">
                {ytUrl
                  ? youtubeId(ytUrl)
                    ? '주소를 읽었습니다. 대문에서 ▶ 를 눌러 재생하세요.'
                    : '주소를 읽지 못했습니다. 영상 주소인지 확인해 주세요.'
                  : '예) https://www.youtube.com/watch?v=... 또는 https://youtu.be/...'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="form-row">
        <label>소리 크기</label>
        <div>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            aria-label="소리 크기"
            style={{ width: 180 }}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span style={{ marginLeft: 8, color: "var(--ink-dim)" }}>{volume}%</span>
        </div>
      </div>

      <div className="form-row">
        <label>보는 방식</label>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            className={`btn ${shell === 'web' ? 'btn-main' : ''}`}
            onClick={() => setShell('web')}
          >
            웹사이트
          </button>
          <button
            className={`btn ${shell === 'app' ? 'btn-main' : ''}`}
            onClick={() => setShell('app')}
          >
            프로그램 창
          </button>
        </div>
      </div>

      <div className="form-row">
        <label>내 자료</label>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="btn" onClick={exportJson}>
            백업 파일 내려받기
          </button>
          <button
            className="btn"
            onClick={() =>
              void ask('처음 상태로 되돌릴까요?', '쓴 글과 올린 사진이 전부 지워집니다.', '되돌리기').then(
                (yes) => yes && resetAll(),
              )
            }
          >
            처음 상태로 되돌리기
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 10 }}>
        아이로그는 지금 이 브라우저에만 자료를 저장합니다. 다른 기기에서 이어 쓰려면 백업 파일을
        옮겨 주세요.
      </p>
      <p className="buildmark">판 {__BUILD__}</p>
    </>
  )
}
