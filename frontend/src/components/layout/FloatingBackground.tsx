import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  radius: number; opacity: number
  pulse: number; pulseSpeed: number
  color: string; type: 'circle' | 'ring' | 'dot'
}

interface Star {
  x: number; y: number; vx: number; vy: number
  len: number; opacity: number; active: boolean
}

interface Blob {
  x: number; y: number; vx: number; vy: number
  r: number; color: string; phase: number
}

const COLORS = ['124,106,255', '165,148,255', '34,197,94', '56,189,248', '249,115,22', '192,132,252']

function rand(a: number, b: number) { return Math.random() * (b - a) + a }

export function FloatingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)

    // ── Particles ─────────────────────────────────────────────────────────
    const PCOUNT = 55
    const particles: Particle[] = Array.from({ length: PCOUNT }, () => ({
      x: rand(0, window.innerWidth), y: rand(0, window.innerHeight),
      vx: rand(-0.25, 0.25), vy: rand(-0.28, 0.28),
      radius: rand(4, 28), opacity: rand(0.18, 0.55),
      pulse: rand(0, Math.PI * 2), pulseSpeed: rand(0.007, 0.02),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type: (['circle', 'ring', 'dot'] as const)[Math.floor(Math.random() * 3)],
    }))

    // ── Shooting stars ────────────────────────────────────────────────────
    const STARS: Star[] = Array.from({ length: 6 }, () => ({
      x: rand(0, window.innerWidth), y: rand(0, window.innerHeight * 0.5),
      vx: rand(3, 7), vy: rand(1.5, 3.5),
      len: rand(80, 180), opacity: 0, active: false,
    }))
    let nextStarIn = rand(40, 120)
    let starTick = 0

    // ── Blobs (large slow orbs) ───────────────────────────────────────────
    const blobs: Blob[] = [
      { x: window.innerWidth * 0.1, y: window.innerHeight * 0.15, vx: 0.12, vy: 0.08, r: 420, color: '124,106,255', phase: 0 },
      { x: window.innerWidth * 0.85, y: window.innerHeight * 0.8, vx: -0.09, vy: -0.12, r: 350, color: '34,197,94', phase: 1 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45, vx: 0.06, vy: 0.1, r: 280, color: '56,189,248', phase: 2 },
    ]

    const drawGrid = () => {
      const spacing = 60
      ctx.strokeStyle = 'rgba(124,106,255,0.05)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
      }
    }

    const drawBlobs = (_t: number) => {
      blobs.forEach(b => {
        b.phase += 0.003
        const pulse = 0.9 + 0.1 * Math.sin(b.phase)
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r || b.x > canvas.width + b.r) b.vx *= -1
        if (b.y < -b.r || b.y > canvas.height + b.r) b.vy *= -1
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse)
        g.addColorStop(0, `rgba(${b.color},0.12)`)
        g.addColorStop(0.5, `rgba(${b.color},0.05)`)
        g.addColorStop(1, `rgba(${b.color},0)`)
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
      })
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 160) {
            const a = (1 - d / 160) * 0.12
            ctx.beginPath()
            ctx.strokeStyle = `rgba(124,106,255,${a})`
            ctx.lineWidth = 0.8
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const drawParticles = () => {
      particles.forEach(p => {
        // Mouse repulsion
        const mdx = p.x - mouse.current.x
        const mdy = p.y - mouse.current.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < 120 && md > 0) {
          const f = (120 - md) / 120 * 0.6
          p.vx += (mdx / md) * f; p.vy += (mdy / md) * f
        }
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd > 1.2) { p.vx *= 1.2 / spd; p.vy *= 1.2 / spd }
        p.vx += (rand(-0.25, 0.25) - p.vx) * 0.003
        p.vy += (rand(-0.28, 0.28) - p.vy) * 0.003
        p.x += p.vx; p.y += p.vy
        p.pulse += p.pulseSpeed
        if (p.x < -40) p.x = canvas.width + 40
        if (p.x > canvas.width + 40) p.x = -40
        if (p.y < -40) p.y = canvas.height + 40
        if (p.y > canvas.height + 40) p.y = -40

        const a = p.opacity * (0.65 + 0.35 * Math.sin(p.pulse))
        const r = p.radius * (0.88 + 0.12 * Math.sin(p.pulse * 0.8))

        if (p.type === 'dot') {
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(r * 0.25, 2.5), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${p.color},${a})`; ctx.fill()
        } else if (p.type === 'ring') {
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${p.color},${a})`
          ctx.lineWidth = 1.5; ctx.stroke()
        } else {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
          g.addColorStop(0, `rgba(${p.color},${a})`)
          g.addColorStop(1, `rgba(${p.color},0)`)
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.fill()
        }
      })
    }

    const drawStars = () => {
      starTick++
      if (starTick >= nextStarIn) {
        const s = STARS.find(s => !s.active)
        if (s) {
          s.x = rand(0, canvas.width * 0.5)
          s.y = rand(0, canvas.height * 0.4)
          s.vx = rand(4, 8); s.vy = rand(2, 4.5)
          s.len = rand(80, 200); s.opacity = 0.9; s.active = true
        }
        starTick = 0; nextStarIn = rand(60, 200)
      }
      STARS.forEach(s => {
        if (!s.active) return
        s.x += s.vx; s.y += s.vy; s.opacity -= 0.012
        if (s.opacity <= 0 || s.x > canvas.width + 50 || s.y > canvas.height + 50) {
          s.active = false; return
        }
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6))
        g.addColorStop(0, `rgba(255,255,255,${s.opacity})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * (s.len / 6), s.y - s.vy * (s.len / 6))
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
        // Head glow
        ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity * 0.8})`; ctx.fill()
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawGrid()
      drawBlobs(0)
      drawConnections()
      drawParticles()
      drawStars()
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}
