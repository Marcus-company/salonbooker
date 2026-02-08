'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Booking {
  id: string
  booking_date: string
  booking_time: string
  service_name: string
  service_price: number
  status: 'confirmed' | 'pending' | 'cancelled'
  staff_name: string
  notes?: string
  created_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  notes: string
  total_bookings: number
  total_spent: number
  first_visit: string | null
  last_visit: string | null
  bookings: Booking[]
}

export default function KlantDetailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (email || phone) {
      fetchCustomerDetail()
    }
  }, [email, phone])

  const fetchCustomerDetail = async () => {
    setLoading(true)
    
    // Build query
    let query = supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
    
    if (email) {
      query = query.eq('customer_email', email)
    } else if (phone) {
      query = query.eq('customer_phone', phone)
    }
    
    const { data: bookings, error } = await query

    if (error) {
      console.error('Error fetching customer:', error)
    } else if (bookings && bookings.length > 0) {
      // Build customer object from bookings
      const firstBooking = bookings[bookings.length - 1] // Oldest
      const lastBooking = bookings[0] // Most recent
      
      const totalSpent = bookings
        .filter((b: any) => b.status === 'confirmed')
        .reduce((sum: number, b: any) => sum + (b.service_price || 0), 0)
      
      setCustomer({
        id: firstBooking.id,
        name: firstBooking.customer_name,
        email: firstBooking.customer_email || '',
        phone: firstBooking.customer_phone || '',
        notes: firstBooking.notes || '',
        total_bookings: bookings.length,
        total_spent: totalSpent,
        first_visit: firstBooking.booking_date,
        last_visit: lastBooking.booking_date,
        bookings: bookings.map((b: any) => ({
          id: b.id,
          booking_date: b.booking_date,
          booking_time: b.booking_time,
          service_name: b.service_name,
          service_price: b.service_price || 0,
          status: b.status,
          staff_name: b.staff_name || 'Onbekend',
          notes: b.notes,
          created_at: b.created_at,
        })),
      })
      setNotesDraft(firstBooking.notes || '')
    }

    setLoading(false)
  }

  const saveNotes = async () => {
    if (!customer) return
    
    setSavingNotes(true)
    
    // Update all bookings for this customer
    const { error } = await supabase
      .from('bookings')
      .update({ notes: notesDraft })
      .eq('customer_email', customer.email)

    if (error) {
      console.error('Error saving notes:', error)
      alert('Fout bij opslaan: ' + error.message)
    } else {
      setCustomer({ ...customer, notes: notesDraft })
      setEditingNotes(false)
    }

    setSavingNotes(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-amber-100 text-amber-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bevestigd'
      case 'cancelled': return 'Geannuleerd'
      default: return 'In afwachting'
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Klant laden..." />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <p className="text-slate-500">Klant niet gevonden</p>
          <Link href="/admin/klanten" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Terug naar klantenlijst
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/klanten" className="text-slate-500 hover:text-slate-700 text-sm">
          ← Terug naar klantenlijst
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{customer.name}</h1>
              <p className="text-slate-500">{customer.email}</p>
              <p className="text-slate-500">{customer.phone}</p>
            </div>
          </div>
          <Link
            href="/admin/bookingen"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Nieuwe afspraak
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Totale afspraken</p>
          <p className="text-2xl font-bold text-slate-900">{customer.total_bookings}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Totaal uitgegeven</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.total_spent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Eerste bezoek</p>
          <p className="text-lg font-semibold text-slate-900">{formatDate(customer.first_visit!)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Laatste bezoek</p>
          <p className="text-lg font-semibold text-slate-900">{formatDate(customer.last_visit!)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Notes */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Notities</h2>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Bewerken
                </button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notities over deze klant..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingNotes(false)
                      setNotesDraft(customer.notes)
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                  >
                    {savingNotes ? 'Opslaan...' : 'Opslaan'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {customer.notes ? (
                  <p className="text-slate-700 whitespace-pre-wrap">{customer.notes}</p>
                ) : (
                  <p className="text-slate-400 italic">Geen notities</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Snelle acties</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${customer.email}`}
                className="block w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-center"
              >
                📧 Email sturen
              </a>
              <a
                href={`tel:${customer.phone}`}
                className="block w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-center"
              >
                📞 Bellen
              </a>
            </div>
          </div>
        </div>

        {/* Right: Booking History */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Afspraakhistorie</h2>
              <p className="text-slate-500 text-sm">{customer.bookings.length} afspra{customer.bookings.length === 1 ? 'ak' : 'ken'}</p>
            </div>

            <div className="divide-y divide-slate-200">
              {customer.bookings.map((booking) => (
                <div key={booking.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(booking.booking_date)} • {booking.booking_time}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-900">{booking.service_name}</h3>
                      <p className="text-sm text-slate-500">Met: {booking.staff_name}</p>
                      {booking.notes && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                          📝 {booking.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(booking.service_price)}</p>
                      <Link
                        href={`/admin/bookingen?id=${booking.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {customer.bookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">Geen afspraken gevonden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
