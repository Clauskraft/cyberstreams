// Props for the NavBar component.  'current' holds the currently selected
// page and 'onSelect' is a callback invoked with the name of the new page
// when a navigation item is clicked.
interface NavBarProps {
  current: 'home' | 'intelligence' | 'dashboard' | 'about' | 'admin'
  onSelect: (page: 'home' | 'intelligence' | 'dashboard' | 'about' | 'admin') => void
}

export function NavBar({ current, onSelect }: NavBarProps) {
  const items: { key: NavBarProps['current']; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'intelligence', label: 'Threat Intelligence' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'about', label: 'About' },
    { key: 'admin', label: 'Admin' }
  ]

  return (
    <nav className="flex gap-3 items-center p-4 bg-cyber-blue text-white shadow-md">
      {items.map(item => {
        const active = item.key === current
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`px-3 py-2 rounded-lg cursor-pointer font-semibold border-none transition-all ${
              active 
                ? 'bg-white/20 text-white' 
                : 'bg-transparent text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default NavBar