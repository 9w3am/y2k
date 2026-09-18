import { useEffect, useState } from 'react'

/*
   폰에서 글자를 고칠 때 — 키보드가 올라오면 보이는 칸이 반으로 줄어
   화면이 콩알만 해지고, 고치는 줄이 키보드 뒤로 숨는다.
   그래서 화면 속 글자를 누르면 '입력 모드'로 바꾼다:
   · 위 메뉴·조작 칸은 잠깐 치우고, 키보드 위 남은 칸에 화면 전체를 맞춰 넣는다
     (글자마다 따로 확대하지 않는다 — 화면이 튀지 않게, 한눈에 다 보이게)
   · 위에 '완료'를 두어 한 번에 키보드를 닫는다
*/

const isPhone = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches && innerWidth <= 900

/** 키보드를 뺀 실제로 보이는 칸의 높이·위치를 CSS 변수로 */
function syncViewport() {
  const vv = window.visualViewport
  const h = vv ? vv.height : innerHeight
  const top = vv ? vv.offsetTop : 0
  document.documentElement.style.setProperty('--vvh', `${Math.round(h)}px`)
  document.documentElement.style.setProperty('--vvt', `${Math.round(top)}px`)
}

export function useTyping(): [boolean, () => void] {
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    syncViewport()
    const vv = window.visualViewport
    vv?.addEventListener('resize', syncViewport)
    vv?.addEventListener('scroll', syncViewport)

    const onIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement
      if (!isPhone() || !t.closest?.('.canvas .ed')) return
      setTyping(true)
    }
    const onOut = (e: FocusEvent) => {
      const next = e.relatedTarget as HTMLElement | null
      // 다른 글자 칸으로 옮겨가는 거면 그대로 둔다
      if (next?.closest?.('.canvas .ed')) return
      setTimeout(() => {
        if (!document.activeElement?.closest?.('.canvas .ed')) setTyping(false)
      }, 120)
    }
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => {
      vv?.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('scroll', syncViewport)
      document.removeEventListener('focusin', onIn)
      document.removeEventListener('focusout', onOut)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('typing', typing)
  }, [typing])

  const done = () => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    setTyping(false)
  }
  return [typing, done]
}
