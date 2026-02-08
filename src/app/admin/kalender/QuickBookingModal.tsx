'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Service {
  id: string
  name: string
  duration: string
  price: string
}

interface Staff {
  id: string
  name: string
}

interface QuickBookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: string
  initialTime?: string
  onSuccess: () => void
}

export default function QuickBookingModal({ 
  isOpen, 
  onClose, 
  initialDate, 
  initialTime,
  onSuccess 
}: QuickBookingModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_id: '',
    staff_id: '',
    booking_date: initialDate || '',
    booking_time: initialTime || '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchServicesAndStaff()
      if (initialDate) {
        setFormData(prev => ({ ...prev, booking_date: initialDate }))
      }
      if (initialTime) {
        setFormData(prev => ({ ...prev, booking_time: initialTime }))
      }
    }
  }, [isOpen, initialDate, initialTime])

  const fetchServicesAndStaff = async () => {
    const { data: salonData } = await supabase
      .from('salons')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (salonData?.id) {
      const [{ data: servicesData }, { data: staffData }] = await Promise.all([
        supabase.from('services').select('*').eq('salon_id', salonData.id).eq('is_active', true),
        supabase.from('staff').select('*').eq('salon_id', salonData.id).eq('is_active', true)
      ])
      setServices(servicesData || [])
      setStaff(staffData || [])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const selectedService = services.find(s => s.id === formData.service_id)
    const selectedStaff = staff.find(s => s.id === formData.staff_id)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          customer_email: formData.customer_email || null,
          service_name: selectedService?.name || 'Onbekende service',
          service_duration: selectedService?.duration || '',
          staff_name: selectedStaff?.name || 'Geen voorkeur',
          booking_date: formData.booking_date,
          booking_time: formData.booking_time,
          notes: formData.notes,
          status: 'confirmed',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Er is iets misgegaan')
      }

      onSuccess()
      onClose()
      setStep(1)
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        service_id: '',
        staff_id: '',
        booking_date: '',
        booking_time: '',
        notes: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Snelle afspraak</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  step >= s ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="p-6">
          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Datum en tijd</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tijd</label>
                <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setFormData({ ...formData, booking_time: time })}
                      className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                        formData.booking_time === time
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.booking_date || !formData.booking_time}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
              </button>
            </div>
          )}

          {/* Step 2: Service & Staff */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Service en medewerker</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Service</label>
                {services.length === 0 ? (
                  <p className="text-slate-500 text-sm">Geen services beschikbaar</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setFormData({ ...formData, service_id: service.id })}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                          formData.service_id === service.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-900">{service.name}</span>
                          <span className="text-slate-600">{service.price}</span>
                        </div>
                        <span className="text-xs text-slate-500">{service.duration}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Medewerker</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFormData({ ...formData, staff_id: '' })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.staff_id === ''
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium text-slate-900">Geen voorkeur</span>
                  </button>
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, staff_id: s.id })}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.staff_id === s.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-slate-900">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Terug
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.service_id}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Volgende
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customer Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Klantgegevens</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Klant naam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefoon *</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06-12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="klant@email.nl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notities</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Speciale wensen..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Terug
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.customer_name || !formData.customer_phone}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Bezig...' : 'Afspraak maken'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
