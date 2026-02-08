'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type Period = 'day' | 'week' | 'month' | 'year'

interface Booking {
  id: string
  booking_date: string
  service_price: number
  service_name: string
  customer_email: string
  customer_phone: string
  status: string
  created_at: string
}

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  avgBookingValue: number
  confirmedBookings: number
  cancelledBookings: number
  pendingBookings: number
  newCustomers: number
  returningCustomers: number
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalBookings: 0,
    avgBookingValue: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    newCustomers: 0,
    returningCustomers: 0,
  })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [serviceData, setServiceData] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    
    // Calculate date range based on period
    const now = new Date()
    let startDate: string
    
    switch (period) {
      case 'day':
        startDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'year':
        const yearAgo = new Date(now)
        yearAgo.setFullYear(now.getFullYear() - 1)
        startDate = yearAgo.toISOString().split('T')[0]
        break
      default:
        startDate = now.toISOString().split('T')[0]
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', startDate)
      .order('booking_date', { ascending: true })

    if (error) {
      console.error('Error fetching analytics:', error)
    } else {
      const bookingsData = data || []
      setBookings(bookingsData)
      calculateAnalytics(bookingsData)
    }

    setLoading(false)
  }

  const calculateAnalytics = (bookings: Booking[]) => {
    // Calculate basic stats
    const confirmed = bookings.filter(b => b.status === 'confirmed')
    const cancelled = bookings.filter(b => b.status === 'cancelled')
    const pending = bookings.filter(b => b.status === 'pending')
    
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.service_price || 0), 0)
    const avgValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0
    
    // Calculate unique customers
    const customerMap = new Map<string, number>()
    bookings.forEach(b => {
      const key = b.customer_email || b.customer_phone
      if (key) {
        customerMap.set(key, (customerMap.get(key) || 0) + 1)
      }
    })
    
    const returningCustomers = Array.from(customerMap.values()).filter(count => count > 1).length
    const newCustomers = customerMap.size - returningCustomers
    
    setAnalytics({
      totalRevenue,
      totalBookings: bookings.length,
      avgBookingValue: Math.round(avgValue * 100) / 100,
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      pendingBookings: pending.length,
      newCustomers,
      returningCustomers,
    })

    // Calculate daily revenue data
    const dailyMap = new Map<string, { revenue: number; bookings: number }>()
    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        const existing = dailyMap.get(b.booking_date) || { revenue: 0, bookings: 0 }
        dailyMap.set(b.booking_date, {
          revenue: existing.revenue + (b.service_price || 0),
          bookings: existing.bookings + 1,
        })
      }
    })
    
    const dailyArray = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
        revenue: data.revenue,
        bookings: data.bookings,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    setDailyData(dailyArray)

    // Calculate service distribution
    const serviceMap = new Map<string, number>()
    confirmed.forEach(b => {
      serviceMap.set(b.service_name, (serviceMap.get(b.service_name) || 0) + 1)
    })
    
    const colors = ['#0f172a', '#334155', '#d4a574', '#e8c9a8', '#94a3b8', '#64748b', '#475569']
    const serviceArray = Array.from(serviceMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
    
    setServiceData(serviceArray)

    // Calculate revenue data by grouping
    const revenueArray = dailyArray.map(d => ({
      date: d.date,
      revenue: d.revenue,
    }))
    
    setRevenueData(revenueArray)
  }

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['Datum', 'Tijd', 'Klant', 'Service', 'Prijs', 'Status']
    const rows = bookings.map(b => [
      b.booking_date,
      b.created_at ? new Date(b.created_at).toLocaleTimeString('nl-NL') : '',
      b.customer_email || b.customer_phone,
      b.service_name,
      b.service_price?.toString() || '0',
      b.status,
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `boekingen-${period}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Analytics laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Rapporten</h1>
          <p className="text-slate-600 text-sm md:text-base">Gedetailleerde inzichten in je salon</p>
        </div>
        
        <div className="flex gap-2">
          {/* Period filter */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p === 'day' ? 'Dag' : p === 'week' ? 'Week' : p === 'month' ? 'Maand' : 'Jaar'}
              </button>
            ))}
          </div>
          
          {/* Export button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <KpiCard
          label="Totale omzet"
          value={formatCurrency(analytics.totalRevenue)}
          icon="💰"
        />
        <KpiCard
          label="Aantal boekingen"
          value={analytics.totalBookings}
          icon="📅"
        />
        <KpiCard
          label="Gem. boeking"
          value={formatCurrency(analytics.avgBookingValue)}
          icon="💶"
        />
        <KpiCard
          label="Bevestigd"
          value={analytics.confirmedBookings}
          icon="✅"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{analytics.confirmedBookings}</p>
          <p className="text-sm text-green-600">Bevestigd</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{analytics.pendingBookings}</p>
          <p className="text-sm text-amber-600">In afwachting</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{analytics.cancelledBookings}</p>
          <p className="text-sm text-red-600">Geannuleerd</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Revenue per day */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Omzet per dag
          </h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `€${value}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ fill: '#0f172a', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Geen data beschikbaar</p>
          )}
        </div>

        {/* Bookings per day */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Boekingen per dag
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="bookings" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-12">Geen data beschikbaar</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Service distribution */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Populaire behandelingen
          </h3>
          {serviceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {serviceData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs md:text-sm text-slate-600 truncate">
                      {item.name} ({item.value}x)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-center py-12">Geen data beschikbaar</p>
          )}
        </div>

        {/* Customer stats */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Klanten statistieken
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600">Nieuwe klanten</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.newCustomers}</p>
              </div>
              <span className="text-3xl">👋</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-purple-600">Terugkerende klanten</p>
                <p className="text-2xl font-bold text-purple-900">{analytics.returningCustomers}</p>
              </div>
              <span className="text-3xl">🔄</span>
            </div>
            
            {analytics.totalBookings > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Terugkeer percentage</span>
                  <span>
                    {Math.round((analytics.returningCustomers / (analytics.newCustomers + analytics.returningCustomers)) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ 
                      width: `${(analytics.returningCustomers / (analytics.newCustomers + analytics.returningCustomers)) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: string
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
