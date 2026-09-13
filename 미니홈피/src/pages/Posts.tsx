import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MOODS, WEATHERS, useSite, type PostKind } from '../lib/store'
import { ask, say } from '../ui/dialog'
import { pickImage } from '../lib/img'
import { deleteImage, putImage, useImg } from '../lib/imageStore'

/* ══════════════════════════════════════════════════════════
   다이어리 · 게시판 · 페이퍼 — 블로그처럼
   목록은 사진·요약이 보이는 카드, 글은 따로 여는 페이지,
   글마다 카테고리·사진·공감·댓글.
   ══════════════════════════════════════════════════════════ */

const TITLE: Record<PostKind, { h: string; sub: string; ph: string }> = {
  diary: { h: 'Diary', sub: 'today story', ph: '오늘 하루는 어땠나요' },
  board: { h: 'Board', sub: 'anything goes', ph: '하고 싶은 말' },
  paper: { h: 'Paper', sub: 'scrap book', ph: '스크랩해둘 글' },
}
const KINDS: PostKind[] = ['diary', 'board', 'paper']
const isKind = (k: string | undefined): k is PostKind => !!k && (KINDS as string[]).includes(k)

/** 공감은 이 브라우저에서 한 글에 한 번 — 누른 글을 기억해 둔다 */
const LIKED = 'ilog:liked'
const likedSet = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED) || '[]') as string[])
  } catch {
    return new Set()
  }
}
const saveLiked = (s: Set<string>) => {
  try {
    localStorage.setItem(LIKED, JSON.stringify([...s]))
  } catch {
    /* 저장 못 해도 이번엔 반영된다 */
  }
}

function Thumb({ value }: { value: string }) {
  const url = useImg(value)
  return <div className="post-thumb" style={{ backgroundImage: url ? `url(${url})` : undefined }} />
}

function PostImg({ value }: { value: string }) {
  const url = useImg(value)
  return url ? <img className="post-img" src={url} alt="" /> : <div className="post-img post-img-wait" />
}

