'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Staff {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  availability?: AvailabilitySlot[]
}

interface AvailabilitySlot {
  day: string
  start_time: string
  end_time: string
  is_available: boolean
  break_start?: string
  break_end?: string
}

const DAYS = [
  { key: 'monday', label: 'Ma', full: 'Maandag' },
  { key: 'tuesday', label: 'Di', full: 'Dinsdag' },
  { key: 'wednesday', label: 'Wo', full: 'Woensdag' },
  { key: 'thursday', label: 'Do', full: 'Donderdag' },
  { key: 'friday', label: 'Vr', full: 'Vrijdag' },
  { key: 'saturday', label: 'Za', full: 'Zaterdag' },
  { key: 'sunday', label: 'Zo', full: 'Zondag' },
]

const DEFAULT_SLOTS: AvailabilitySlot[] = DAYS.map(d => ({
  day: d.key,
  start_time: '09:00',
  end_time: '17:00',
  is_available: d.key !== 'sunday',
  break_start: '12:00',
  break_end: '13:00',
}))

export default function MedewerkersRoosterPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [editSlots, setEditSlots] = useState<AvailabilitySlot[]>(DEFAULT_SLOTS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching staff:', error)
    } else {
      setStaff(data || [])
    }

    setLoading(false)
  }

  const openEditModal = (member: Staff) => {
    setSelectedStaff(member)
    if (member.availability) {
      const savedSlots = member.availability as AvailabilitySlot[]
      const mergedSlots = DEFAULT_SLOTS.map(defaultSlot => {
        const saved = savedSlots.find(s => s.day === defaultSlot.day)
        return saved || defaultSlot
      })
      setEditSlots(mergedSlots)
    } else {
      setEditSlots(DEFAULT_SLOTS)
    }
  }

  const closeEditModal = () => {
    setSelectedStaff(null)
    setEditSlots(DEFAULT_SLOTS)
  }

  const saveStaffAvailability = async () => {
    if (!selectedStaff) return
    
    setSaving(true)

    const { error } = await supabase
      .from('staff')
      .update({ availability: editSlots })
      .eq('id', selectedStaff.id)

    if (error) {
      console.error('Error saving availability:', error)
      alert('Fout bij opslaan: ' + error.message)
    } else {
      // Update local state
      setStaff(staff.map(s => 
        s.id === selectedStaff.id 
          ? { ...s, availability: editSlots } 
          : s
      ))
      closeEditModal()
    }

    setSaving(false)
  }

  const updateEditSlot = (day: string, updates: Partial<AvailabilitySlot>) => {
    setEditSlots(editSlots.map(s => s.day === day ? { ...s, ...updates } : s))
  }

  const formatTimeRange = (slots: AvailabilitySlot[] | undefined) => {
    if (!slots) return 'Standaard'
    
    const availableDays = slots.filter(s => s.is_available)
    if (availableDays.length === 0) return 'Geen uren'
    
    const weekdays = availableDays.filter(s => 
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(s.day)
    ).length
    
    const weekend = availableDays.filter(s => 
      ['saturday', 'sunday'].includes(s.day)
    ).length
    
    if (weekdays === 5 && weekend === 0) return 'Ma-Vr'
    if (weekdays === 5 && weekend === 2) return 'Ma-Zo'
    if (availableDays.length === 7) return 'Alle dagen'
    return `${availableDays.length} dagen`
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Medewerkers laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Medewerkers Rooster</h1>
        <p className="text-slate-600 text-sm md:text-base">
          Beheer werktijden en beschikbaarheid van alle medewerkers
        </p>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Medewerkers ({staff.length})</h2>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm">
            + Nieuwe medewerker
          </button>
        </div>

        <div className="divide-y divide-slate-200">
          {staff.map((member) => (
            <div key={member.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                      member.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {member.role === 'admin' ? 'Admin' : 'Medewerker'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{formatTimeRange(member.availability)}</p>
                    <p className="text-xs text-slate-500">
                      {member.availability 
                        ? 'Aangepast rooster' 
                        : 'Standaard rooster (09:00-17:00)'}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditModal(member)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    Bewerk uren
                  </button>
                </div>
              </div>

              {/* Mini schedule preview */}
              <div className="mt-4 flex gap-1">
                {DAYS.map((day) => {
                  const slot = member.availability?.find((s: AvailabilitySlot) => s.day === day.key)
                  const isAvailable = slot?.is_available ?? (day.key !== 'sunday')
                  
                  return (
                    <div
                      key={day.key}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-medium ${
                        isAvailable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-400'
                      }`}
                      title={slot ? `${slot.start_time}-${slot.end_time}` : '09:00-17:00'}
                    >
                      {day.label}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {staff.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">Geen medewerkers gevonden</p>
            <button className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              Nieuwe medewerker toevoegen
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Rooster bewerken</h2>
              <p className="text-slate-500">{selectedStaff.name} • {selectedStaff.email}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {DAYS.map((dayInfo) => {
                const slot = editSlots.find(s => s.day === dayInfo.key)!
                return (
                  <div 
                    key={dayInfo.key}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      slot.is_available 
                        ? 'border-slate-200' 
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-slate-900 w-24">{dayInfo.full}</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slot.is_available}
                              onChange={(e) => updateEditSlot(dayInfo.key, { is_available: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        {!slot.is_available && (
                          <span className="text-slate-500 text-sm italic">Gesloten</span>
                        )}
                      </div>

                      {slot.is_available && (
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Start</label>
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateEditSlot(dayInfo.key, { start_time: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Einde</label>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateEditSlot(dayInfo.key, { end_time: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Pauze start</label>
                            <input
                              type="time"
                              value={slot.break_start || ''}
                              onChange={(e) => updateEditSlot(dayInfo.key, { break_start: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Pauze einde</label>
                            <input
                              type="time"
                              value={slot.break_end || ''}
                              onChange={(e) => updateEditSlot(dayInfo.key, { break_end: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={saveStaffAvailability}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
