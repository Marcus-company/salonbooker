'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface AvailabilitySlot {
  day: string
  start_time: string
  end_time: string
  is_available: boolean
  break_start?: string
  break_end?: string
}

const DAYS = [
  { key: 'monday', label: 'Maandag', short: 'Ma' },
  { key: 'tuesday', label: 'Dinsdag', short: 'Di' },
  { key: 'wednesday', label: 'Woensdag', short: 'Wo' },
  { key: 'thursday', label: 'Donderdag', short: 'Do' },
  { key: 'friday', label: 'Vrijdag', short: 'Vr' },
  { key: 'saturday', label: 'Zaterdag', short: 'Za' },
  { key: 'sunday', label: 'Zondag', short: 'Zo' },
]

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map(d => ({
  day: d.key,
  start_time: '09:00',
  end_time: '17:00',
  is_available: d.key !== 'sunday',
  break_start: '12:00',
  break_end: '13:00',
}))

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    setLoading(true)
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    // Get staff record
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, availability')
      .eq('auth_user_id', session.user.id)
      .single()

    if (staffData?.availability) {
      // Merge with defaults to ensure all days exist
      const savedSlots = staffData.availability as AvailabilitySlot[]
      const mergedSlots = DEFAULT_SLOTS.map(defaultSlot => {
        const saved = savedSlots.find(s => s.day === defaultSlot.day)
        return saved || defaultSlot
      })
      setSlots(mergedSlots)
    }

    setLoading(false)
  }

  const saveAvailability = async () => {
    setSaving(true)
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      return
    }

    // Get staff record
    const { data: staffData } = await supabase
      .from('staff')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (staffData?.id) {
      const { error } = await supabase
        .from('staff')
        .update({ availability: slots })
        .eq('id', staffData.id)

      if (error) {
        console.error('Error saving availability:', error)
        alert('Fout bij opslaan: ' + error.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    }

    setSaving(false)
  }

  const updateSlot = (day: string, updates: Partial<AvailabilitySlot>) => {
    setSlots(slots.map(s => s.day === day ? { ...s, ...updates } : s))
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Beschikbaarheid laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Mijn Beschikbaarheid</h1>
        <p className="text-slate-600 text-sm md:text-base">
          Stel in wanneer je beschikbaar bent voor afspraken
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-blue-800 text-sm">
          💡 <strong>Tip:</strong> Klanten kunnen alleen boeken tijdens je beschikbare uren. 
          Je pauze wordt automatisch geblokkeerd.
        </p>
      </div>

      {/* Days List */}
      <div className="space-y-4 mb-8">
        {DAYS.map((dayInfo) => {
          const slot = slots.find(s => s.day === dayInfo.key)!
          return (
            <div 
              key={dayInfo.key}
              className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
                slot.is_available 
                  ? 'border-slate-200 shadow-sm' 
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Day Toggle */}
                  <div className="flex items-center justify-between md:w-48">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        slot.is_available 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {dayInfo.short}
                      </div>
                      <span className={`font-medium ${slot.is_available ? 'text-slate-900' : 'text-slate-500'}`}>
                        {dayInfo.label}
                      </span>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.is_available}
                        onChange={(e) => updateSlot(dayInfo.key, { is_available: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Time Inputs - Only show if available */}
                  {slot.is_available && (
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Start</label>
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(dayInfo.key, { start_time: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Einde</label>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(dayInfo.key, { end_time: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Pauze start</label>
                        <input
                          type="time"
                          value={slot.break_start || ''}
                          onChange={(e) => updateSlot(dayInfo.key, { break_start: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Pauze einde</label>
                        <input
                          type="time"
                          value={slot.break_end || ''}
                          onChange={(e) => updateSlot(dayInfo.key, { break_end: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Closed indicator */}
                  {!slot.is_available && (
                    <div className="md:flex-1 text-slate-500 text-sm italic">
                      Gesloten
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveAvailability}
          disabled={saving}
          className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Bezig met opslaan...' : 'Beschikbaarheid opslaan'}
        </button>
        
        {saved && (
          <span className="text-green-600 font-medium flex items-center gap-2">
            ✅ Opgeslagen!
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Snelle acties</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSlots(DEFAULT_SLOTS)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            Reset naar standaard (Ma-Za 9-17)
          </button>
          <button
            onClick={() => setSlots(slots.map(s => ({ ...s, is_available: true })))}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            Alle dagen open
          </button>
          <button
            onClick={() => setSlots(slots.map(s => ({ ...s, is_available: false })))}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            Alle dagen gesloten
          </button>
        </div>
      </div>
    </div>
  )
}