/* ── 목록 + 글쓰기 ──────────────────────────────────────── */
export function Posts({ kind }: { kind: PostKind }) {
  const list = useSite((s) => s[kind])
  const viewing = useSite((s) => s.viewing)
  const { addPost, editPost, addInk } = useSite()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const meta = TITLE[kind]

  const [open, setOpen] = useState(false)
  /** 비어 있으면 새 글, 값이 있으면 그 글을 고치는 중 */
  const [editing, setEditing] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [mood, setMood] = useState(MOODS[0])
  const [weather, setWeather] = useState(WEATHERS[0])
  /** 목록을 이 카테고리로만 거른다 — 비어 있으면 전체 */
  const [cat, setCat] = useState('')

  const categories = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of list) if (p.category) m.set(p.category, (m.get(p.category) ?? 0) + 1)
    return [...m.entries()]
  }, [list])
  const shown = cat ? list.filter((p) => p.category === cat) : list

  const clear = () => {
    setEditing('')
    setTitle('')
    setBody('')
    setCategory('')
    setImages([])
    setMood(MOODS[0])
    setWeather(WEATHERS[0])
  }
  const close = () => {
    clear()
    setOpen(false)
  }
  const startNew = () => {
    if (open && !editing) return close()
    clear()
    setOpen(true)
  }
  const startEdit = (id: string) => {
    const p = list.find((x) => x.id === id)
    if (!p) return
    setEditing(id)
    setTitle(p.title)
    setBody(p.body)
    setCategory(p.category ?? '')
    setImages(p.images ?? [])
    setMood(p.mood || MOODS[0])
    setWeather(p.weather || WEATHERS[0])
    setOpen(true)
  }

  // 글 보기에서 '고치기'를 누르면 ?edit=아이디 로 넘어온다
  useEffect(() => {
    const id = params.get('edit')
    if (!id) return
    startEdit(id)
    const next = new URLSearchParams(params)
    next.delete('edit')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const addImage = () =>
    pickImage(async (src) => {
      const ref = await putImage(src)
      setImages((v) => [...v, ref])
    })

  const submit = () => {
    if (!title.trim() && !body.trim() && images.length === 0) {
      void say('제목이나 내용 중 하나는 채워 주세요')
      return
    }
    const next = {
      title: title.trim() || '제목 없음',
      body: body.trim(),
      mood,
      weather,
      category: category.trim(),
      images,
    }
    if (editing) {
      // 고치면서 뺀 사진은 보관소에서도 지운다
      const old = list.find((p) => p.id === editing)?.images ?? []
      old.filter((r) => !images.includes(r)).forEach((r) => void deleteImage(r))
      editPost(kind, editing, next)
      const id = editing
      close()
      nav(`/post/${kind}/${id}`)
    } else {
      addPost(kind, next)
      addInk(1)
      close()
    }
  }

  return (
    <>
      <div className="sect">
        <h2>{meta.h}</h2>
        <em>{meta.sub}</em>
        <span className="sp" />
        <small>{list.length}개</small>
        {!viewing && (
          <button className="btn btn-main" onClick={startNew}>
            {open && !editing ? '접기' : '글쓰기'}
          </button>
        )}
      </div>

      {open && !viewing && (
        <div className="writer">
          {editing && <div className="writer-tag">고치는 중</div>}
          <div className="writer-row">
            <input
              className="inp"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="writer-row">
            <input
              className="inp"
              placeholder="카테고리"
              value={category}
              list={`cats-${kind}`}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={16}
            />
            <datalist id={`cats-${kind}`}>
              {categories.map(([c]) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {kind === 'diary' && (
              <>
                <select
                  className="inp writer-pick"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  aria-label="기분"
                >
                  {MOODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="inp writer-pick"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  aria-label="날씨"
                >
                  {WEATHERS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </>
            )}
          </div>
          <textarea
            className="ta writer-ta"
            placeholder={meta.ph}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {images.length > 0 && (
            <div className="writer-imgs">
              {images.map((r) => (
                <div className="writer-img" key={r}>
                  <Thumb value={r} />
                  <button
                    className="btn-x"
                    aria-label="사진 빼기"
                    onClick={() => setImages((v) => v.filter((x) => x !== r))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="writer-foot">
            <button className="btn" onClick={addImage}>
              사진 넣기
            </button>
            <span className="sp" />
            <button className="btn" onClick={close}>
              취소
            </button>
            <button className="btn btn-main" onClick={submit}>
              {editing ? '고치기' : '올리기'}
            </button>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="cat-row">
          <button className={`cat ${cat === '' ? 'on' : ''}`} onClick={() => setCat('')}>
            전체 <i>{list.length}</i>
          </button>
          {categories.map(([c, n]) => (
            <button key={c} className={`cat ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
              {c} <i>{n}</i>
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="empty">아직 남긴 글이 없습니다.</div>
      ) : (
        <div className="post-list">
          {shown.map((p) => (
            <Link className="post-card" key={p.id} to={`/post/${kind}/${p.id}`}>
              {p.images && p.images.length > 0 && <Thumb value={p.images[0]} />}
              <div className="post-main">
                <div className="post-meta">
                  {p.category && <span className="chip">{p.category}</span>}
                  {kind === 'diary' && <span className="mood">{p.mood}</span>}
                  <span>
                    {kind === 'diary' ? `${p.weather} · ` : ''}
                    {p.date}
                  </span>
                </div>
                <b className="post-title">{p.title}</b>
                {p.body && <p className="post-excerpt">{p.body.slice(0, 120)}</p>}
                <div className="post-stats">
                  <span>♥ {p.likes ?? 0}</span>
                  <span>댓글 {p.comments?.length ?? 0}</span>
                  {p.images && p.images.length > 1 && <span>사진 {p.images.length}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

/* ── 글 한 편 ───────────────────────────────────────────── */
export function PostView() {
  const { kind = '', id = '' } = useParams()
  const k: PostKind = isKind(kind) ? kind : 'diary'
  const list = useSite((s) => s[k])
  const viewing = useSite((s) => s.viewing)
  const { delPost, likePost, addComment, delComment, me } = useSite()
  const nav = useNavigate()
  const [nick, setNick] = useState('')
  const [text, setText] = useState('')
  const [liked, setLiked] = useState(() => likedSet().has(`${kind}:${id}`))

  useEffect(() => {
    setLiked(likedSet().has(`${kind}:${id}`))
    window.scrollTo(0, 0)
  }, [kind, id])

  const i = list.findIndex((p) => p.id === id)
  const p = list[i]
  if (!isKind(kind) || !p)
    return (
      <div className="empty">
        없는 글입니다. <Link to={isKind(kind) ? `/${kind}` : '/diary'}>목록으로</Link>
      </div>
    )

  const meta = TITLE[kind]
  const newer = list[i - 1]
  const older = list[i + 1]

  const toggleLike = () => {
    const key = `${kind}:${p.id}`
    const s = likedSet()
    if (s.has(key)) {
      s.delete(key)
      likePost(kind, p.id, -1)
      setLiked(false)
    } else {
      s.add(key)
      likePost(kind, p.id, 1)
      setLiked(true)
    }
    saveLiked(s)
  }

  const remove = () =>
    void ask('이 글을 지울까요?', p.title, '지우기').then((yes) => {
      if (!yes) return
      ;(p.images ?? []).forEach((r) => void deleteImage(r))
      delPost(kind, p.id)
      nav(`/${kind}`)
    })

  const send = () => {
    if (!text.trim()) return
    addComment(kind, p.id, nick.trim() || me.name || '이름 없음', text.trim())
    setText('')
  }

  return (
    <>
      <div className="sect">
        <h2>{meta.h}</h2>
        <em>{meta.sub}</em>
        <span className="sp" />
        <Link to={`/${kind}`} style={{ fontSize: 11 }}>
          목록
        </Link>
      </div>

      <article className="post-view">
        <div className="post-meta">
          {p.category && <span className="chip">{p.category}</span>}
          {kind === 'diary' && <span className="mood">{p.mood}</span>}
          <span>
            {kind === 'diary' ? `${p.weather} · ` : ''}
            {p.date}
          </span>
        </div>
        <h3 className="post-view-title">{p.title}</h3>
        {(p.images ?? []).map((r) => (
          <PostImg key={r} value={r} />
        ))}
        {p.body && <div className="post-body">{p.body}</div>}
        <div className="post-actions">
          <button className={`like ${liked ? 'on' : ''}`} onClick={toggleLike} aria-pressed={liked}>
            ♥ 공감 <b>{p.likes ?? 0}</b>
          </button>
          <span className="sp" />
          {!viewing && (
            <>
              <Link className="btn" to={`/${kind}?edit=${p.id}`}>
                고치기
              </Link>
              <button className="btn" onClick={remove}>
                지우기
              </button>
            </>
          )}
        </div>
      </article>

      <div className="sect" style={{ marginTop: 12 }}>
        <h2>Comment</h2>
        <span className="sp" />
        <small>{p.comments?.length ?? 0}개</small>
      </div>
      {p.comments && p.comments.length > 0 && (
        <ul className="cmt-list">
          {p.comments.map((c) => (
            <li key={c.id}>
              <b>{c.nick}</b>
              <span className="cmt-body">{c.body}</span>
              <small>{c.date}</small>
              {!viewing && (
                <button
                  className="btn-x"
                  aria-label="댓글 지우기"
                  onClick={() =>
                    void ask('이 댓글을 지울까요?', c.body.slice(0, 30), '지우기').then(
                      (yes) => yes && delComment(kind, p.id, c.id),
                    )
                  }
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!viewing && (
        <div className="cmt-form">
          <input
            className="inp"
            placeholder="이름"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={12}
          />
          <input
            className="inp"
            placeholder="댓글"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            maxLength={200}
          />
          <button className="btn btn-main" onClick={send}>
            남기기
          </button>
        </div>
      )}

      <nav className="post-nav">
        {newer ? (
          <Link to={`/post/${kind}/${newer.id}`}>
            ‹ 다음 글 <b>{newer.title}</b>
          </Link>
        ) : (
          <span />
        )}
        {older ? (
          <Link to={`/post/${kind}/${older.id}`}>
            이전 글 <b>{older.title}</b> ›
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  )
}
