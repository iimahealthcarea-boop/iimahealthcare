import { Home, BookUser, Network, User } from 'lucide-react';

export type UserSection = 'home' | 'directory' | 'network' | 'profile';

interface UserBottomNavProps {
  active: UserSection;
  onChange: (section: UserSection) => void;
}

// Order follows the reference design. "Messages" is intentionally omitted —
// the application has no messaging feature to link to.
const NAV_ITEMS: { key: UserSection; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'directory', label: 'Directory', icon: BookUser },
  { key: 'network', label: 'My Network', icon: Network },
  { key: 'profile', label: 'Profile', icon: User },
];

/**
 * Primary user navigation.
 * - Mobile/tablet: fixed bottom bar, sitting above the global BottomBanner.
 * - Desktop (lg+): the same items as an inline pill bar, so the bottom of large
 *   screens stays clear.
 */
export default function UserBottomNav({ active, onChange }: UserBottomNavProps) {
  return (
    <>
      {/* Desktop */}
      <nav
        aria-label="Sections"
        className="mb-6 hidden w-full min-w-0 rounded-xl border bg-card p-1 lg:block"
      >
        <ul className="flex min-w-0 items-center gap-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <li key={key} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onChange(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile / tablet */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-9 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex w-full max-w-xl items-stretch">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <li key={key} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onChange(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full min-w-0 flex-col items-center gap-1 px-1 py-2 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className="w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs">
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
