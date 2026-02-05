'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  service_name: string
  staff_name: string
  booking_date: string
  booking_time: string
  status: 'confirmed' | 'pending' | 'cancelled'
  notes?: string
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchBookings = async () => {
    setLoading(true)
    
    // Get first and last day of current month
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', firstDay)
      .lte('booking_date', lastDay)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0
    
    return { daysInMonth, startingDay }
  }

  const getBookingsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return bookings.filter(b => b.booking_date === dateStr)
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)
  const monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500',
    pending: 'bg-amber-500',
    cancelled: 'bg-red-500',
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kalender</h1>
          <p className="text-slate-600">Bekijk en beheer afspraken per dag</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          + Nieuwe afspraak
        </button>
      </div>

      {loading && <LoadingSpinner text="Afspraken laden..." />}

      {/* Calendar Header */}
      <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 border-b-0 p-4 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg">
          ←
        </button>
        <h2 className="text-xl font-semibold text-slate-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white shadow-sm border border-slate-200">
        {/* Day names */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-slate-200 bg-slate-50" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayBookings = getBookingsForDate(day)
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
            
            return (
              <div 
                key={day}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`min-h-[120px] border-b border-r border-slate-200 p-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                  isToday ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                  {day}
                </div>
                
                {dayBookings.length > 0 && (
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking, idx) => (
                      <div 
                        key={idx}
                        className={`text-xs px-2 py-1 rounded text-white truncate ${statusColors[booking.status]}`}
                        title={`${booking.booking_time} - ${booking.customer_name}`}
                      >
                        {booking.booking_time} {booking.customer_name}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-slate-500 px-2">
                        +{dayBookings.length - 3} meer
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Afspraken op {selectedDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          
          {getBookingsForDate(selectedDate.getDate()).length === 0 ? (
            <p className="text-slate-500">Geen afspraken voor deze dag</p>
          ) : (
            <div className="space-y-3">
              {getBookingsForDate(selectedDate.getDate()).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${statusColors[booking.status]}`} />
                    <div>
                      <p className="font-medium text-slate-900">{booking.booking_time} - {booking.customer_name}</p>
                      <p className="text-sm text-slate-500">{booking.service_name} • {booking.staff_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-100">
                      Bewerk
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
