import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  pulse: number
  pulseSpeed: number
  color: string
  type: 'circle' | 'ring' | 'dot'
}

const COLORS = [
  'rgba(124,106,255,',   // accent purple
  'rgba(165,148,255,',   // accent light
  'rgba(34,197,94,',     // green
  'rgba(56,189,248,',    // sky blue
  'rgba(249,115,22,',    // orange
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export function FloatingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particles = useRef<Particle[]>([])
  const mouse = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', () => { mouse.current = { x: -9999, y: -9999 } })

    // Spawn particles
    const count = 38
    particles.current = Array.from({ length: count }, () => ({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.18, 0.18),
      vy: rand(-0.22, 0.22),
      radius: rand(3, 22),
      opacity: rand(0.04, 0.18),
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.006, 0.018),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type: (['circle', 'ring', 'dot'] as const)[Math.floor(Math.random() * 3)],
    }))

    // Connection lines between nearby particles
    const drawConnections = () => {
      const pts = particles.current
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x
          const dy = pts[i].y - pts[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.06
            ctx.beginPath()
            ctx.strokeStyle = `rgba(124,106,255,${alpha})`
            ctx.lineWidth = 1
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Subtle radial gradient orbs (static, atmospheric)
      const orbs = [
        { x: canvas.width * 0.15, y: canvas.height * 0.2, r: 320, color: 'rgba(124,106,255,0.04)' },
        { x: canvas.width * 0.85, y: canvas.height * 0.75, r: 280, color: 'rgba(34,197,94,0.03)' },
        { x: canvas.width * 0.5, y: canvas.height * 0.5, r: 200, color: 'rgba(56,189,248,0.025)' },
      ]
      orbs.forEach(orb => {
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r)
        grad.addColorStop(0, orb.color)
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      drawConnections()

      particles.current.forEach(p => {
        // Mouse repulsion (gentle)
        const mdx = p.x - mouse.current.x
        const mdy = p.y - mouse.current.y
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < 100 && mdist > 0) {
          const force = (100 - mdist) / 100 * 0.4
          p.vx += (mdx / mdist) * force
          p.vy += (mdy / mdist) * force
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 0.8) { p.vx *= 0.8 / speed; p.vy *= 0.8 / speed }

        // Drift damping back to normal
        p.vx += (rand(-0.18, 0.18) - p.vx) * 0.002
        p.vy += (rand(-0.22, 0.22) - p.vy) * 0.002

        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        // Wrap edges
        if (p.x < -30) p.x = canvas.width + 30
        if (p.x > canvas.width + 30) p.x = -30
        if (p.y < -30) p.y = canvas.height + 30
        if (p.y > canvas.height + 30) p.y = -30

        const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse))
        const r = p.radius * (0.85 + 0.15 * Math.sin(p.pulse * 0.7))

        ctx.save()
        if (p.type === 'dot') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(r * 0.22, 2), 0, Math.PI * 2)
          ctx.fillStyle = `${p.color}${alpha})`
          ctx.fill()
        } else if (p.type === 'ring') {
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `${p.color}${alpha})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        } else {
          // circle with radial gradient fill
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
          grad.addColorStop(0, `${p.color}${alpha})`)
          grad.addColorStop(1, `${p.color}0)`)
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }
        ctx.restore()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
