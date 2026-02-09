'use client'

import { useState, useEffect } from 'react'
import Link from "next/link";
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import { SkeletonStats, SkeletonBookingCard, Skeleton } from '@/components/skeleton'

interface Booking {
  id: string
  customer_name: string
  service_name: string
  booking_date: string
  booking_time: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface Stats {
  today: number
  thisWeek: number
  pending: number
  totalCustomers: number
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<Stats>({ today: 0, thisWeek: 0, pending: 0, totalCustomers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // Fetch recent bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, customer_name, service_name, booking_date, booking_time, status')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .limit(5)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    } else {
      setBookings(bookingsData || [])
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    // Today's bookings count
    const { count: todayCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('booking_date', today)
      .eq('status', 'confirmed')

    // This week's bookings count
    const { count: weekCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('booking_date', today)
      .lte('booking_date', weekFromNow.toISOString().split('T')[0])
      .eq('status', 'confirmed')

    // Pending bookings count
    const { count: pendingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Total unique customers
    const { count: customersCount } = await supabase
      .from('bookings')
      .select('customer_email', { count: 'exact', head: true })

    setStats({
      today: todayCount || 0,
      thisWeek: weekCount || 0,
      pending: pendingCount || 0,
      totalCustomers: customersCount || 0
    })

    setLoading(false)
  }

  const statsConfig = [
    { label: "Vandaag", value: stats.today, icon: "📅" },
    { label: "Deze week", value: stats.thisWeek, icon: "📊" },
    { label: "Openstaand", value: stats.pending, icon: "⏳" },
    { label: "Totaal klanten", value: stats.totalCustomers, icon: "👥" },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <SkeletonStats count={4} />
        <div className="mt-6 md:mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 md:p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBookingCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 text-sm md:text-base">Welkom terug, Josje!</p>
      </div>
      
      {/* Stats - 2 cols mobile, 4 cols desktop - FORCE REDEPLOY */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {statsConfig.map((stat) => (
          <div key={stat.label} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-slate-500">{stat.label}</p>
                <p className="text-xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <span className="text-2xl md:text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">Recente Boekingen</h2>
          <Link href="/admin/bookingen" className="text-sm md:text-base text-slate-600 hover:text-slate-900 font-medium">
            Bekijk alle →
          </Link>
        </div>
        
        <div className="divide-y divide-slate-200">
          {bookings.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Geen boekingen gevonden
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 gap-3 md:gap-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 flex items-center justify-center text-base md:text-lg flex-shrink-0">
                    👤
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{booking.customer_name}</p>
                    <p className="text-sm text-slate-500">{booking.service_name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:text-right md:mx-4">
                  <div className="md:hidden text-sm text-slate-500">
                    {new Date(booking.booking_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    {' '}{booking.booking_time}
                  </div>
                  <div className="hidden md:block">
                    <p className="font-medium text-slate-900">
                      {new Date(booking.booking_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-sm text-slate-500">{booking.booking_time}</p>
                  </div>
                </div>
                <span className={`self-start md:self-auto px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                  booking.status === 'confirmed' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {booking.status === 'confirmed' ? 'Bevestigd' : 'In afwachting'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Quick actions - stack on mobile */}
      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2 md:mb-3">Snelle acties</h3>
          <div className="space-y-2">
            <Link href="/admin/bookingen" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm md:text-base">
              📅 Nieuwe boeking toevoegen
            </Link>
            <Link href="/admin/instellingen" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-sm md:text-base">
              ⚙️ Openingstijden aanpassen
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2 md:mb-3">Vandaag open</h3>
          <p className="text-xl md:text-2xl font-bold text-slate-900">09:00 - 17:30</p>
          <p className="text-sm md:text-base text-slate-500">
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
