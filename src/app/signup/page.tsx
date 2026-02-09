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
      // Sign up with Supabase (email confirmation disabled - we'll handle it)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name,
            role: 'staff',
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Send custom confirmation email via Resend
        const confirmationUrl = `${window.location.origin}/auth/confirm?token=${data.user.confirmation_sent_at}&email=${encodeURIComponent(email)}`
        
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signup',
              to: email,
              data: {
                name,
                confirmationUrl: `${window.location.origin}/login?verified=true&email=${encodeURIComponent(email)}`,
              },
            }),
          })
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError)
          // Don't block signup if email fails
        }

        // Get the salon ID (optional - signup works without salon)
        const { data: salonData } = await supabase
          .from('salons')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .single()
        
        // Create staff record linked to auth user (if salon exists)
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
        
        // User created successfully - staff record optional
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-white rounded-xl shadow-lg">
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
