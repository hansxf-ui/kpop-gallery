'use client'
import { useEffect, useState } from 'react'

export default function ConfettiHearts() {
  const [hearts, setHearts] = useState([])

  useEffect(() => {
    function onFav(e) {
      const { x = window.innerWidth / 2, y = window.innerHeight / 2 } = e.detail || {}
      const key = Date.now()
      const burst = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return {
          id: `${key}-${i}`, x, y,
          dx: Math.cos(angle) * (40 + Math.random() * 30),
          dy: Math.sin(angle) * (40 + Math.random() * 30) - 30,
          rot: `${Math.floor(Math.random() * 60 - 30)}deg`,
        }
      })
      setHearts((cur) => [...cur, ...burst])
      setTimeout(() => setHearts((cur) => cur.filter((h) => !burst.includes(h))), 850)
    }
    window.addEventListener('h2h:favorite', onFav)
    return () => window.removeEventListener('h2h:favorite', onFav)
  }, [])

  return hearts.map((h) => (
    <span key={h.id} className="confetti-heart" aria-hidden
      style={{ left: h.x, top: h.y, '--dx': `${h.dx}px`, '--dy': `${h.dy}px`, '--rot': h.rot }}>
      ♥
    </span>
  ))
}
