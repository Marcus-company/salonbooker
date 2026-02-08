'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  total_bookings: number
  last_visit?: string
  notes?: string
  created_at: string
}

export default function KlantenPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'last_visit' | 'bookings'>('name')

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, searchQuery, sortBy])

  const fetchCustomers = async () => {
    setLoading(true)
    
    try {
      // Get unique customers from bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('customer_name, customer_phone, customer_email, booking_date, created_at')
        .order('booking_date', { ascending: false })

      if (error) throw error

      // Group by phone number (unique identifier)
      const customerMap = new Map<string, Customer>()
      
      bookings?.forEach((booking: any) => {
        const phone = booking.customer_phone
        
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            id: phone,
            name: booking.customer_name,
            phone: phone,
            email: booking.customer_email,
            total_bookings: 1,
            last_visit: booking.booking_date,
            created_at: booking.created_at,
          })
        } else {
          const existing = customerMap.get(phone)!
          existing.total_bookings++
          if (booking.booking_date > (existing.last_visit || '')) {
            existing.last_visit = booking.booking_date
          }
        }
      })

      setCustomers(Array.from(customerMap.values()))
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCustomers = () => {
    let filtered = [...customers]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        (c.email?.toLowerCase().includes(query) ?? false)
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'last_visit':
          return (b.last_visit || '').localeCompare(a.last_visit || '')
        case 'bookings':
          return b.total_bookings - a.total_bookings
        default:
          return 0
      }
    })

    setFilteredCustomers(filtered)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Nooit'
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Klanten laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Klanten</h1>
          <p className="text-slate-600 text-sm md:text-base">
            {customers.length} klanten in totaal
          </p>
        </div>
        <Link 
          href="/admin/bookingen/nieuw"
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-center"
        >
          + Nieuwe afspraak
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Zoek op naam, telefoon of email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        >
          <option value="name">Sorteer: Naam</option>
          <option value="last_visit">Sorteer: Laatste bezoek</option>
          <option value="bookings">Sorteer: Aantal afspraken</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Klant</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Contact</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Afspraken</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Laatste bezoek</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
                      👤
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      {customer.email && (
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">{customer.phone}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                    {customer.total_bookings}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-700">{formatDate(customer.last_visit)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/klanten/detail?email=${encodeURIComponent(customer.email)}&phone=${encodeURIComponent(customer.phone)}`}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                    >
                      Details →
                    </Link>
                    <Link
                      href={`tel:${customer.phone}`}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Bellen
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl flex-shrink-0">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{customer.name}</p>
                <p className="text-sm text-slate-500">{customer.phone}</p>
                {customer.email && (
                  <p className="text-sm text-slate-500 truncate">{customer.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-500">Afspraken</p>
                <p className="font-semibold text-slate-900">{customer.total_bookings}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-500">Laatste bezoek</p>
                <p className="font-semibold text-slate-900">{formatDate(customer.last_visit)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/admin/klanten/detail?email=${encodeURIComponent(customer.email)}&phone=${encodeURIComponent(customer.phone)}`}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center font-medium"
              >
                Details →
              </Link>
              <Link
                href={`tel:${customer.phone}`}
                className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-center"
              >
                Bellen
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">Geen klanten gevonden</p>
          {searchQuery && (
            <p className="text-sm text-slate-400 mt-1">Pas je zoekopdracht aan</p>
          )}
        </div>
      )}
    </div>
  )
}
