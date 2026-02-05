'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'staff', // Default role for new accounts
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Get the salon ID
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        // Create staff record linked to auth user
        if (salonData?.id) {
          await supabase.from('staff').insert([{
            salon_id: salonData.id,
            auth_user_id: data.user.id,
            name: name,
            email: email,
            role: 'staff',
            is_active: true,
          }])
        }
        
        setSuccess(true)
      }
    } catch {
      setError('Er is iets misgegaan. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-slate-900">Account aangemaakt!</h1>
          <p className="text-slate-600">
            Controleer je email om je account te verifiëren. Daarna kan je inloggen.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Naar inloggen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">SalonBooker</h1>
          <p className="mt-2 text-slate-600">Nieuw account aanmaken</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Naam
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="Jouw naam"
            />
          </div>

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
              placeholder="jouw@email.nl"
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
              minLength={6}
              className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="Minimaal 6 tekens"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig...' : 'Account aanmaken'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Al een account?{' '}
          <Link href="/" className="text-slate-900 font-medium hover:underline">
            Inloggen
          </Link>
        </p>
      </div>
    </div>
  )
}
