'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';
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
} from 'recharts';

type Period = 'today' | 'week' | 'month' | 'year';

interface Booking {
  id: string;
  service_name: string;
  service_price: number;
  booking_date: string;
  booking_time: string;
  status: string;
  customer_phone: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    avgBookingValue: 0,
    returningCustomers: 0,
    newCustomers: 0,
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    
    const { startDate, endDate } = getDateRange(period);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
      calculateStats(data || []);
    }
    
    setLoading(false);
  };

  const getDateRange = (p: Period) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    switch (p) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const calculateStats = (data: Booking[]) => {
    const confirmed = data.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.service_price || 0), 0);
    
    // Unique customers
    const customerPhones = data.map(b => b.customer_phone);
    const uniqueCustomers = Array.from(new Set(customerPhones));
    
    // Count returning customers (appear more than once in all bookings)
    const phoneCounts = customerPhones.reduce((acc, phone) => {
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const returningCustomers = Object.values(phoneCounts).filter(count => count > 1).length;
    
    setStats({
      totalRevenue,
      totalBookings: data.length,
      avgBookingValue: confirmed.length > 0 ? totalRevenue / confirmed.length : 0,
      returningCustomers,
      newCustomers: uniqueCustomers.length - returningCustomers,
    });
  };

  // Prepare chart data
  const getRevenueByDay = () => {
    const byDay: Record<string, number> = {};
    
    bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .forEach(b => {
        byDay[b.booking_date] = (byDay[b.booking_date] || 0) + (b.service_price || 0);
      });
    
    return Object.entries(byDay).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
      revenue,
    }));
  };

  const getBookingsByDay = () => {
    const byDay: Record<string, number> = {};
    
    bookings.forEach(b => {
      byDay[b.booking_date] = (byDay[b.booking_date] || 0) + 1;
    });
    
    return Object.entries(byDay).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
      bookings: count,
    }));
  };

  const getServiceDistribution = () => {
    const byService: Record<string, number> = {};
    
    bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .forEach(b => {
        byService[b.service_name] = (byService[b.service_name] || 0) + 1;
      });
    
    const colors = ['#0f172a', '#334155', '#d4a574', '#e8c9a8', '#94a3b8', '#64748b'];
    
    return Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
  };

  const exportCSV = () => {
    const headers = ['Datum', 'Tijd', 'Klant', 'Service', 'Prijs', 'Status'];
    const rows = bookings.map(b => [
      b.booking_date,
      b.booking_time,
      b.customer_phone,
      b.service_name,
      b.service_price?.toString() || '0',
      b.status,
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Rapporten laden..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Rapporten</h1>
          <p className="text-slate-600 text-sm md:text-base">Inzichten in je salon prestaties</p>
        </div>
        
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Period filter */}
      <div className="mb-6 flex gap-2 bg-white rounded-lg p-1 border border-slate-200 overflow-x-auto">
        {[
          { key: 'today', label: 'Vandaag' },
          { key: 'week', label: 'Deze week' },
          { key: 'month', label: 'Deze maand' },
          { key: 'year', label: 'Dit jaar' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key as Period)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              period === p.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
        <KpiCard
          label="Totale omzet"
          value={`€${stats.totalRevenue.toFixed(2)}`}
          icon="💰"
        />
        <KpiCard
          label="Aantal boekingen"
          value={stats.totalBookings}
          icon="📅"
        />
        <KpiCard
          label="Gem. boeking"
          value={`€${stats.avgBookingValue.toFixed(2)}`}
          icon="💶"
        />
        <KpiCard
          label="Terugkerend"
          value={stats.returningCustomers}
          icon="👥"
        />
        <KpiCard
          label="Nieuwe klanten"
          value={stats.newCustomers}
          icon="✨"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Revenue per day */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Omzet per dag
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getRevenueByDay()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value) => `€${Number(value).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="revenue" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings per day */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Boekingen per dag
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={getBookingsByDay()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#d4a574"
                strokeWidth={3}
                dot={{ fill: '#d4a574', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Service distribution */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-3 md:mb-4">
            Populaire behandelingen
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getServiceDistribution()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {getServiceDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {getServiceDistribution().map((item) => (
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
        </div>

        {/* Summary stats */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-4">
            Samenvatting
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Totaal afspraken</span>
              <span className="font-semibold text-slate-900">{stats.totalBookings}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Bevestigde afspraken</span>
              <span className="font-semibold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Geannuleerd</span>
              <span className="font-semibold text-red-600">
                {bookings.filter(b => b.status === 'cancelled').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-600">Terugkerende klanten</span>
              <span className="font-semibold text-blue-600">
                {stats.returningCustomers} ({stats.totalBookings > 0 ? Math.round((stats.returningCustomers / (stats.returningCustomers + stats.newCustomers)) * 100) : 0}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-600">Nieuwe klanten</span>
              <span className="font-semibold text-amber-600">
                {stats.newCustomers}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <span className="text-slate-500 text-xs md:text-sm">{label}</span>
        <span className="text-lg md:text-2xl">{icon}</span>
      </div>
      <p className="text-lg md:text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
