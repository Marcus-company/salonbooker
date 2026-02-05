'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// Force dynamic rendering for auth
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Ongeldige inloggegevens')
        return
      }

      if (data.session) {
        // Hard redirect to admin - use window.location for reliability
        const role = data.session.user.user_metadata?.role || 'staff'
        const targetUrl = role === 'admin' ? '/admin' : '/admin/bookingen'
        
        // Force navigation
        if (typeof window !== 'undefined') {
          window.location.href = targetUrl
        } else {
          router.push(targetUrl)
          router.refresh()
        }
      }
    } catch {
      setError('Er is iets misgegaan. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">SalonBooker</h1>
          <p className="mt-2 text-slate-600">Admin Dashboard - HairsalonX</p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="josje@hairsalonx.nl"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Wachtwoord
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-500">
            Alleen geautoriseerd personeel
          </p>
          <p className="text-sm text-slate-500">
            Nog geen account?{' '}
            <a href="/signup" className="text-slate-900 font-medium hover:underline">
              Account aanmaken
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
