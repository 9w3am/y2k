/** 한글/전각 2byte, 그 외 1byte. 2000년대 SMS 카운터와 동일한 셈법. */
export const krByte = (s: string): number =>
  [...s].reduce((n, c) => n + (c.charCodeAt(0) > 0x7f ? 2 : 1), 0)

/** maxBytes 를 넘지 않는 지점까지 자른다. 글자 중간에서 끊지 않는다. */
export const clampBytes = (s: string, maxBytes: number): string => {
  let n = 0
  let out = ''
  for (const c of s) {
    const w = c.charCodeAt(0) > 0x7f ? 2 : 1
    if (n + w > maxBytes) break
    n += w
    out += c
  }
  return out
}
