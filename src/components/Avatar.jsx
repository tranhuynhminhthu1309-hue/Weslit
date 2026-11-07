// Ảnh đại diện nhân vật vẽ bằng SVG: chọn con vật, mắt, miệng, phụ kiện và màu nền. Không dùng ảnh ngoài nên không bao giờ bị mất.

const INK = '#1e293b'

export const ANIMALS = {
  cat: 'Mèo',
  dog: 'Chó',
  bear: 'Gấu',
  rabbit: 'Thỏ',
  fox: 'Cáo',
  frog: 'Ếch',
  pig: 'Heo',
  chick: 'Gà con',
  fish: 'Cá',
  octopus: 'Bạch tuộc',
  snail: 'Ốc',
  clam: 'Sò',
  leopard: 'Báo',
  tiger: 'Hổ',
  sloth: 'Lười',
  snake: 'Rắn',
}
export const EYES = { dot: 'Tròn', happy: 'Cười', wink: 'Nháy', star: 'Long lanh' }
export const MOUTHS = { smile: 'Cười', open: 'Há miệng', cat: 'Mèo', o: 'Chữ O' }
export const ACCS = { none: 'Không', glasses: 'Kính', shades: 'Kính râm', cap: 'Mũ lưỡi trai', crown: 'Vương miện', bow: 'Nơ', band: 'Băng đô' }

const pick = (o) => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)]
export const randomAvatar = () => ({ animal: pick(ANIMALS), eyes: pick(EYES), mouth: pick(MOUTHS), acc: Math.random() < 0.45 ? 'none' : pick(ACCS) })

