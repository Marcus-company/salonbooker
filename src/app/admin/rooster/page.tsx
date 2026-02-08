'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Staff {
  id: string
  name: string
  email: string
  role: string
}

interface Availability {
  id?: string
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
  break_start?: string
  break_end?: string
}

const DAYS = [
  { id: 1, name: 'Maandag', short: 'Ma' },
  { id: 2, name: 'Dinsdag', short: 'Di' },
  { id: 3, name: 'Woensdag', short: 'Wo' },
  { id: 4, name: 'Donderdag', short: 'Do' },
  { id: 5, name: 'Vrijdag', short: 'Vr' },
  { id: 6, name: 'Zaterdag', short: 'Za' },
  { id: 0, name: 'Zondag', short: 'Zo' },
]

const DEFAULT_AVAILABILITY: Omit<Availability, 'staff_id'>[] = [
  { day_of_week: 1, start_time: '09:00', end_time: '17:00', is_working: true },
  { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_working: true },
  { day_of_week: 3, start_time: '09:00', end_time: '17:00', is_working: true },
  { day_of_week: 4, start_time: '09:00', end_time: '17:00', is_working: true },
  { day_of_week: 5, start_time: '09:00', end_time: '17:00', is_working: true },
  { day_of_week: 6, start_time: '09:00', end_time: '17:00', is_working: false },
  { day_of_week: 0, start_time: '09:00', end_time: '17:00', is_working: false },
]

export default function RoosterPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    if (selectedStaff) {
      fetchAvailability(selectedStaff.id)
    }
  }, [selectedStaff])

  const fetchStaff = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email, role')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching staff:', error)
    } else {
      setStaff(data || [])
      if (data && data.length > 0) {
        setSelectedStaff(data[0])
      }
    }
    setLoading(false)
  }

  const fetchAvailability = async (staffId: string) => {
    const { data, error } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', staffId)
      .order('day_of_week')

    if (error) {
      // Table might not exist yet - use defaults
      setAvailability(DEFAULT_AVAILABILITY.map(a => ({ ...a, staff_id: staffId })))
    } else if (data && data.length > 0) {
      setAvailability(data)
    } else {
      // No data yet - use defaults
      setAvailability(DEFAULT_AVAILABILITY.map(a => ({ ...a, staff_id: staffId })))
    }
  }

  const updateDay = (dayOfWeek: number, updates: Partial<Availability>) => {
    setAvailability(prev => 
      prev.map(a => a.day_of_week === dayOfWeek ? { ...a, ...updates } : a)
    )
  }

  const saveAvailability = async () => {
    if (!selectedStaff) return
    
    setSaving(true)
    setMessage(null)

    try {
      // Delete existing availability for this staff
      await supabase
        .from('staff_availability')
        .delete()
        .eq('staff_id', selectedStaff.id)

      // Insert new availability
      const { error } = await supabase
        .from('staff_availability')
        .insert(
          availability.map(a => ({
            staff_id: selectedStaff.id,
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            is_working: a.is_working,
            break_start: a.break_start || null,
            break_end: a.break_end || null,
          }))
        )

      if (error) {
        throw error
      }

      setMessage({ type: 'success', text: 'Rooster opgeslagen!' })
    } catch (error) {
      console.error('Error saving availability:', error)
      setMessage({ type: 'error', text: 'Er ging iets mis bij het opslaan.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Rooster laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Rooster beheren</h1>
        <p className="text-slate-600 text-sm md:text-base">Stel werktijden in per medewerker</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Staff Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Medewerker</label>
        <select
          value={selectedStaff?.id || ''}
          onChange={(e) => {
            const staff = staff.find(s => s.id === e.target.value)
            setSelectedStaff(staff || null)
          }}
          className="w-full md:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.role === 'admin' ? 'Admin' : 'Medewerker'})</option>
          ))}
        </select>
      </div>

      {/* Schedule Grid */}
      {selectedStaff && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Werkrooster voor {selectedStaff.name}</h2>
            </div>

            <div className="divide-y divide-slate-200">
              {DAYS.map((day) => {
                const dayAvailability = availability.find(a => a.day_of_week === day.id)
                if (!dayAvailability) return null

                return (
                  <div key={day.id} className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Day name */}
                      <div className="flex items-center gap-3 md:w-32">
                        <input
                          type="checkbox"
                          checked={dayAvailability.is_working}
                          onChange={(e) => updateDay(day.id, { is_working: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="font-medium text-slate-900">{day.name}</span>
                      </div>

                      {/* Time inputs */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Van</span>
                          <input
                            type="time"
                            value={dayAvailability.start_time}
                            onChange={(e) => updateDay(day.id, { start_time: e.target.value })}
                            disabled={!dayAvailability.is_working}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">Tot</span>
                          <input
                            type="time"
                            value={dayAvailability.end_time}
                            onChange={(e) => updateDay(day.id, { end_time: e.target.value })}
                            disabled={!dayAvailability.is_working}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100"
                          />
                        </div>

                        {!dayAvailability.is_working && (
                          <span className="text-sm text-slate-400">Vrij</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Rooster opslaan'}
            </button>
          </div>
        </>
      )}

      {staff.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">Geen medewerkers gevonden</p>
          <p className="text-sm text-slate-400 mt-1">Voeg eerst medewerkers toe</p>
        </div>
      )}
    </div>
  )
}
