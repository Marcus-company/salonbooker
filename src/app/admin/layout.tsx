import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClientLayout from './AdminClientLayout'

// Force dynamic rendering for auth
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  const userRole = session.user.user_metadata?.role || 'staff'
  const userName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Gebruiker'
  const userEmail = session.user.email || ''

  // Define nav items based on role
  const navItems = [
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Dashboard', icon: '📊' }] : []),
    { href: '/admin/bookingen', label: 'Boekingen', icon: '📋' },
    { href: '/admin/kalender', label: 'Kalender', icon: '📅' },
    { href: '/admin/beschikbaarheid', label: 'Mijn Beschikbaarheid', icon: '⏰' },
    ...(userRole === 'admin' ? [{ href: '/admin/medewerkers', label: 'Medewerkers', icon: '👥' }] : []),
    ...(userRole === 'admin' ? [{ href: '/admin/medewerkers/rooster', label: 'Medewerkers Rooster', icon: '📆' }] : []),
    ...(userRole === 'admin' ? [{ href: '/admin/analytics', label: 'Analytics', icon: '📈' }] : []),
    ...(userRole === 'admin' ? [{ href: '/admin/webhooks', label: 'Webhooks', icon: '🔗' }] : []),
    ...(userRole === 'admin' ? [{ href: '/admin/instellingen', label: 'Instellingen', icon: '⚙️' }] : []),
  ]

  return (
    <AdminClientLayout 
      navItems={navItems}
      userName={userName}
      userEmail={userEmail}
      userRole={userRole}
    >
      {children}
    </AdminClientLayout>
  )
}
