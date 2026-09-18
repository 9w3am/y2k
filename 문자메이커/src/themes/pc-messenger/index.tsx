import './theme.css'
import { ScreenFx, ScreenFxPanel, useFxRoot } from '../../editable/ScreenFx'
import { ScreenPhoto, ScreenPhotoPanel } from '../../editable/ScreenPhoto'
import { EditableText, ByteCounter } from '../../editable/EditableText'
import { useStore, useValue } from '../../lib/store'
import { krByte } from '../../lib/krByte'
import { Section, Seg, Slider, SwitchField } from '../../ui/controls'

const MENUS = ['파일(F)', '메시지(M)', '도구(T)', '동작(A)', '도움말(H)']
const TABS = ['대화', '쪽지', '문자메시지', '메일']

/** 그 시절 문자에 실어 보내던 것들 — 누르면 본문에 붙는다 */
const EMO: Record<string, { name: string; items: string[] }> = {
  face: {
    name: '얼굴',
    items: [
      '^^', '^^*', '^0^', '^-^', '*^^*', '^_^;',
      'ㅠㅠ', 'ㅜㅜ', 'ㅠ_ㅠ', '-_-', '-_-+', '=_=',
      '>_<', 'ㅇ_ㅇ', 'ㅡ,.ㅡ', '(^^)', '(ㅠ_ㅠ)', '(-_-)',
    ],
  },
  sign: {
    name: '기호',
    items: [
      '♥', '♡', '★', '☆', '♪', '♬',
      '☎', '☞', '☜', '※', '◈', '♨',
      '▶', '◀', '◆', '□', '■', '○',
    ],
  },
  deco: {
    name: '꾸밈',
    items: [
      'ㅎㅎ', 'ㅋㅋ', 'ㅡ.ㅡ', '~~', '~*', '!!',
      '??', '...', 'ㅇㅇ', 'ㄱㄱ', 'ㅅㄱ', 'ㅂㅂ',
      'ㅊㅋ', 'ㄳ', 'ㅈㅅ', '↑', '↓', '→',
    ],
  },
}

const CHARS = [
  '▶', '◀', '▲', '▼', '★', '☆', '♥', '♡',
  '♠', '♣', '♦', '◈', '◆', '□', '■', '○',
  '●', '◎', '◇', '※', '☞', '☜', '♨', '☎',
  '♬', '♪', '♩', '♭', '↑', '↓', '→', '←',
  '＠', '＃', '＄', '％', '＆', '＊', '～', '＋',
]

function MailIcon() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" shapeRendering="crispEdges" aria-hidden="true">
      {/* 선(stroke)은 기기마다 굵기가 달라져 칸을 칠해 그린다 */}
      <path d="M0 0h11v9H0z" fill="#5a6b7d" />
      <path d="M1 1h9v7H1z" fill="#f6f8fb" />
      <path d="M1 1h1v1h-1zM9 1h1v1h-1zM2 2h1v1h-1zM8 2h1v1h-1zM3 3h1v1h-1zM7 3h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM5 5h1v1h-1z" fill="#5a6b7d" />
    </svg>
  )
}

