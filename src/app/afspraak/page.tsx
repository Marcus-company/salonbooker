'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

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

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_id: '',
    staff_id: '',
    booking_date: '',
    booking_time: '',
    notes: '',
  })

  useEffect(() => {
    fetchServicesAndStaff()
  }, [])

  const fetchServicesAndStaff = async () => {
    setLoading(true)
    
    // Fetch salon first (get the first active salon)
    const { data: salonData } = await supabase
      .from('salons')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    const salonId = salonData?.id
    
    if (salonId) {
      // Fetch services for this salon
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
      
      // Fetch staff for this salon
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)

      setServices(servicesData || [])
      setStaff(staffData || [])
    } else {
      // Fallback: no salon configured yet
      setServices([])
      setStaff([])
    }
    setLoading(false)
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
          status: 'pending',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Er is iets misgegaan')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Boeking ontvangen!</h1>
            <p className="text-slate-600 mb-6">
              Bedankt voor je aanvraag. We nemen zo snel mogelijk contact met je op om de afspraak te bevestigen.
            </p>
            <button
              onClick={() => {
                setSuccess(false)
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
              }}
              className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Nieuwe boeking maken
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">HairsalonX</h1>
          <p className="text-slate-600 mt-2">Maak een afspraak</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && step !== 4 ? (
          <LoadingSpinner text="Laden..." />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Step 1: Service */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Kies een behandeling</h2>
                {services.length === 0 ? (
                  <p className="text-slate-500">Geen behandelingen beschikbaar</p>
                ) : (
                  services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setFormData({ ...formData, service_id: service.id })
                        setStep(2)
                      }}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.service_id === service.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-900">{service.name}</span>
                        <span className="text-slate-600">{service.price}</span>
                      </div>
                      <span className="text-sm text-slate-500">{service.duration}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Staff */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Kies een medewerker</h2>
                <button
                  onClick={() => {
                    setFormData({ ...formData, staff_id: '' })
                    setStep(3)
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                    formData.staff_id === ''
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-medium text-slate-900">Geen voorkeur</span>
                </button>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setFormData({ ...formData, staff_id: s.id })
                      setStep(3)
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.staff_id === s.id
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium text-slate-900">{s.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-slate-600 hover:text-slate-900"
                >
                  ← Terug
                </button>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Kies datum en tijd</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Datum</label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>

                {formData.booking_date && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tijd</label>
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => {
                            setFormData({ ...formData, booking_time: time })
                            setStep(4)
                          }}
                          className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                            formData.booking_time === time
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-2 text-slate-600 hover:text-slate-900"
                >
                  ← Terug
                </button>
              </div>
            )}

            {/* Step 4: Contact info */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Je gegevens</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Naam *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Jouw naam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefoon *</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="06-12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="jouw@email.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Opmerkingen</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Bijv. speciale wensen..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.customer_name || !formData.customer_phone}
                  className="w-full py-3 px-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Bezig...' : 'Afspraak aanvragen'}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-2 text-slate-600 hover:text-slate-900"
                >
                  ← Terug
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
