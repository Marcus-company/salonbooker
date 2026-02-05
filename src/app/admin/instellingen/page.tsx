'use client';

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
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-slate-600 text-sm md:text-base">Beheer openingstijden en behandelingen</p>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("hours")}
          className={`px-4 md:px-6 py-3 font-medium transition-colors border-b-2 text-sm md:text-base ${
            activeTab === "hours"
              ? "text-slate-900 border-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          <span className="hidden md:inline">🕐 </span>Openingstijden
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 md:px-6 py-3 font-medium transition-colors border-b-2 text-sm md:text-base ${
            activeTab === "services"
              ? "text-slate-900 border-slate-900"
              : "text-slate-500 border-transparent hover:text-slate-700"
          }`}
        >
          <span className="hidden md:inline">✂️ </span>Behandelingen
        </button>
      </div>
      
      {/* Openingstijden */}
      {activeTab === "hours" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 md:mb-6">Openingstijden</h2>
          
          <div className="space-y-3 md:space-y-4">
            {hours.map((day, index) => (
              <div key={day.day} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-lg">
                <div className="w-24 md:w-32 font-medium text-slate-900 text-sm md:text-base">{day.day}</div>
                
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
                  <span className="text-slate-700 text-sm md:text-base">Gesloten</span>
                </label>
                
                {!day.closed && (
                  <div className="flex items-center gap-2 md:gap-4 md:ml-auto">
                    <div className="flex items-center gap-1 md:gap-2">
                      <label className="text-xs md:text-sm text-slate-500">Open:</label>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => {
                          const newHours = [...hours];
                          newHours[index].open = e.target.value;
                          setHours(newHours);
                        }}
                        className="px-2 md:px-3 py-1 md:py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <label className="text-xs md:text-sm text-slate-500">Sluit:</label>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => {
                          const newHours = [...hours];
                          newHours[index].close = e.target.value;
                          setHours(newHours);
                        }}
                        className="px-2 md:px-3 py-1 md:py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
              💾 Opslaan
            </button>
          </div>
        </div>
      )}
      
      {/* Behandelingen */}
      {activeTab === "services" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Behandelingen</h2>
            <button className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm md:text-base">
              + Nieuwe behandeling
            </button>
          </div>
          
          <div className="divide-y divide-slate-200">
            {services.map((service) => (
              <div key={service.name} className="py-3 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <p className="font-medium text-slate-900 text-sm md:text-base">{service.name}</p>
                  <p className="text-xs md:text-sm text-slate-500">{service.duration}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <p className="font-semibold text-slate-900">{service.price}</p>
                  <div className="flex gap-2">
                    <button className="px-2 md:px-3 py-1 text-xs md:text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                      Bewerk
                    </button>
                    <button className="px-2 md:px-3 py-1 text-xs md:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
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
