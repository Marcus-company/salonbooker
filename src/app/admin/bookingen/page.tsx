"use client";

import { useState } from "react";

// Mock data - later vervangen met Supabase data
const bookings = [
  { id: 1, name: "Anna de Vries", phone: "06-12345678", service: "Knippen dames", date: "2026-02-04", time: "10:00", status: "confirmed", notes: "" },
  { id: 2, name: "Mark Janssen", phone: "06-87654321", service: "Knippen heren", date: "2026-02-04", time: "11:30", status: "pending", notes: "Liever niet te kort" },
  { id: 3, name: "Lisa Bakker", phone: "06-23456789", service: "Balayage", date: "2026-02-05", time: "14:00", status: "confirmed", notes: "" },
  { id: 4, name: "Sophie Jansen", phone: "06-34567890", service: "Curl defining", date: "2026-02-05", time: "16:00", status: "cancelled", notes: "Afgebeld" },
  { id: 5, name: "Emma van Dijk", phone: "06-45678901", service: "Extensions", date: "2026-02-06", time: "09:30", status: "confirmed", notes: "Consultatie eerst" },
];

export default function BookingenPage() {
  const [filter, setFilter] = useState("all");
  
  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filter);
  
  const statusColors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
  };
  
  const statusLabels: Record<string, string> = {
    confirmed: "Bevestigd",
    pending: "In afwachting",
    cancelled: "Geannuleerd",
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Boekingen</h1>
          <p className="text-slate-600">Beheer alle afspraken</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          + Nieuwe boeking
        </button>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {["all", "confirmed", "pending", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f 
                ? "bg-slate-900 text-white" 
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {f === "all" ? "Alle" : statusLabels[f]}
          </button>
        ))}
      </div>
      
      {/* Bookings table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Klant</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Service</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Datum & Tijd</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{booking.name}</p>
                  <p className="text-sm text-slate-500">{booking.phone}</p>
                </td>
                <td className="px-6 py-4 text-slate-700">{booking.service}</td>
                <td className="px-6 py-4">
                  <p className="text-slate-900">
                    {new Date(booking.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-slate-500">{booking.time}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                    {statusLabels[booking.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {booking.status !== "confirmed" && (
                      <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                        Bevestig
                      </button>
                    )}
                    {booking.status !== "cancelled" && (
                      <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        Annuleer
                      </button>
                    )}
                    <button className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                      Bewerk
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Geen boekingen gevonden</p>
        </div>
      )}
    </div>
  );
}
