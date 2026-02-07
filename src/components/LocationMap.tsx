'use client'

import { useState } from 'react'

interface LocationMapProps {
  address?: string
  postcode?: string
  city?: string
}

export default function LocationMap({ 
  address = 'Dorpsstraat 123',
  postcode = '1234 AB',
  city = 'Amsterdam'
}: LocationMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Google Maps embed URL - gebruikt het adres
  // TODO: Vervang met exacte locatie van Josje wanneer bekend
  const fullAddress = `${address}, ${postcode} ${city}, Nederland`
  const encodedAddress = encodeURIComponent(fullAddress)
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.428571428571!2d4.9!3d52.37!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTLCsDIyJzEyLjAiTiA0wrA1NCcwMC4wIkU!5e0!3m2!1snl!2snl!4v1234567890!5m2!1snl!2snl`

  return (
    <div className="w-full">
      {/* Adres informatie */}
      <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Bezoek ons
        </h3>
        <address className="not-italic text-slate-600 space-y-1">
          <p className="font-medium text-slate-900">HairsalonX</p>
          <p>{address}</p>
          <p>{postcode} {city}</p>
          <p className="pt-2">
            <a 
              href={`https://maps.google.com/?q=${encodedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Routebeschrijving →
            </a>
          </p>
        </address>
      </div>

      {/* Google Maps iframe */}
      <div className="relative aspect-video w-full rounded-b-xl overflow-hidden border border-slate-200 border-t-0">
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <svg className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-slate-500 text-sm">Kaart laden...</span>
            </div>
          </div>
        )}
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(20%)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setMapLoaded(true)}
          className={`w-full h-full transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
          title={`Locatie HairsalonX - ${fullAddress}`}
        />
      </div>

      {/* Openingstijden hint */}
      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <span className="font-medium">Openingstijden:</span> Ma-Vr 09:00-18:00, Za 09:00-16:00
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Gratis parkeren voor de deur beschikbaar
        </p>
      </div>
    </div>
  )
}
