'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function GoogleCalendarConnect() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/calendar/sync')
      const data = await response.json()
      setConnected(data.connected)
    } catch (error) {
      console.error('Error checking calendar connection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/calendar/auth')
      const data = await response.json()
      
      if (data.authUrl) {
        // Open Google OAuth in popup
        const popup = window.open(
          data.authUrl,
          'Google Calendar Connect',
          'width=500,height=600'
        )
        
        // Listen for popup close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            checkConnection()
          }
        }, 1000)
      } else if (data.connected) {
        setConnected(true)
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      alert('Er is een fout opgetreden bij het verbinden van je agenda.')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (bookingId: string) => {
    try {
      setSyncing(true)
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Afspraak succesvol gesynchroniseerd met Google Calendar!')
      } else {
        alert('Fout bij synchroniseren: ' + data.error)
      }
    } catch (error) {
      console.error('Error syncing booking:', error)
      alert('Er is een fout opgetreden bij het synchroniseren.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Google Calendar</h3>
            <p className="text-sm text-slate-600">
              {connected 
                ? '✅ Verbonden - Boekingen worden gesynchroniseerd'
                : 'Synchroniseer je afspraken met Google Calendar'
              }
            </p>
          </div>
        </div>
        
        {!connected && (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Laden...' : 'Verbinden'}
          </button>
        )}
        
        {connected && (
          <span className="text-green-600 font-medium">Verbonden</span>
        )}
      </div>
    </div>
  )
}
