import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { FloatingBackground } from './FloatingBackground'

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)', position: 'relative' }}>
      <FloatingBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
