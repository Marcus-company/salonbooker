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

interface CustomerNote {
  id: string
  note: string
  category: string
  created_at: string
  staff: { name: string }
}

interface CustomerFavorite {
  id: string
  type: 'service' | 'product'
  notes?: string
  service?: { id: string; name: string; duration: string; price: number }
  product?: { id: string; name: string; selling_price: number }
}

interface CustomerHistory {
  bookings: Booking[]
  stats: {
    total_bookings: number
    confirmed_bookings: number
    cancelled_bookings: number
    total_spent: number
    first_visit: string | null
    last_visit: string | null
  }
  favorite_services: { name: string; count: number }[]
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
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([])
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'favorites' | 'history'>('overview')
  
  // New note form
  const [newNote, setNewNote] = useState('')
  const [noteCategory, setNoteCategory] = useState('general')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (email || phone) {
      fetchCustomerDetail()
    }
  }, [email, phone])

  useEffect(() => {
    if (customerId) {
      fetchNotes()
      fetchFavorites()
      fetchHistory()
    }
  }, [customerId])

  const fetchCustomerDetail = async () => {
    setLoading(true)
    
    // Get or create customer record
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
      const firstBooking = bookings[bookings.length - 1]
      const lastBooking = bookings[0]
      
      const totalSpent = bookings
        .filter((b: any) => b.status === 'confirmed')
        .reduce((sum: number, b: any) => sum + (b.service_price || 0), 0)
      
      // Try to get customer ID from customers table
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('email', firstBooking.customer_email)
        .single()
      
      if (customerData?.id) {
        setCustomerId(customerData.id)
      }
      
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
    }

    setLoading(false)
  }

  const fetchNotes = async () => {
    if (!customerId) return
    
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*, staff(name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotes(data)
    }
  }

  const fetchFavorites = async () => {
    if (!customerId) return
    
    const { data, error } = await supabase
      .from('customer_favorites')
      .select(`
        *,
        service:service_id(id, name, duration, price),
        product:product_id(id, name, selling_price)
      `)
      .eq('customer_id', customerId)

    if (!error && data) {
      setFavorites(data)
    }
  }

  const fetchHistory = async () => {
    if (!customerId) return
    
    const response = await fetch(`/api/customers/${customerId}/history`)
    if (response.ok) {
      const data = await response.json()
      setHistory(data)
    }
  }

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !newNote.trim()) return

    setSavingNote(true)
    
    const response = await fetch(`/api/customers/${customerId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: newNote,
        category: noteCategory,
      }),
    })

    if (response.ok) {
      setNewNote('')
      fetchNotes()
    }
    
    setSavingNote(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Algemeen',
      preference: 'Voorkeur',
      allergy: 'Allergie',
      medical: 'Medisch',
      complaint: 'Klacht',
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-slate-100 text-slate-700',
      preference: 'bg-blue-100 text-blue-700',
      allergy: 'bg-red-100 text-red-700',
      medical: 'bg-purple-100 text-purple-700',
      complaint: 'bg-amber-100 text-amber-700',
    }
    return colors[category] || 'bg-slate-100 text-slate-700'
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
          <p className="text-2xl font-bold text-slate-900">{history?.stats.total_bookings || customer.total_bookings}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Totaal uitgegeven</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(history?.stats.total_spent || customer.total_spent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Eerste bezoek</p>
          <p className="text-lg font-semibold text-slate-900">{customer.first_visit ? formatDate(customer.first_visit) : '-'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Laatste bezoek</p>
          <p className="text-lg font-semibold text-slate-900">{customer.last_visit ? formatDate(customer.last_visit) : '-'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overzicht', count: null },
          { id: 'notes', label: 'Notities', count: notes.length },
          { id: 'favorites', label: 'Favorieten', count: favorites.length },
          { id: 'history', label: 'Geschiedenis', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-1 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recente afspraken</h2>
            <div className="space-y-3">
              {customer.bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{booking.service_name}</p>
                    <p className="text-sm text-slate-500">{formatDate(booking.booking_date)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>
              ))}
              {customer.bookings.length === 0 && (
                <p className="text-slate-500 text-center py-4">Geen afspraken</p>
              )}
            </div>
            {customer.bookings.length > 5 && (
              <button
                onClick={() => setActiveTab('history')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Bekijk alle {customer.bookings.length} afspraken →
              </button>
            )}
          </div>

          {/* Favorite Services */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Favoriete behandelingen</h2>
            {history?.favorite_services && history.favorite_services.length > 0 ? (
              <div className="space-y-3">
                {history.favorite_services.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'}
                      </span>
                      <span className="text-slate-700">{service.name}</span>
                    </div>
                    <span className="text-sm text-slate-500">{service.count}x geboekt</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Nog geen favorieten</p>
            )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Note */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Nieuwe notitie</h2>
            <form onSubmit={addNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">Algemeen</option>
                  <option value="preference">Voorkeur</option>
                  <option value="allergy">Allergie</option>
                  <option value="medical">Medisch</option>
                  <option value="complaint">Klacht</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notitie</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Schrijf een notitie over deze klant..."
                />
              </div>
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingNote ? 'Opslaan...' : 'Notitie toevoegen'}
              </button>
            </form>
          </div>

          {/* Notes List */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notities ({notes.length})</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(note.category)}`}>
                      {getCategoryLabel(note.category)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(note.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{note.note}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Door: {note.staff?.name || 'Onbekend'}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-slate-500 text-center py-8">Nog geen notities</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Favorieten</h2>
          {favorites.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {favorites.map((fav) => (
                <div key={fav.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{fav.type === 'service' ? '💇' : '📦'}</span>
                    <span className="text-xs text-slate-500 uppercase">{fav.type}</span>
                  </div>
                  <p className="font-medium text-slate-900">
                    {fav.type === 'service' ? fav.service?.name : fav.product?.name}
                  </p>
                  {fav.type === 'service' && fav.service && (
                    <p className="text-sm text-slate-500">
                      {fav.service.duration} • {formatCurrency(fav.service.price || 0)}
                    </p>
                  )}
                  {fav.type === 'product' && fav.product && (
                    <p className="text-sm text-slate-500">
                      {formatCurrency(fav.product.selling_price)}
                    </p>
                  )}
                  {fav.notes && (
                    <p className="text-sm text-slate-600 mt-2">{fav.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">Nog geen favorieten toegevoegd</p>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Complete geschiedenis</h2>
            <div className="flex gap-4 mt-4 text-sm">
              <span className="text-green-600">
                ✅ {history?.stats.confirmed_bookings || 0} bevestigd
              </span>
              <span className="text-red-600">
                ❌ {history?.stats.cancelled_bookings || 0} geannuleerd
              </span>
            </div>
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
        </div>
      )}
    </div>
  )
}
