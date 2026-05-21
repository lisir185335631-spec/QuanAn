// @quanan/ui/admin · Sidebar — 240px left nav, no app-layer deps
// Props-injected: allowedroutes pre-computed by AdminLayout

export interface SidebarItem {
  path: string;
  emoji: string;
  label: string;
}

export interface SidebarGroup {
  key: string;
  label: string;
  items: SidebarItem[];
}

interface SidebarProps {
  role: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  groups: SidebarGroup[];
}

export function Sidebar({ role, groups, currentPath, onNavigate }: SidebarProps) {
  return (
    <nav
      className="admin-sidebar"
      aria-label="管理导航"
      data-role={role}
      style={{
        height: `calc(100vh - var(--topbar-height) - var(--statusbar-height))`,
      }}
    >
      {groups.map((group) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <div className="admin-sidebar__group-label">{group.label}</div>
          {group.items.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`admin-sidebar__item${isActive ? ' admin-sidebar__item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.path);
                }}
              >
                <span className="admin-sidebar__emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                {item.label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
