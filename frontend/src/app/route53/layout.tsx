'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const sidebarItems = [
  { label: 'Dashboard', href: '/route53', icon: '⊞' },
  { label: 'Hosted zones', href: '/route53/hosted-zones', icon: '◉' },
  { label: 'Health checks', href: '/route53/health-checks', icon: '♡' },
  { label: 'Traffic policies', href: '/route53/traffic-policies', icon: '⇄' },
  { label: 'Policy records', href: '/route53/policy-records', icon: '☰' },
  { label: 'IP-based routing', href: '/route53/ip-routing', icon: '⊿' },
  { label: 'Resolver', href: '/route53/resolver', icon: '↔' },
  { label: 'Profiles', href: '/route53/profiles', icon: '◷' },
];

export default function Route53Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navigation bar */}
      <header style={{ backgroundColor: '#232f3e', position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Main nav row */}
        <div className="flex items-center h-10 px-4" style={{ borderBottom: '1px solid #3a4553' }}>
          {/* AWS Logo */}
          <Link href="/route53" className="flex items-center mr-4">
            <span className="text-white font-bold text-sm mr-1">aws</span>
          </Link>

          {/* Services dropdown */}
          <button className="flex items-center text-white text-sm px-3 py-1 rounded hover:bg-gray-700 transition-colors">
            Services ▾
          </button>

          {/* Search bar */}
          <div className="flex-1 mx-4">
            <input
              type="text"
              placeholder="Search"
              className="w-full max-w-md px-3 py-1 text-sm rounded"
              style={{ backgroundColor: '#3a4553', border: 'none', color: '#fff', outline: 'none' }}
            />
          </div>

          {/* Right nav items */}
          <div className="flex items-center space-x-3">
            <span className="text-gray-300 text-sm">us-east-1 ▾</span>
            <span className="text-gray-300 text-sm">Support ▾</span>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-gray-300 text-sm hover:text-white transition-colors"
              >
                {user?.username || 'User'} @ {user?.account_id || '123456789012'} ▾
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-8 w-64 bg-white border shadow-lg rounded z-50" style={{ borderColor: '#d5d9d9' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
                    <div className="text-xs text-gray-500">Account ID</div>
                    <div className="text-sm font-medium">{user?.account_id}</div>
                    <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); window.location.href = '/login'; }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      style={{ color: '#16191f' }}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service name row */}
        <div className="flex items-center h-9 px-4">
          <span className="text-white text-sm font-medium mr-6">Route 53</span>
          <nav className="flex space-x-1" aria-label="Route 53 shortcuts">
            {[
              { label: 'Hosted zones', href: '/route53/hosted-zones' },
              { label: 'Health checks', href: '/route53/health-checks' },
              { label: 'Resolver', href: '/route53/resolver' },
            ].map(tab => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm px-3 py-1 rounded transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav className="route53-mobile-nav" aria-label="Route 53 sections">
        {sidebarItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/route53' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'active' : ''}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="aws-sidebar flex-shrink-0 pt-4" style={{ width: 220 }}>
          <div className="px-4 pb-2">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#879596' }}>
              Route 53
            </div>
          </div>
          <nav>
            {sidebarItems.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== '/route53' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`aws-sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <span className="mr-2 text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 px-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#879596' }}>
              Related services
            </div>
            <div className="aws-sidebar-item text-gray-500 cursor-default">CloudFront</div>
            <div className="aws-sidebar-item text-gray-500 cursor-default">Certificate Manager</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="route53-main flex-1 overflow-auto" style={{ backgroundColor: '#f2f3f3' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
