'use client'

import { generateGoogleCalendarUrl, generateOutlookCalendarUrl, generateBookingICS } from '@/lib/calendar/icsGenerator'

interface CalendarButtonsProps {
  booking: {
    id: string
    customer_name: string
    customer_email?: string
    service_name: string
    booking_date: string
    booking_time: string
    service_duration?: string
  }
}

export default function CalendarButtons({ booking }: CalendarButtonsProps) {
  const handleDownloadICS = () => {
    const { ics, filename } = generateBookingICS(booking)
    
    // Create blob and download
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  const handleGoogleCalendar = () => {
    // Parse duration
    const durationMatch = booking.service_duration?.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45
    
    // Parse time
    const [hours, minutes] = booking.booking_time.split(':').map(Number)
    
    // Create dates
    const startDate = new Date(booking.booking_date)
    startDate.setHours(hours, minutes, 0, 0)
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    
    const url = generateGoogleCalendarUrl({
      id: booking.id,
      title: `${booking.service_name} bij HairsalonX`,
      description: `Afspraak bij HairsalonX\\n\\nKlant: ${booking.customer_name}\\nService: ${booking.service_name}`,
      location: 'Hoofdstraat 123, 6041 AB Roermond',
      startDate,
      endDate
    })
    
    window.open(url, '_blank')
  }
  
  const handleOutlookCalendar = () => {
    // Parse duration
    const durationMatch = booking.service_duration?.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45
    
    // Parse time
    const [hours, minutes] = booking.booking_time.split(':').map(Number)
    
    // Create dates
    const startDate = new Date(booking.booking_date)
    startDate.setHours(hours, minutes, 0, 0)
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    
    const url = generateOutlookCalendarUrl({
      id: booking.id,
      title: `${booking.service_name} bij HairsalonX`,
      description: `Afspraak bij HairsalonX\\n\\nKlant: ${booking.customer_name}\\nService: ${booking.service_name}`,
      location: 'Hoofdstraat 123, 6041 AB Roermond',
      startDate,
      endDate
    })
    
    window.open(url, '_blank')
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleGoogleCalendar}
        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3h-15A2.5 2.5 0 0 0 2 5.5v13A2.5 2.5 0 0 0 4.5 21h15a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 19.5 3zM19 19H5V8h14v11z"/>
        </svg>
        Google Calendar
      </button>
      
      <button
        onClick={handleOutlookCalendar}
        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 16H5V8h4v8zm6 0h-4V8h4v8zm5 0h-3V8h3v8z"/>
        </svg>
        Outlook
      </button>
      
      <button
        onClick={handleDownloadICS}
        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download .ics
      </button>
    </div>
  )
}
