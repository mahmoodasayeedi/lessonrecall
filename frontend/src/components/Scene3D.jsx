import { useState } from 'react'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Floating 3D-looking spheres and a ring in Plum & mint, behind the content. */
export function Orbs() {
  const mint = 'radial-gradient(circle at 30% 28%, #ffffff 0%, #8FE3C6 22%, #0F7A5C 68%, #06402F 100%)'
  const plum = 'radial-gradient(circle at 30% 28%, #ffffff 0%, #B9A6EC 22%, #4B2E83 68%, #2A1B4A 100%)'
  const rose = 'radial-gradient(circle at 30% 28%, #ffffff 0%, #F5A9C4 22%, #B4235A 70%, #6B1035 100%)'
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <span className="orb" style={{ width: 150, height: 150, top: -40, left: -10, background: plum }} />
      <span className="orb" style={{ width: 110, height: 110, bottom: 20, right: -20, background: mint, animationDelay: '-3s' }} />
      <span className="orb" style={{ width: 46,  height: 46,  top: 40, right: 10, background: rose, animationDelay: '-1s' }} />
      <span className="orb-ring" style={{ bottom: -10, left: -10 }} />
    </div>
  )
}

/** Wrap any card: it tilts in 3D following the mouse. */
export function Tilt({ children, max = 7 }) {
  const [t, setT] = useState({ x: 0, y: 0 })

  function move(e) {
    if (reduceMotion()) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5          // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setT({ x: -py * max * 2, y: px * max * 2 })
  }

  return (
    <div onMouseMove={move} onMouseLeave={() => setT({ x: 0, y: 0 })}
         style={{ width: '100%', maxWidth: 420,
                  transform: `perspective(1000px) rotateX(${t.x}deg) rotateY(${t.y}deg)`,
                  transition: 'transform .15s ease-out', transformStyle: 'preserve-3d', position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  )
}