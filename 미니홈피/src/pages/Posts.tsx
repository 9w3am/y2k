import { useState } from 'react'
import { MOODS, WEATHERS, useSite, type PostKind } from '../lib/store'
import { ask, say } from '../ui/dialog'

const TITLE: Record<PostKind, { h: string; sub: string; ph: string; note: string }> = {
  diary: { h: 'Diary', sub: 'today story', ph: '오늘 하루는 어땠나요', note: '기분과 날씨를 골라 하루를 남겨보세요.' },
  board: { h: 'Board', sub: 'anything goes', ph: '하고 싶은 말', note: '아무 말이나 붙여두는 게시판입니다.' },
  paper: { h: 'Paper', sub: 'scrap book', ph: '스크랩해둘 글', note: '퍼온 글과 좋았던 문장을 모아두는 곳입니다.' },
}

export function Posts({ kind }: { kind: PostKind }) {
  const list = useSite((s) => s[kind])
  const viewing = useSite((s) => s.viewing)
  const { addPost, editPost, delPost, addInk } = useSite()

  const [open, setOpen] = useState(false)
  /** 비어 있으면 새 글, 값이 있으면 그 글을 고치는 중 */
  const [editing, setEditing] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState(MOODS[0])
  const [weather, setWeather] = useState(WEATHERS[0])
  const meta = TITLE[kind]

  const reset = () => {
    setEditing('')
    setTitle('')
    setBody('')
    setMood(MOODS[0])
    setWeather(WEATHERS[0])
    setOpen(false)
  }

  const startNew = () => {
    if (open && !editing) return reset()
    setEditing('')
    setTitle('')
    setBody('')
    setMood(MOODS[0])
    setWeather(WEATHERS[0])
    setOpen(true)
  }

  const startEdit = (id: string) => {
    const p = list.find((x) => x.id === id)
    if (!p) return
    setEditing(id)
    setTitle(p.title)
    setBody(p.body)
    setMood(p.mood || MOODS[0])
    setWeather(p.weather || WEATHERS[0])
    setOpen(true)
  }

  const submit = () => {
    if (!title.trim() && !body.trim()) {
      void say('제목이나 내용 중 하나는 채워 주세요')
      return
    }
    const next = { title: title.trim() || '제목 없음', body: body.trim(), mood, weather }
    if (editing) {
      editPost(kind, editing, next)
    } else {
      addPost(kind, next)
      addInk(1) // 새 글을 올리면 잉크가 한 방울 모인다
    }
    reset()
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              className="inp"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={40}
            />
            {kind === 'diary' && (
              <>
                <select
                  className="inp"
                  style={{ width: 72 }}
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  aria-label="기분"
                >
                  {MOODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="inp"
                  style={{ width: 74 }}
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
            className="ta"
            placeholder={meta.ph}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
            <small style={{ color: 'var(--ink-dim)', flex: 1 }}>
              {editing ? '고쳐도 올린 날짜는 그대로입니다.' : '글을 올리면 잉크가 한 방울 모입니다.'}
            </small>
            <button className="btn" onClick={reset}>
              취소
            </button>
            <button className="btn btn-main" onClick={submit}>
              {editing ? '고치기' : '올리기'}
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">
          아직 남긴 글이 없습니다.
          <br />
          {meta.note}
        </div>
      ) : (
        <div className="list">
          {list.map((p) => (
            <article className={`item ${editing === p.id ? 'editing' : ''}`} key={p.id}>
              <div className="item-h">
                {kind === 'diary' && (
                  <span className="mood" aria-label="기분">
                    {p.mood}
                  </span>
                )}
                <b>{p.title}</b>
                <span className="sp" />
                <small>
                  {kind === 'diary' && `${p.weather} · `}
                  {p.date}
                </small>
                {!viewing && (
                  <>
                    <button
                      className="btn-x wide"
                      onClick={() => startEdit(p.id)}
                      aria-label="글 고치기"
                    >
                      고치기
                    </button>
                    <button
                      className="btn-x"
                      onClick={() =>
                        void ask('이 글을 지울까요?', p.title, '지우기').then(
                          (yes) => yes && delPost(kind, p.id),
                        )
                      }
                      aria-label="글 지우기"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
              {p.body && <div className="item-b">{p.body}</div>}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
