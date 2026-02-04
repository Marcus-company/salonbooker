'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full py-2 px-4 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-left"
    >
      🚪 Uitloggen
    </button>
  )
}
