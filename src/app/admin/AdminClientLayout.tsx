'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReactNode } from 'react'
import LogoutButton from './components/LogoutButton'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface AdminClientLayoutProps {
  children: ReactNode
  navItems: NavItem[]
  userName: string
  userEmail: string
  userRole: string
}

export default function AdminClientLayout({
  children,
  navItems,
  userName,
  userEmail,
  userRole,
}: AdminClientLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SalonBooker</h1>
            {userRole === 'admin' && (
              <span className="text-xs text-purple-600">Admin</span>
            )}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">
          👤
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-40 overflow-auto">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-200 mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{userName}</p>
                  <p className="text-sm text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </>
      )}
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900">SalonBooker</h1>
          <p className="text-sm text-slate-500">HairsalonX Admin</p>
          {userRole === 'admin' && (
            <span className="mt-2 inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
              Admin
            </span>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
              👤
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{userName}</p>
              <p className="text-sm text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