/** Kiểu kawaii: đầu tròn bụ, mắt to long lanh, má hồng. Mỗi con vật chỉ vẽ phần đầu/tai/đặc trưng. */
function Head({ a }) {
  const Ear = ({ x, y, rx = 6, ry = 7, c, i, r = 0 }) => (
    <g transform={`rotate(${r} ${x} ${y})`}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={c} />
      {i && <ellipse cx={x} cy={y + 0.8} rx={rx * 0.55} ry={ry * 0.55} fill={i} />}
    </g>
  )
  switch (a) {
    case 'cat':
      return (
        <>
          <path d="M10 30 Q9 12 12 11 Q22 13 27 20Z" fill="#fdba74" />
          <path d="M54 30 Q55 12 52 11 Q42 13 37 20Z" fill="#fdba74" />
          <path d="M13 25 Q13 16 15 15 Q20 17 23 21Z" fill="#fbcfe8" />
          <path d="M51 25 Q51 16 49 15 Q44 17 41 21Z" fill="#fbcfe8" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fdba74" />
          <path d="M32 18 V24 M26 19 L27 24 M38 19 L37 24" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="32" cy="45" rx="9" ry="6.5" fill="#fff7ed" />
        </>
      )
    case 'dog':
      return (
        <>
          <Ear x={11} y={33} rx={7} ry={13} c="#a16207" r={14} />
          <Ear x={53} y={33} rx={7} ry={13} c="#a16207" r={-14} />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fcd9a6" />
          <ellipse cx="22" cy="35" rx="7" ry="8" fill="#a16207" opacity="0.9" />
          <ellipse cx="32" cy="45" rx="10" ry="7" fill="#fff7ed" />
        </>
      )
    case 'bear':
      return (
        <>
          <circle cx="13" cy="19" r="8" fill="#b4793f" />
          <circle cx="51" cy="19" r="8" fill="#b4793f" />
          <circle cx="13" cy="19" r="4.2" fill="#f5d0a9" />
          <circle cx="51" cy="19" r="4.2" fill="#f5d0a9" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#c98f55" />
          <ellipse cx="32" cy="45" rx="9.5" ry="7" fill="#f5deb8" />
        </>
      )
    case 'rabbit':
      return (
        <>
          <Ear x={22} y={12} rx={6} ry={14} c="#fff" i="#fbcfe8" r={-6} />
          <Ear x={42} y={12} rx={6} ry={14} c="#fff" i="#fbcfe8" r={6} />
          <ellipse cx="32" cy="40" rx="22" ry="19" fill="#fff" />
          <ellipse cx="32" cy="40" rx="22" ry="19" fill="none" stroke="#e2e8f0" strokeWidth="1.2" />
        </>
      )
    case 'fox':
      return (
        <>
          <path d="M9 31 Q8 11 11 9 Q22 12 28 21Z" fill="#fb923c" />
          <path d="M55 31 Q56 11 53 9 Q42 12 36 21Z" fill="#fb923c" />
          <path d="M12 24 Q12 15 13 13 Q18 15 21 20Z" fill="#7c2d12" />
          <path d="M52 24 Q52 15 51 13 Q46 15 43 20Z" fill="#7c2d12" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fb923c" />
          <path d="M9 41 Q16 54 32 57 Q48 54 55 41 Q44 50 32 50 Q20 50 9 41Z" fill="#fff7ed" />
        </>
      )
    case 'frog':
      return (
        <>
          <circle cx="19" cy="20" r="9" fill="#86efac" />
          <circle cx="45" cy="20" r="9" fill="#86efac" />
          <ellipse cx="32" cy="40" rx="24" ry="19" fill="#86efac" />
          <ellipse cx="32" cy="48" rx="15" ry="8" fill="#dcfce7" />
        </>
      )
    case 'pig':
      return (
        <>
          <path d="M11 28 Q8 14 14 12 Q22 14 27 21Z" fill="#f9a8d4" />
          <path d="M53 28 Q56 14 50 12 Q42 14 37 21Z" fill="#f9a8d4" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fbcfe8" />
          <ellipse cx="32" cy="44" rx="9" ry="6.5" fill="#f9a8d4" />
          <ellipse cx="29" cy="44" rx="1.5" ry="2" fill="#be185d" />
          <ellipse cx="35" cy="44" rx="1.5" ry="2" fill="#be185d" />
        </>
      )
    case 'chick':
      return (
        <>
          <path d="M26 19 Q27 8 30 15 Q32 6 34 15 Q37 8 38 19Z" fill="#facc15" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fde047" />
          <path d="M28.5 42 Q32 40.5 35.5 42 Q32 47 28.5 42Z" fill="#fb923c" />
          <ellipse cx="10" cy="40" rx="4" ry="6" fill="#facc15" />
          <ellipse cx="54" cy="40" rx="4" ry="6" fill="#facc15" />
        </>
      )
    case 'fish':
      return (
        <>
          <path d="M22 20 Q32 4 42 20Z" fill="#7dd3fc" />
          <path d="M11 38 Q0 28 3 22 Q5 38 3 54 Q0 48 11 38Z" fill="#fdba74" />
          <path d="M53 38 Q64 28 61 22 Q59 38 61 54 Q64 48 53 38Z" fill="#fdba74" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#7dd3fc" />
          <ellipse cx="32" cy="48" rx="15" ry="8" fill="#e0f2fe" />
          <path d="M20 22 Q22 26 20 30 M44 22 Q42 26 44 30" stroke="#38bdf8" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )
    case 'octopus':
      return (
        <>
          {[[14, 53], [25, 57], [39, 57], [50, 53]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.5" fill="#d8b4fe" />)}
          <ellipse cx="32" cy="34" rx="23" ry="23" fill="#d8b4fe" />
          <circle cx="23" cy="21" r="2.6" fill="#f3e8ff" />
          <circle cx="29" cy="17" r="1.6" fill="#f3e8ff" />
          <circle cx="42" cy="21" r="2" fill="#f3e8ff" />
        </>
      )
    case 'snail':
      return (
        <>
          <circle cx="45" cy="30" r="14" fill="#fdba74" />
          <path d="M45 30 m-2.5 0 a2.5 2.5 0 1 1 5 0 a7 7 0 1 1 -9.5 -5.5 a11 11 0 1 1 -2 14" stroke="#c2410c" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M23 26 Q21 16 22 11 M35 26 Q37 16 36 11" stroke="#d6d3a0" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="10" r="3.4" fill="#d6d3a0" />
          <circle cx="36" cy="10" r="3.4" fill="#d6d3a0" />
          <ellipse cx="30" cy="42" rx="24" ry="17" fill="#efe9b8" />
        </>
      )
    case 'clam':
      return (
        <>
          <ellipse cx="32" cy="46" rx="25" ry="13" fill="#f9a8d4" />
          <path d="M5 34 Q6 6 32 6 Q58 6 59 34 Q32 24 5 34Z" fill="#f472b6" />
          <path d="M32 7 V26 M19 10 L21 28 M45 10 L43 28 M11 19 L13 30 M53 19 L51 30" stroke="#ec4899" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
          <ellipse cx="32" cy="40" rx="19" ry="14" fill="#fff1f2" />
        </>
      )
    case 'leopard':
      return (
        <>
          <circle cx="14" cy="20" r="8" fill="#fcd34d" />
          <circle cx="50" cy="20" r="8" fill="#fcd34d" />
          <circle cx="14" cy="20" r="3.6" fill="#92400e" />
          <circle cx="50" cy="20" r="3.6" fill="#92400e" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fcd34d" />
          <ellipse cx="32" cy="45" rx="9.5" ry="6.5" fill="#fffbeb" />
          {[[17, 30], [47, 30], [24, 22], [40, 22], [32, 21], [11, 40], [53, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#92400e" />)}
        </>
      )
    case 'tiger':
      return (
        <>
          <circle cx="14" cy="20" r="8" fill="#fb923c" />
          <circle cx="50" cy="20" r="8" fill="#fb923c" />
          <circle cx="14" cy="20" r="3.8" fill="#fff7ed" />
          <circle cx="50" cy="20" r="3.8" fill="#fff7ed" />
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fb923c" />
          <ellipse cx="32" cy="45" rx="10" ry="7" fill="#fff7ed" />
          <path d="M32 18 V26 M24 19 L26 26 M40 19 L38 26 M9 34 L15 36 M9 41 L15 40 M55 34 L49 36 M55 41 L49 40" stroke="#7c2d12" strokeWidth="2.6" strokeLinecap="round" />
        </>
      )
    case 'sloth':
      return (
        <>
          <ellipse cx="32" cy="38" rx="23" ry="20" fill="#b89b7d" />
          <path d="M12 38 Q12 22 32 22 Q52 22 52 38 Q52 54 32 54 Q12 54 12 38Z" fill="#f1e6d3" />
          <ellipse cx="22" cy="37" rx="7.5" ry="6" fill="#7a5c43" transform="rotate(22 22 37)" />
          <ellipse cx="42" cy="37" rx="7.5" ry="6" fill="#7a5c43" transform="rotate(-22 42 37)" />
        </>
      )
    case 'snake':
      return (
        <>
          <path d="M32 50 V56 M32 56 L29 59 M32 56 L35 59" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="38" rx="22" ry="20" fill="#86efac" />
          <ellipse cx="32" cy="47" rx="13" ry="9" fill="#f0fdf4" />
          <path d="M32 17 L38 23 L32 29 L26 23Z" fill="#22c55e" />
          <path d="M19 22 L23 26 L19 30 L15 26Z M45 22 L49 26 L45 30 L41 26Z" fill="#4ade80" />
        </>
      )
    default:
      return <ellipse cx="32" cy="38" rx="23" ry="20" fill="#fde68a" />
  }
}

const HAS_NOSE = new Set(['cat', 'dog', 'bear', 'rabbit', 'fox', 'leopard', 'tiger', 'sloth'])
const NO_MOUTH = new Set(['chick'])
const MOUTH_Y = { pig: 51, sloth: 47, frog: 45 }

function Eyes({ t, animal }) {
  const s = { stroke: INK, strokeWidth: 2.6, fill: 'none', strokeLinecap: 'round' }
  const y = animal === 'sloth' ? 37 : 37
  const L = 22.5, R = 41.5
  const Dot = ({ x, r = 3.7 }) => (
    <>
      <circle cx={x} cy={y} r={r} fill={INK} />
      <circle cx={x + 1.2} cy={y - 1.4} r={r * 0.38} fill="#fff" />
      <circle cx={x - 1.1} cy={y + 1.3} r={r * 0.16} fill="#fff" />
    </>
  )
  if (t === 'happy')
    return (
      <>
        <path d={`M${L - 4} ${y + 1.5} Q${L} ${y - 5} ${L + 4} ${y + 1.5}`} {...s} />
        <path d={`M${R - 4} ${y + 1.5} Q${R} ${y - 5} ${R + 4} ${y + 1.5}`} {...s} />
      </>
    )
  if (t === 'wink')
    return (
      <>
        <Dot x={L} />
        <path d={`M${R - 4} ${y + 1.5} Q${R} ${y - 5} ${R + 4} ${y + 1.5}`} {...s} />
      </>
    )
  if (t === 'star')
    return (
      <>
        <Dot x={L} r={5} />
        <Dot x={R} r={5} />
      </>
    )
  return (
    <>
      <Dot x={L} />
      <Dot x={R} />
    </>
  )
}

function Blush() {
  return (
    <>
      <ellipse cx="14.5" cy="44.5" rx="4.4" ry="2.7" fill="#fb7185" opacity="0.45" />
      <ellipse cx="49.5" cy="44.5" rx="4.4" ry="2.7" fill="#fb7185" opacity="0.45" />
    </>
  )
}

function Mouth({ t, animal }) {
  if (NO_MOUTH.has(animal) && t !== 'open') return null
  const y = MOUTH_Y[animal] ?? 46.5
  const s = { stroke: INK, strokeWidth: 2.1, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (t === 'open')
    return (
      <>
        <path d={`M28 ${y - 1} Q32 ${y + 9} 36 ${y - 1} Z`} fill={INK} />
        <path d={`M29.8 ${y + 3.2} Q32 ${y + 1.4} 34.2 ${y + 3.2} Q32 ${y + 6} 29.8 ${y + 3.2}Z`} fill="#fb7185" />
      </>
    )
  if (t === 'cat') return <path d={`M27.5 ${y} Q30 ${y + 3.5} 32 ${y} Q34 ${y + 3.5} 36.5 ${y}`} {...s} />
  if (t === 'o') return <ellipse cx="32" cy={y + 1.6} rx="2" ry="2.6" fill={INK} />
  return <path d={`M28.5 ${y} Q32 ${y + 4.5} 35.5 ${y}`} {...s} />
}

function Acc({ t }) {
  const s = { stroke: INK, strokeWidth: 1.9, fill: 'rgba(255,255,255,0.35)' }
  switch (t) {
    case 'glasses':
      return (
        <>
          <circle cx="22.5" cy="37" r="7.2" {...s} />
          <circle cx="41.5" cy="37" r="7.2" {...s} />
          <path d="M29.7 37 H34.3" {...s} fill="none" />
        </>
      )
    case 'shades':
      return (
        <>
          <rect x="14" y="31" width="17" height="11" rx="5" fill={INK} />
          <rect x="33" y="31" width="17" height="11" rx="5" fill={INK} />
          <path d="M31 35 H33" stroke={INK} strokeWidth="2" />
          <path d="M17 34 L21 34" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </>
      )
    case 'cap':
      return (
        <>
          <path d="M11 28 Q32 -2 53 28 Q32 20 11 28Z" fill="#f87171" />
          <path d="M9 29 Q22 21 40 27 L40 31 Q22 26 9 32Z" fill="#dc2626" />
          <circle cx="32" cy="10" r="2.4" fill="#fecaca" />
        </>
      )
    case 'crown':
      return <path d="M17 20 L19 6 L26 14 L32 3 L38 14 L45 6 L47 20 Z" fill="#fde047" stroke="#eab308" strokeWidth="1.5" strokeLinejoin="round" />
    case 'bow':
      return (
        <>
          <path d="M46 17 Q58 6 58 18 Q58 28 46 17Z" fill="#f472b6" />
          <path d="M46 17 Q34 8 34 19 Q34 28 46 17Z" fill="#f472b6" />
          <circle cx="46" cy="17.5" r="3.6" fill="#db2777" />
        </>
      )
    case 'band':
      return (
        <>
          <path d="M11 28 Q32 8 53 28 L51 33 Q32 17 13 33Z" fill="#818cf8" />
          <circle cx="32" cy="17.5" r="2.4" fill="#e0e7ff" />
          <circle cx="22" cy="21" r="1.6" fill="#e0e7ff" />
          <circle cx="42" cy="21" r="1.6" fill="#e0e7ff" />
        </>
      )
    default:
      return null
  }
}

/** Vẽ nhân vật theo cấu hình { animal, eyes, mouth, acc } trên nền màu. */
export function AvatarArt({ spec, color = '#c7d2fe', size = 40 }) {
  const a = spec || {}
  const animal = a.animal in ANIMALS ? a.animal : 'cat'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0 rounded-full" role="img" aria-label={ANIMALS[animal]}>
      <rect width="64" height="64" fill={color} />
      <circle cx="32" cy="32" r="32" fill="#fff" opacity="0.28" />
      <g transform="translate(32 34) scale(0.86) translate(-32 -33)">
      <Head a={animal} />
      <Blush />
      {HAS_NOSE.has(animal) && <ellipse cx="32" cy="42.2" rx="2.3" ry="1.6" fill={INK} />}
      <Eyes t={a.eyes} animal={animal} />
      <Mouth t={a.mouth} animal={animal} />
      <Acc t={a.acc} />
      </g>
    </svg>
  )
}

/** Ảnh đại diện thành viên: có nhân vật thì vẽ nhân vật, chưa có thì dùng chữ cái đầu. */
export function Avatar({ m, size = 32 }) {
  if (m?.avatar && m.avatar.animal) return <AvatarArt spec={m.avatar} color={m.color || '#c7d2fe'} size={size} />
  const name = m?.name || '?'
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: m?.color || '#94a3b8', fontSize: size * 0.42 }} title={name}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export const GROUP_ICONS = ['🍻', '🍜', '🍕', '🍣', '🧋', '☕', '🍰', '🎤', '🎮', '🏖️', '✈️', '🏕️', '🎬', '⚽', '🎂', '🏠', '🌈', '⭐', '🔥', '💖', '🐾', '🌸', '🚗', '🎉']
export const GROUP_COLORS = ['#e0e7ff', '#fce7f3', '#dcfce7', '#fef3c7', '#cffafe', '#fee2e2', '#ede9fe', '#ffedd5']

/** Ảnh đại diện nhóm: emoji trên nền màu bo góc; chưa chọn thì hiện biểu tượng mặc định. */
export function GroupAvatar({ g, size = 48 }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size, borderRadius: size * 0.3, background: g?.color || '#e0e7ff', fontSize: size * 0.55, lineHeight: 1 }}>
      {g?.icon || '👥'}
    </span>
  )
}
