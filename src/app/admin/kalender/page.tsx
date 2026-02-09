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

type CalendarView = 'day' | 'week' | 'month'

interface Staff {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  duration: string
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<CalendarView>('month')
  
  // Drag and drop state
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Quick add modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [newBooking, setNewBooking] = useState({
    customer_name: '',
    customer_phone: '',
    service_id: '',
    staff_id: '',
    booking_date: '',
    booking_time: '09:00',
    notes: '',
  })

  useEffect(() => {
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchBookings = async () => {
    setLoading(true)
    
    let firstDay: string
    let lastDay: string
    
    if (view === 'day') {
      // Single day view
      firstDay = currentDate.toISOString().split('T')[0]
      lastDay = firstDay
    } else if (view === 'week') {
      // Week view (Monday to Sunday)
      const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
      const monday = new Date(currentDate)
      monday.setDate(currentDate.getDate() - dayOfWeek)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      firstDay = monday.toISOString().split('T')[0]
      lastDay = sunday.toISOString().split('T')[0]
    } else {
      // Month view
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      firstDay = new Date(year, month, 1).toISOString().split('T')[0]
      lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]
    }
    
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

  const fetchStaffAndServices = async () => {
    const [{ data: staffData }, { data: servicesData }] = await Promise.all([
      supabase.from('staff').select('id, name').eq('is_active', true),
      supabase.from('services').select('id, name, duration').eq('is_active', true)
    ])
    setStaff(staffData || [])
    setServices(servicesData || [])
  }

  const openQuickAdd = () => {
    fetchStaffAndServices()
    setNewBooking({
      customer_name: '',
      customer_phone: '',
      service_id: '',
      staff_id: '',
      booking_date: currentDate.toISOString().split('T')[0],
      booking_time: '09:00',
      notes: '',
    })
    setShowQuickAdd(true)
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const service = services.find(s => s.id === newBooking.service_id)
    const staffMember = staff.find(s => s.id === newBooking.staff_id)
    
    const { error } = await supabase.from('bookings').insert([{
      ...newBooking,
      service_name: service?.name || 'Onbekend',
      service_duration: service?.duration || '',
      staff_name: staffMember?.name || 'Geen voorkeur',
      status: 'confirmed',
    }])
    
    if (error) {
      console.error('Error creating booking:', error)
    } else {
      setShowQuickAdd(false)
      fetchBookings()
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    setDraggedBooking(booking)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', booking.id)
  }

  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(timeSlot)
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = async (e: React.DragEvent, newTime: string) => {
    e.preventDefault()
    setDropTarget(null)
    
    if (!draggedBooking) return
    
    // Only allow drops within the same day for simplicity
    const newBookingTime = newTime
    
    setSaving(true)
    
    const { error } = await supabase
      .from('bookings')
      .update({ booking_time: newBookingTime })
      .eq('id', draggedBooking.id)
    
    if (error) {
      console.error('Error updating booking time:', error)
      alert('Fout bij verplaatsen van afspraak')
    } else {
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === draggedBooking.id 
          ? { ...b, booking_time: newBookingTime }
          : b
      ))
    }
    
    setDraggedBooking(null)
    setSaving(false)
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
  const dayNamesFull = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500',
    pending: 'bg-amber-500',
    cancelled: 'bg-red-500',
  }

  const statusColorsLight: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  // Helper functions for different views
  const getWeekDays = () => {
    const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1
    const monday = new Date(currentDate)
    monday.setDate(currentDate.getDate() - dayOfWeek)
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + i)
      return day
    })
  }

  const getHours = () => {
    return Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 - 20:00
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() - 1)
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setMonth(currentDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    setSelectedDate(null)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'day') {
      newDate.setDate(currentDate.getDate() + 1)
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    setSelectedDate(null)
  }
  
  const prevMonth = navigatePrev
  const nextMonth = navigateNext

  const getHeaderTitle = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    } else if (view === 'week') {
      const weekDays = getWeekDays()
      const start = weekDays[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
      const end = weekDays[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
      return `${start} - ${end}`
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Kalender</h1>
          <p className="text-slate-600 text-sm md:text-base">
            Bekijk en beheer afspraken
            {draggedBooking && (
              <span className="ml-2 text-blue-600 font-medium animate-pulse">
                → Sleep afspraak naar nieuw tijdstip
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === v 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v === 'day' ? 'Dag' : v === 'week' ? 'Week' : 'Maand'}
              </button>
            ))}
          </div>
          <button 
            onClick={openQuickAdd}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            + Snel toevoegen
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text="Afspraken laden..." />}
      {saving && <LoadingSpinner text="Afspraak verplaatsen..." />}

      {/* Mobile: Day List View */}
      <div className="md:hidden mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {/* Mobile Calendar Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <button onClick={navigatePrev} className="p-2 hover:bg-slate-100 rounded-lg">
              ←
            </button>
            <h2 className="text-lg font-semibold text-slate-900 text-center">
              {getHeaderTitle()}
            </h2>
            <button onClick={navigateNext} className="p-2 hover:bg-slate-100 rounded-lg">
              →
            </button>
          </div>

          {/* Mobile: Scrollable day list */}
          <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayBookings = getBookingsForDate(day)
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isToday = new Date().toDateString() === date.toDateString()
              const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1

              return (
                <div 
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 cursor-pointer hover:bg-slate-50 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                        isToday ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {day}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{dayNamesFull[dayOfWeek]}</p>
                        <p className="text-xs text-slate-500">
                          {dayBookings.length > 0 ? `${dayBookings.length} afspraak${dayBookings.length > 1 ? 'en' : ''}` : 'Geen afspraken'}
                        </p>
                      </div>
                    </div>
                    {dayBookings.length > 0 && (
                      <div className="flex gap-1">
                        {dayBookings.slice(0, 3).map((b, idx) => (
                          <div key={idx} className={`w-2 h-2 rounded-full ${statusColors[b.status]}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Desktop Views */}
      <div className="hidden md:block">
        {/* Calendar Header */}
        <div className="bg-white rounded-t-xl shadow-sm border border-slate-200 border-b-0 p-4 flex items-center justify-between">
          <button onClick={navigatePrev} className="p-2 hover:bg-slate-100 rounded-lg">
            ←
          </button>
          <h2 className="text-xl font-semibold text-slate-900">
            {getHeaderTitle()}
          </h2>
          <button onClick={navigateNext} className="p-2 hover:bg-slate-100 rounded-lg">
            →
          </button>
        </div>

        {/* DAY VIEW with Drag & Drop */}
        {view === 'day' && (
          <div className="bg-white shadow-sm border border-slate-200 rounded-b-xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {currentDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <span className="text-sm text-slate-500">
                💡 Sleep afspraken naar een ander tijdstip
              </span>
            </div>
            <div className="divide-y divide-slate-200">
              {getHours().map((hour) => {
                const hourStr = formatHour(hour)
                const hourBookings = bookings.filter(b => {
                  const bookingHour = parseInt(b.booking_time.split(':')[0])
                  return bookingHour === hour
                })
                const isDropTarget = dropTarget === hourStr
                
                return (
                  <div key={hour} className="flex">
                    <div className="w-20 p-3 text-sm text-slate-500 border-r border-slate-200 bg-slate-50">
                      {hourStr}
                    </div>
                    <div 
                      className={`flex-1 p-2 min-h-[60px] transition-colors ${
                        isDropTarget ? 'bg-blue-100 border-2 border-blue-400 border-dashed' : ''
                      }`}
                      onDragOver={(e) => handleDragOver(e, hourStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, hourStr)}
                    >
                      {hourBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, booking)}
                          className={`mb-1 p-2 rounded text-sm text-white cursor-move hover:opacity-90 transition-opacity ${statusColors[booking.status]} ${
                            draggedBooking?.id === booking.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">⋮⋮</span>
                            <span className="font-medium">{booking.booking_time}</span> - {booking.customer_name}
                          </div>
                          <span className="text-xs opacity-90 ml-5">{booking.service_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {view === 'week' && (
          <div className="bg-white shadow-sm border border-slate-200 rounded-b-xl overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Week header */}
              <div className="grid grid-cols-8 border-b border-slate-200">
                <div className="p-3 border-r border-slate-200 bg-slate-50"></div>
                {getWeekDays().map((day, i) => {
                  const isToday = new Date().toDateString() === day.toDateString()
                  return (
                    <div 
                      key={i} 
                      className={`p-3 text-center ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-xs text-slate-500">{dayNames[i]}</p>
                      <p className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Week grid */}
              <div>
                {getHours().map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-slate-200">
                    <div className="p-2 text-sm text-slate-500 border-r border-slate-200 bg-slate-50">
                      {formatHour(hour)}
                    </div>
                    {getWeekDays().map((day, dayIndex) => {
                      const dayStr = day.toISOString().split('T')[0]
                      const hourBookings = bookings.filter(b => {
                        const bookingHour = parseInt(b.booking_time.split(':')[0])
                        return b.booking_date === dayStr && bookingHour === hour
                      })
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className="p-1 min-h-[50px] border-r border-slate-100"
                        >
                          {hourBookings.map((booking) => (
                            <div 
                              key={booking.id}
                              className={`mb-1 p-1 rounded text-xs text-white truncate ${statusColors[booking.status]}`}
                              title={`${booking.booking_time} - ${booking.customer_name}`}
                            >
                              {booking.booking_time} {booking.customer_name}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MONTH VIEW */}
        {view === 'month' && (
          <div className="bg-white shadow-sm border border-slate-200 rounded-b-xl">
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
        )}
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="mt-6 md:mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Afspraken op {selectedDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          
          {getBookingsForDate(selectedDate.getDate()).length === 0 ? (
            <p className="text-slate-500">Geen afspraken voor deze dag</p>
          ) : (
            <div className="space-y-3">
              {getBookingsForDate(selectedDate.getDate()).map((booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-lg gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[booking.status]}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{booking.booking_time} - {booking.customer_name}</p>
                      <p className="text-sm text-slate-500">{booking.service_name} • {booking.staff_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColorsLight[booking.status]}`}>
                      {booking.status === 'confirmed' ? 'Bevestigd' : booking.status === 'pending' ? 'In afwachting' : 'Geannuleerd'}
                    </span>
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

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Afspraak toevoegen</h2>
                <button 
                  onClick={() => setShowQuickAdd(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Klantnaam *</label>
                  <input
                    type="text"
                    required
                    value={newBooking.customer_name}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Naam van klant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefoon *</label>
                  <input
                    type="tel"
                    required
                    value={newBooking.customer_phone}
                    onChange={(e) => setNewBooking({ ...newBooking, customer_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="06-12345678"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Datum *</label>
                    <input
                      type="date"
                      required
                      value={newBooking.booking_date}
                      onChange={(e) => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tijd *</label>
                    <input
                      type="time"
                      required
                      value={newBooking.booking_time}
                      onChange={(e) => setNewBooking({ ...newBooking, booking_time: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Behandeling *</label>
                  <select
                    required
                    value={newBooking.service_id}
                    onChange={(e) => setNewBooking({ ...newBooking, service_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Kies behandeling</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medewerker</label>
                  <select
                    value={newBooking.staff_id}
                    onChange={(e) => setNewBooking({ ...newBooking, staff_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Geen voorkeur</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notities</label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Eventuele bijzonderheden..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    Toevoegen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