export function Screen() {
  const fx = useFxRoot()
  const set = useStore((s) => s.set)
  const body = useValue('body')
  const maxByte = Number(useValue('maxByte'))
  const tab = useValue('tab')
  const skin = useValue('skin')
  const emoSet = useValue('emoSet')
  // 훅은 조건 밖에서 전부 부른다 — 조건부 JSX 안에서 부르면 렌더마다 개수가 달라져 터진다
  const lcdSize = useValue('lcdSize')
  const showEmo = useValue('showEmo') === '1'
  const showChars = useValue('showChars') === '1'
  const showAd = useValue('showAd') === '1'
  const showStatus = useValue('showStatus') === '1'
  const adBlink = useValue('adBlink') === '1'

  /** 본문 뒤에 붙인다. 넘치면 넣지 않는다. */
  const insert = (ch: string) => {
    if (krByte(body + ch) > maxByte) return
    set('body', body + ch)
  }

  return (
    <div className={`t-xp skin-${skin} ${fx.className}`} style={fx.style}>
      <ScreenPhoto />
      <div className="tb">
        <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
          <rect x="2.5" y="0.5" width="8" height="12" rx="1.5" fill="#dfe9f5" stroke="#2b5ea8" />
          <rect x="3.5" y="2" width="6" height="7" fill="#9fd0a8" />
        </svg>
        <EditableText k="winTitle" multiline={false} maxChars={14} />
        <span className="tb-spacer" />
        <span className="wbtn" aria-hidden="true">－</span>
        <span className="wbtn" aria-hidden="true">□</span>
        <span className="wbtn close" aria-hidden="true">✕</span>
      </div>

      <div className="mb">
        {MENUS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>

      <div className="tabs">
        {TABS.map((t, i) => (
          <span
            key={t}
            className={`tab ${tab === String(i + 1) ? 'on' : ''}`}
            onClick={() => set('tab', String(i + 1))}
          >
            {t}
          </span>
        ))}
        <span className="right">｜ 통합메시지함</span>
      </div>

      <div className="body">
        {/* 왼쪽 — 휴대폰 미리보기와 받는 사람 */}
        <div className="col-l">
          <div className="phone">
            <div className="lcd">
              <EditableText
                k="body"
                maxBytes={maxByte}
                placeholder="보낼 내용을 쓰세요"
                style={{ minHeight: 86, fontSize: `${lcdSize}px` }}
              />
              <div className="lcd-byte">
                <ByteCounter sourceKey="body" overrideKey="byteOverride" max={maxByte} /> Byte
              </div>
            </div>
            <div className="pad" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </div>

          <div>
            <div className="row">
              <span className="lbl" style={{ flex: 1 }}>
                받는 사람
              </span>
              <span className="addr">주소록 추가</span>
            </div>
            {(['to', 'to2', 'to3'] as const).map((k) => (
              <div className="fld" key={k} style={{ marginTop: 2 }}>
                <EditableText k={k} multiline={false} maxChars={13} placeholder="01012345678" />
              </div>
            ))}
          </div>

          <div>
            <div className="lbl">보내는 사람</div>
            <div className="fld">
              <EditableText k="from" multiline={false} maxChars={13} />
            </div>
          </div>
        </div>

        {/* 가운데 — 이모티콘과 특수문자 (누르면 본문에 붙는다) */}
        <div className="col-m">
          {showEmo && (
            <div className="grp" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="grp-t">이모티콘</div>
              <div className="emo-tabs">
                {Object.entries(EMO).map(([id, g]) => (
                  <button
                    key={id}
                    className={emoSet === id ? 'on' : ''}
                    onClick={() => set('emoSet', id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              <div className="emo-grid">
                {(EMO[emoSet] ?? EMO.face).items.map((e, i) => (
                  <button key={i} title={`${e} 넣기`} onClick={() => insert(e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showChars && (
            <div className="grp" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="grp-t">특수문자</div>
              <div className="chars">
                {CHARS.map((c, i) => (
                  <button key={i} title={`${c} 넣기`} onClick={() => insert(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 — 잔액과 메시지함 */}
        <div className="col-r">
          <div className="grp">
            <div className="info">
              <b>남은 무료</b>
              <EditableText k="free" multiline={false} maxChars={4} />
            </div>
            <div className="info">
              <b>캐시 잔액</b>
              <EditableText k="cash" multiline={false} maxChars={7} />
            </div>
          </div>

          <div className="cashmark">
            <EditableText k="cashMark" multiline={false} maxChars={14} />
          </div>

          <div className="grp" style={{ textAlign: 'center', color: '#26497e' }}>
            <EditableText k="prefix" style={{ fontSize: 10, lineHeight: 1.35 }} />
          </div>

          <div className="rbtn box">
            <MailIcon />
            <EditableText k="sentLabel" multiline={false} maxChars={9} />
            <b>
              <EditableText k="sentCount" multiline={false} maxChars={4} />
            </b>
          </div>
          <div className="rbtn box">
            <MailIcon />
            <EditableText k="planLabel" multiline={false} maxChars={9} />
            <b>
              <EditableText k="planCount" multiline={false} maxChars={4} />
            </b>
          </div>

          {showAd && (
            <div className={`ad ${adBlink ? 'blink' : ''}`}>
              <EditableText k="adLine" className="ad-l" multiline={false} maxChars={12} />
              <EditableText k="adSub" className="ad-s" multiline={false} maxChars={18} />
              <EditableText k="adBtn" className="ad-b" multiline={false} maxChars={8} />
            </div>
          )}
        </div>
      </div>

      <div className="foot">
        <EditableText k="btn1" className="xbtn" multiline={false} maxChars={7} />
        <EditableText k="btn2" className="xbtn" multiline={false} maxChars={7} />
        <EditableText k="btn3" className="xbtn" multiline={false} maxChars={7} />
      </div>

      {showStatus && (
        <div className="statusbar">
          <EditableText k="statusText" multiline={false} maxChars={30} />
          <span className="sp" />
          <span className="grip" aria-hidden="true" />
        </div>
      )}

      <ScreenFx />
    </div>
  )
}

export function Panel() {
  return (
    <>
      <Section
        n="01"
        title="이 화면은"
        note="이모티콘·특수문자를 누르면 왼쪽 화면에 붙습니다. 글자는 전부 눌러서 고칠 수 있습니다."
      >
        <Seg
          k="tab"
          label="열려 있는 탭"
          options={[
            { value: '1', label: '대화' },
            { value: '2', label: '쪽지' },
            { value: '3', label: '문자' },
            { value: '4', label: '메일' },
          ]}
        />
        <Seg
          k="maxByte"
          label="최대 바이트"
          options={[
            { value: '80', label: '80byte' },
            { value: '90', label: '90byte' },
          ]}
        />
        <Slider k="lcdSize" label="휴대폰 글자 크기" min={9} max={18} suffix="px" />
      </Section>

      <Section n="02" title="이모티콘" note="누르면 왼쪽 휴대폰 화면에 바로 붙습니다.">
        <Seg
          k="emoSet"
          label="묶음"
          options={[
            { value: 'face', label: '얼굴' },
            { value: 'sign', label: '기호' },
            { value: 'deco', label: '꾸밈' },
          ]}
        />
        <SwitchField k="showEmo" label="이모티콘 칸 보이기" />
        <SwitchField k="showChars" label="특수문자 칸 보이기" />
      </Section>

      <Section n="03" title="창 꾸미기">
        <Seg
          k="skin"
          label="창 색상"
          options={[
            { value: 'luna', label: '파랑' },
            { value: 'silver', label: '은색' },
            { value: 'olive', label: '올리브' },
          ]}
        />
        <SwitchField k="showStatus" label="아래 상태줄" />
        <SwitchField k="showAd" label="광고 배너" />
        <SwitchField k="adBlink" label="광고 글자 깜빡이기" />
      </Section>

      <ScreenFxPanel n="04" />
      <ScreenPhotoPanel n="05" />
    </>
  )
}

export function Swatch() {
  return (
    <span
      style={{
        width: 74,
        height: 76,
        display: 'grid',
        gridTemplateRows: '9px 6px 1fr 9px',
        background: '#ece9d8',
        border: '2px solid #0054e3',
        borderTop: 0,
      }}
    >
      <span style={{ background: 'linear-gradient(#0058e6,#3d8bff 8%,#0054e3 40%,#0046c8)' }} />
      <span style={{ borderBottom: '1px solid #d6d2bf' }} />
      <span style={{ display: 'flex', gap: 3, padding: 3 }}>
        <i style={{ width: 24, background: 'linear-gradient(160deg,#eaf2f9,#aec4d8)', border: '1px solid #b9c6d2', borderRadius: 3 }} />
        <i style={{ flex: 1, background: '#f4f2e9', border: '1px solid #c0bdae' }} />
        <i style={{ width: 16, background: '#ffef3f', border: '1px solid #e02020' }} />
      </span>
      <span style={{ display: 'flex', gap: 3, padding: '0 3px 3px' }}>
        <i style={{ width: 20, background: 'linear-gradient(#fdfdfd,#e3e0d2)', border: '1px solid #003c74', borderRadius: 2 }} />
        <i style={{ width: 20, background: 'linear-gradient(#fdfdfd,#e3e0d2)', border: '1px solid #003c74', borderRadius: 2 }} />
      </span>
    </span>
  )
}
