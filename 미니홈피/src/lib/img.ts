import { say } from '../ui/dialog'
/** 올린 사진을 저장소에 들어갈 크기로 줄인다. 원본은 금방 한도를 넘긴다. */
export function readImageScaled(file: File, maxSide = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onerror = () => reject(new Error('read'))
    fr.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(c.toDataURL('image/jpeg', 0.86))
      }
      img.src = fr.result as string
    }
    fr.readAsDataURL(file)
  })
}

/** 클릭 한 번으로 사진 하나 고르기 */
export function pickImage(onPick: (dataUrl: string) => void, maxSide = 1200) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const f = input.files?.[0]
    if (!f) return
    try {
      onPick(await readImageScaled(f, maxSide))
    } catch {
      void say('사진을 불러오지 못했습니다', '다른 파일로 다시 시도해 주세요.')
    }
  }
  input.click()
}
