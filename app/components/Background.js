const SHAPES = ['♥', '✦', '♡', '✧']
const COLORS = ['#F7A8C8', '#C9A24B', '#F7A8C8', '#CDB8F5']

export default function Background() {
  const bits = Array.from({ length: 18 }, (_, i) => ({
    ch: SHAPES[i % 4],
    color: COLORS[i % 4],
    left: (i * 37 + 6) % 100,
    size: 14 + ((i * 7) % 18),
    dur: 16 + ((i * 5) % 12),
    delay: -((i * 3) % 16),
  }))
  return (
    <div className="bg-layer" aria-hidden>
      <div className="orb" style={{ width: 340, height: 340, top: '-90px', left: '-90px', background: '#F7A8C8' }} />
      <div className="orb" style={{ width: 380, height: 380, bottom: '-120px', right: '-100px', background: '#CDB8F5', animationDelay: '-9s' }} />
      {bits.map((b, i) => (
        <span key={i} className="float"
          style={{ '--l': `${b.left}%`, '--s': `${b.size}px`, '--d': `${b.dur}s`, '--dl': `${b.delay}s`, '--c': b.color }}>
          {b.ch}
        </span>
      ))}
    </div>
  )
}
