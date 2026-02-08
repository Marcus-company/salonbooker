'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  service_name: string
  service_duration?: string
  staff_name: string
  booking_date: string
  booking_time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  notes?: string
  created_at: string
}

export default function BookingenPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editForm, setEditForm] = useState<Partial<Booking>>({})

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: 'confirmed' | 'pending' | 'cancelled') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating booking:', error)
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b))
    }
  }

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking)
    setEditForm({
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      service_name: booking.service_name,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      notes: booking.notes || '',
    })
  }

  const closeEditModal = () => {
    setEditingBooking(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingBooking) return
    
    const { error } = await supabase
      .from('bookings')
      .update(editForm)
      .eq('id', editingBooking.id)

    if (error) {
      console.error('Error updating booking:', error)
      alert('Fout bij opslaan: ' + error.message)
    } else {
      setBookings(bookings.map(b => b.id === editingBooking.id ? { ...b, ...editForm } : b))
      closeEditModal()
    }
  }

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter)

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    confirmed: 'Bevestigd',
    pending: 'In afwachting',
    cancelled: 'Geannuleerd',
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Boekingen laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Boekingen</h1>
          <p className="text-slate-600 text-sm md:text-base">Beheer alle afspraken ({bookings.length} totaal)</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          + Nieuwe boeking
        </button>
      </div>

      {/* Stats - Professional cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              filter === f 
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className={`text-xs md:text-sm font-medium ${filter === f ? 'text-slate-300' : 'text-slate-500'}`}>
              {f === 'all' ? 'Alle boekingen' : statusLabels[f]}
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-1">
              {f === 'all' ? bookings.length : bookings.filter(b => b.status === f).length}
            </p>
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Klant</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Service</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Medewerker</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Datum & Tijd</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{booking.customer_name}</p>
                    <p className="text-sm text-slate-500">{booking.customer_phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{booking.service_name}</p>
                    {booking.service_duration && (
                      <p className="text-sm text-slate-500">{booking.service_duration}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{booking.staff_name}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">
                      {new Date(booking.booking_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-sm text-slate-500">{booking.booking_time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {booking.status !== 'confirmed' && (
                        <button 
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Bevestig
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => updateStatus(booking.id, 'cancelled')}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Annuleer
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(booking)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        Bewerk
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
                <p className="text-sm text-slate-500">{booking.customer_phone}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                {statusLabels[booking.status]}
              </span>
            </div>
            
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="text-slate-900">{booking.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medewerker:</span>
                <span className="text-slate-900">{booking.staff_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Datum:</span>
                <span className="text-slate-900">
                  {new Date(booking.booking_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  {' '}{booking.booking_time}
                </span>
              </div>
              {booking.service_duration && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Duur:</span>
                  <span className="text-slate-900">{booking.service_duration}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              {booking.status !== 'confirmed' && (
                <button 
                  onClick={() => updateStatus(booking.id, 'confirmed')}
                  className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Bevestig
                </button>
              )}
              {booking.status !== 'cancelled' && (
                <button 
                  onClick={() => updateStatus(booking.id, 'cancelled')}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Annuleer
                </button>
              )}
              <button 
                onClick={() => openEditModal(booking)}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                Bewerk
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Geen boekingen gevonden</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Boeking bewerken</h2>
              <p className="text-slate-500 text-sm">Wijzig de gegevens van de afspraak</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Klantnaam</label>
                <input
                  type="text"
                  value={editForm.customer_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefoon</label>
                <input
                  type="tel"
                  value={editForm.customer_phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                <input
                  type="text"
                  value={editForm.service_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={editForm.booking_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, booking_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tijd</label>
                  <input
                    type="time"
                    value={editForm.booking_time || ''}
                    onChange={(e) => setEditForm({ ...editForm, booking_time: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notities</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
