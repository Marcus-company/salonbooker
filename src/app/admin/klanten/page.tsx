'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  total_bookings: number
  last_visit: string | null
  notes?: string
}

export default function KlantenPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    
    // Get unique customers from bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, customer_phone, booking_date, notes')
      .order('booking_date', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      // Group by customer (using email or phone as identifier)
      const customerMap = new Map<string, Customer>()
      
      bookings?.forEach((booking: any) => {
        const key = booking.customer_email || booking.customer_phone
        if (!key) return
        
        if (customerMap.has(key)) {
          const existing = customerMap.get(key)!
          existing.total_bookings += 1
          // Update last visit if this booking is more recent
          if (booking.booking_date > (existing.last_visit || '')) {
            existing.last_visit = booking.booking_date
          }
        } else {
          customerMap.set(key, {
            id: booking.id,
            name: booking.customer_name,
            email: booking.customer_email || '',
            phone: booking.customer_phone || '',
            total_bookings: 1,
            last_visit: booking.booking_date,
            notes: booking.notes || '',
          })
        }
      })
      
      setCustomers(Array.from(customerMap.values()))
    }

    setLoading(false)
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  const formatDate = (date: string | null) => {
    if (!date) return 'Nooit'
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Klanten</h1>
          <p className="text-slate-600 text-sm md:text-base">
            {customers.length} klanten in je database
          </p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          + Nieuwe klant
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Zoek op naam, email of telefoon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
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
                    <p className="font-medium text-slate-900">{customer.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.email && (
                    <p className="text-sm text-slate-600">{customer.email}</p>
                  )}
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.total_bookings > 5 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {customer.total_bookings} afspra{customer.total_bookings === 1 ? 'ak' : 'ken'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {formatDate(customer.last_visit)}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedCustomer(customer)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map((customer) => (
          <div 
            key={customer.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            onClick={() => setSelectedCustomer(customer)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <p className="font-medium text-slate-900">{customer.name}</p>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                customer.total_bookings > 5 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {customer.total_bookings}
              </span>
            </div>
            <div className="text-sm text-slate-600">
              Laatste bezoek: {formatDate(customer.last_visit)}
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">
            {searchQuery ? 'Geen klanten gevonden voor deze zoekterm' : 'Nog geen klanten in je database'}
          </p>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Klant Details</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-slate-500">{selectedCustomer.email}</p>
                  <p className="text-slate-500">{selectedCustomer.phone}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{selectedCustomer.total_bookings}</p>
                  <p className="text-sm text-slate-500">Totale afspraken</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <p className="text-lg font-bold text-slate-900">{formatDate(selectedCustomer.last_visit)}</p>
                  <p className="text-sm text-slate-500">Laatste bezoek</p>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Notities</h4>
                  <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <Link
                href={`/admin/bookingen?customer=${encodeURIComponent(selectedCustomer.email || selectedCustomer.phone)}`}
                className="flex-1 px-4 py-2 bg-slate-900 text-white text-center rounded-lg hover:bg-slate-800 transition-colors"
              >
                Bekijk afspraken
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
