"use client";

import { useState } from "react";

const defaultHours = [
  { day: "Maandag", closed: true, open: "", close: "" },
  { day: "Dinsdag", closed: false, open: "09:00", close: "17:30" },
  { day: "Woensdag", closed: false, open: "09:00", close: "17:30" },
  { day: "Donderdag", closed: false, open: "09:00", close: "20:00" },
  { day: "Vrijdag", closed: false, open: "09:00", close: "17:30" },
  { day: "Zaterdag", closed: false, open: "09:00", close: "16:00" },
  { day: "Zondag", closed: true, open: "", close: "" },
];

const defaultServices = [
  { name: "Knippen dames", duration: "45 min", price: "€35" },
  { name: "Knippen heren", duration: "30 min", price: "€25" },
  { name: "Knippen kinderen", duration: "30 min", price: "€18" },
  { name: "Full color", duration: "90 min", price: "€55" },
  { name: "Highlights", duration: "120 min", price: "€65" },
  { name: "Balayage", duration: "150 min", price: "€85" },
];

export default function InstellingenPage() {
  const [hours, setHours] = useState(defaultHours);
  const [services] = useState(defaultServices);
  const [activeTab, setActiveTab] = useState("hours");

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-slate-600">Beheer openingstijden en behandelingen</p>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("hours")}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "hours"
              ? "text-slate-900 border-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          🕐 Openingstijden
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === "services"
              ? "text-slate-900 border-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          ✂️ Behandelingen
        </button>
      </div>
      
      {/* Openingstijden */}
      {activeTab === "hours" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Openingstijden</h2>
          
          <div className="space-y-4">
            {hours.map((day, index) => (
              <div key={day.day} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-32 font-medium text-slate-900">{day.day}</div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[index].closed = e.target.checked;
                      setHours(newHours);
                    }}
                    className="w-5 h-5 rounded border-slate-300"
                  />
                  <span className="text-slate-700">Gesloten</span>
                </label>
                
                {!day.closed && (
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-500">Open:</label>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => {
                          const newHours = [...hours];
                          newHours[index].open = e.target.value;
                          setHours(newHours);
                        }}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-500">Sluit:</label>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => {
                          const newHours = [...hours];
                          newHours[index].close = e.target.value;
                          setHours(newHours);
                        }}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
              💾 Opslaan
            </button>
          </div>
        </div>
      )}
      
      {/* Behandelingen */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Behandelingen</h2>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              + Nieuwe behandeling
            </button>
          </div>
          
          <div className="divide-y divide-slate-200">
            {services.map((service) => (
              <div key={service.name} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500">{service.duration}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-slate-900">{service.price}</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                      Bewerk
                    </button>
                    <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                      Verwijder
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
