import Link from "next/link";

// Mock data - later vervangen met Supabase data
const stats = [
  { label: "Vandaag", value: 3, icon: "📅" },
  { label: "Deze week", value: 12, icon: "📊" },
  { label: "Openstaand", value: 8, icon: "⏳" },
  { label: "Totaal klanten", value: 45, icon: "👥" },
];

const recentBookings = [
  { id: 1, name: "Anna de Vries", service: "Knippen dames", date: "2026-02-04", time: "10:00", status: "confirmed" },
  { id: 2, name: "Mark Janssen", service: "Knippen heren", date: "2026-02-04", time: "11:30", status: "pending" },
  { id: 3, name: "Lisa Bakker", service: "Balayage", date: "2026-02-05", time: "14:00", status: "confirmed" },
];

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welkom terug, Josje!</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recente Boekingen</h2>
          <Link href="/admin/bookingen" className="text-slate-600 hover:text-slate-900 font-medium">
            Bekijk alle →
          </Link>
        </div>
        
        <div className="divide-y divide-slate-200">
          {recentBookings.map((booking) => (
            <div key={booking.id} className="p-6 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                  👤
                </div>
                <div>
                  <p className="font-medium text-slate-900">{booking.name}</p>
                  <p className="text-sm text-slate-500">{booking.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-900">
                  {new Date(booking.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-sm text-slate-500">{booking.time}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {booking.status === 'confirmed' ? 'Bevestigd' : 'In afwachting'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Snelle acties</h3>
          <div className="space-y-2">
            <Link href="/admin/bookingen" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              📅 Nieuwe boeking toevoegen
            </Link>
            <Link href="/admin/instellingen" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              ⚙️ Openingstijden aanpassen
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Vandaag open</h3>
          <p className="text-2xl font-bold text-slate-900">09:00 - 17:30</p>
          <p className="text-slate-500">Dinsdag 4 februari 2026</p>
        </div>
      </div>
    </div>
  );
}
