'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Service {
  id: string
  name: string
  duration: string
  price: string
  duration_minutes?: number
}

interface SelectedService extends Service {
  quantity: number
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

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
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

    const selectedStaffMember = staff.find(s => s.id === formData.staff_id)
    const totals = calculateTotals()

    try {
      // Create booking with multiple services
      const bookingData = {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || null,
        // Primary service (first one for backward compatibility)
        service_name: selectedServices[0]?.name || 'Onbekende service',
        service_duration: totals.formattedDuration,
        service_price: parseFloat(totals.totalPrice.replace(',', '.')),
        staff_name: selectedStaffMember?.name || 'Geen voorkeur',
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        notes: formData.notes + (selectedServices.length > 1 
          ? `\n\nServices: ${selectedServices.map(s => `${s.name} (${s.quantity}x)`).join(', ')}` 
          : ''),
        status: 'pending',
        // Extra field for multiple services (JSON string)
        services_json: JSON.stringify(selectedServices.map(s => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          price: s.price,
          quantity: s.quantity,
        }))),
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
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

  // Parse duration string to minutes
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)\s*min/)
    return match ? parseInt(match[1]) : 60
  }

  // Parse price string to number
  const parsePrice = (price: string): number => {
    const match = price.replace(/[^\d,]/g, '').replace(',', '.')
    return parseFloat(match) || 0
  }

  // Calculate totals
  const calculateTotals = () => {
    let totalMinutes = 0
    let totalPrice = 0
    
    selectedServices.forEach(service => {
      totalMinutes += parseDuration(service.duration) * service.quantity
      totalPrice += parsePrice(service.price) * service.quantity
    })
    
    return {
      totalMinutes,
      totalPrice: totalPrice.toFixed(2).replace('.', ','),
      formattedDuration: totalMinutes >= 60 
        ? `${Math.floor(totalMinutes / 60)}u ${totalMinutes % 60}min`
        : `${totalMinutes} min`
    }
  }

  // Add service to selection
  const addService = (service: Service) => {
    const existing = selectedServices.find(s => s.id === service.id)
    if (existing) {
      setSelectedServices(selectedServices.map(s => 
        s.id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ))
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }])
    }
  }

  // Remove service from selection
  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId))
  }

  // Update service quantity
  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId)
    } else {
      setSelectedServices(selectedServices.map(s => 
        s.id === service.id ? { ...s, quantity } : s
      ))
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
                setSelectedServices([])
                setFormData({
                  customer_name: '',
                  customer_phone: '',
                  customer_email: '',
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
    <div className="min-h-screen bg-slate-50 py-6 md:py-12 px-4">
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
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Kies behandelingen</h2>
                
                {/* Selected Services Summary */}
                {selectedServices.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-blue-900 mb-2">Geselecteerde services:</h3>
                    <div className="space-y-2">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between">
                          <span className="text-blue-800">{service.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(service.id, service.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-blue-900 font-medium">{service.quantity}</span>
                            <button
                              onClick={() => updateQuantity(service.id, service.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-blue-100 flex items-center justify-center"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeService(service.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-blue-900">
                        <span>Totaal: {calculateTotals().formattedDuration}</span>
                        <span className="font-bold">€ {calculateTotals().totalPrice}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ga verder →
                    </button>
                  </div>
                )}

                {/* Available Services */}
                {services.length === 0 ? (
                  <p className="text-slate-500">Geen behandelingen beschikbaar</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((service) => {
                      const isSelected = selectedServices.find(s => s.id === service.id)
                      return (
                        <button
                          key={service.id}
                          onClick={() => addService(service)}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-900">{service.name}</span>
                            <span className="text-slate-600">{service.price}</span>
                          </div>
                          <span className="text-sm text-slate-500">{service.duration}</span>
                          {isSelected && (
                            <span className="text-sm text-blue-600 mt-1 block">
                              ✓ Toegevoegd ({isSelected.quantity}x)
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
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

                {/* Booking Summary */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-2">Samenvatting</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Services:</span></p>
                    {selectedServices.map((service) => (
                      <p key={service.id} className="text-slate-700">
                        • {service.name} {service.quantity > 1 && `(${service.quantity}x)`}
                      </p>
                    ))}
                    <p><span className="text-slate-500">Medewerker:</span> {staff.find(s => s.id === formData.staff_id)?.name || 'Geen voorkeur'}</p>
                    <p><span className="text-slate-500">Datum:</span> {new Date(formData.booking_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p><span className="text-slate-500">Tijd:</span> {formData.booking_time}</p>
                    <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-medium">
                      <span>Totaal ({calculateTotals().formattedDuration}):</span>
                      <span>€ {calculateTotals().totalPrice}</span>
                    </div>
                  </div>
                </div>

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
