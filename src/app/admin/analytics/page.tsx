"use client";

import { useState } from "react";
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
} from "recharts";

// Mock data - later vervangen met Supabase data
const bookingData = [
  { date: "Ma", bookings: 3, revenue: 125 },
  { date: "Di", bookings: 5, revenue: 210 },
  { date: "Wo", bookings: 4, revenue: 165 },
  { date: "Do", bookings: 6, revenue: 280 },
  { date: "Vr", bookings: 5, revenue: 220 },
  { date: "Za", bookings: 7, revenue: 315 },
  { date: "Zo", bookings: 0, revenue: 0 },
];

const monthlyData = [
  { month: "Jan", bookings: 45, revenue: 2100 },
  { month: "Feb", bookings: 52, revenue: 2450 },
  { month: "Mrt", bookings: 48, revenue: 2280 },
  { month: "Apr", bookings: 55, revenue: 2650 },
  { month: "Mei", bookings: 60, revenue: 2900 },
  { month: "Jun", bookings: 58, revenue: 2820 },
];

const serviceData = [
  { name: "Knippen dames", value: 35, color: "#0f172a" },
  { name: "Knippen heren", value: 25, color: "#334155" },
  { name: "Kleuren", value: 20, color: "#d4a574" },
  { name: "Krullen", value: 12, color: "#e8c9a8" },
  { name: "Overig", value: 8, color: "#94a3b8" },
];

const kpiData = {
  totalRevenue: 2450,
  totalBookings: 52,
  avgBookingValue: 47,
  conversionRate: 78,
  returningCustomers: 32,
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("week");

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600">Inzichten in je salon prestaties</p>
        </div>
        
        {/* Period filter */}
        <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200">
          {["vandaag", "week", "maand"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                period === p
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p === "vandaag" ? "Vandaag" : p === "week" ? "Deze week" : "Deze maand"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KpiCard
          label="Totale omzet"
          value={`€${kpiData.totalRevenue}`}
          change="+12%"
          icon="💰"
          positive
        />
        <KpiCard
          label="Aantal boekingen"
          value={kpiData.totalBookings}
          change="+8%"
          icon="📅"
          positive
        />
        <KpiCard
          label="Gem. boeking"
          value={`€${kpiData.avgBookingValue}`}
          change="+5%"
          icon="💶"
          positive
        />
        <KpiCard
          label="Conversie"
          value={`${kpiData.conversionRate}%`}
          change="-2%"
          icon="🎯"
          positive={false}
        />
        <KpiCard
          label="Terugkerend"
          value={kpiData.returningCustomers}
          change="+15%"
          icon="👥"
          positive
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings per day */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Boekingen per dag
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="bookings" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Omzet trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={bookingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => `€${value}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#d4a574"
                strokeWidth={3}
                dot={{ fill: "#d4a574", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Behandelingen verdeling
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
          <div className="mt-4 grid grid-cols-2 gap-2">
            {serviceData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Maandelijks overzicht
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="bookings" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  icon,
  positive,
}: {
  label: string;
  value: string | number;
  change: string;
  icon: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p
        className={`text-sm font-medium ${
          positive ? "text-green-600" : "text-red-600"
        }`}
      >
        {change} vs vorige periode
      </p>
    </div>
  );
}
