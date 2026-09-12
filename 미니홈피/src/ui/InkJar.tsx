/** 잉크병 — 남은 잉크만큼 실제로 차오른다 */
export function InkJar({ amount, size = 1 }: { amount: number; size?: number }) {
  const level = Math.max(0.06, Math.min(1, amount / 30))
  return (
    <svg
      width={54 * size}
      height={62 * size}
      viewBox="0 0 54 62"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      <defs>
        <clipPath id={`jarClip${size}`}>
          <path d="M11 22h32v30a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6z" />
        </clipPath>
      </defs>
      <rect x="20" y="4" width="14" height="10" rx="3" fill="var(--line-2)" />
      <path
        d="M11 22h32v30a6 6 0 0 1-6 6H17a6 6 0 0 1-6-6z"
        fill="#fff"
        stroke="var(--line-2)"
        strokeWidth="2"
      />
      <g clipPath={`url(#jarClip${size})`}>
        <rect x="9" y={58 - 36 * level} width="36" height="40" fill="var(--accent-2)" />
        <rect x="9" y={58 - 36 * level} width="36" height="4" fill="var(--accent)" />
      </g>
      <path d="M14 16h26v7H14z" fill="var(--accent)" />
      <circle cx="36" cy="31" r="3" fill="#fff" opacity=".7" />
    </svg>
  )
}
