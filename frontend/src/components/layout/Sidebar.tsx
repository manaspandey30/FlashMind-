import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, BookOpen, Layers,
  BarChart3, History, Info, Zap,
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload PDF', icon: Upload },
  { to: '/review', label: 'Review', icon: BookOpen },
  { to: '/decks', label: 'Decks', icon: Layers },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/history', label: 'History', icon: History },
  { to: '/about', label: 'About', icon: Info },
]

export function Sidebar() {
  return (
    <aside
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
      className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col"
    >
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
        >
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          FlashMind
        </span>
      </div>

      <div className="px-3 py-1">
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: 'var(--accent)', color: '#fff' }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom hint */}
      <div className="px-5 py-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Powered by Groq · SM-2 SRS
        </p>
      </div>
    </aside>
  )
}
