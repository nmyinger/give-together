'use client'

import { useEffect } from 'react'

export function ConfettiBurst() {
  useEffect(() => {
    let animationId: number
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const GOLD = 'oklch(0.73 0.130 82)'
    const colors = ['#c4a040', '#f5f0e8', '#e8d080', '#ffffff', '#c4a040', '#d4b050']
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      color: string; size: number; angle: number; spin: number; alpha: number
    }> = []

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        alpha: 1,
      })
    }

    let frame = 0
    void GOLD // suppress lint

    function animate() {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false

      for (const p of particles) {
        p.vy += 0.4
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        p.alpha = Math.max(0, p.alpha - (frame > 60 ? 0.018 : 0))

        if (p.alpha > 0) {
          alive = true
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
        }
      }

      if (alive) {
        animationId = requestAnimationFrame(animate)
      } else {
        document.body.removeChild(canvas)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animationId)
      if (canvas.parentNode) document.body.removeChild(canvas)
    }
  }, [])

  return null
}
