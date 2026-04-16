import { useRef, useCallback } from 'react'

export function useCardTilt(maxTilt = 14) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const nx = (x / rect.width - 0.5) * 2   // -1 to 1
      const ny = (y / rect.height - 0.5) * 2  // -1 to 1

      const rY = nx * maxTilt
      const rX = -ny * maxTilt

      el.style.transform = `perspective(900px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.05,1.05,1.05)`
      el.style.transition = 'transform 0.08s linear'
      el.style.boxShadow = `${nx * -22}px ${ny * -22}px 40px rgba(124,106,255,0.38), 0 0 80px rgba(124,106,255,0.12)`
      el.style.zIndex = '10'

      const glare = el.querySelector<HTMLElement>('[data-glare]')
      if (glare) {
        const gx = (x / rect.width) * 100
        const gy = (y / rect.height) * 100
        glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)`
        glare.style.opacity = '1'
      }
    },
    [maxTilt],
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    el.style.transition = 'transform 0.65s cubic-bezier(0.23,1,0.32,1), box-shadow 0.65s ease'
    el.style.boxShadow = ''
    el.style.zIndex = ''
    const glare = el.querySelector<HTMLElement>('[data-glare]')
    if (glare) {
      glare.style.opacity = '0'
      glare.style.transition = 'opacity 0.5s ease'
    }
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}
