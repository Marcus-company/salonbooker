// iCalendar (.ics) generator for SalonBooker
// Generates calendar invites that work with Google Calendar, Outlook, Apple Calendar

interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate: Date
  customerEmail?: string
  customerName?: string
}

function formatDate(date: Date): string {
  // Format: 20260205T100000Z
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function generateICS(event: CalendarEvent): string {
  const now = formatDate(new Date())
  const start = formatDate(event.startDate)
  const end = formatDate(event.endDate)
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SalonBooker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@salonbooker.nl`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : '',
    event.location ? `LOCATION:${escapeICS(event.location)}` : '',
    event.customerEmail ? `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.customerEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'TRIGGER:-PT15M', // 15 minutes before
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
  
  return icsContent
}

export function generateBookingICS(
  booking: {
    id: string
    customer_name: string
    customer_email?: string
    service_name: string
    booking_date: string
    booking_time: string
    service_duration?: string
  },
  salonInfo: {
    name: string
    address: string
  } = { name: 'HairsalonX', address: 'Hoofdstraat 123, 6041 AB Roermond' }
): { ics: string; filename: string } {
  // Parse duration (e.g., "45 min" -> 45 minutes)
  const durationMatch = booking.service_duration?.match(/(\d+)/)
  const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45
  
  // Parse time (e.g., "10:00")
  const [hours, minutes] = booking.booking_time.split(':').map(Number)
  
  // Create start date
  const startDate = new Date(booking.booking_date)
  startDate.setHours(hours, minutes, 0, 0)
  
  // Create end date
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  
  const ics = generateICS({
    id: booking.id,
    title: `${booking.service_name} bij ${salonInfo.name}`,
    description: `Afspraak bij ${salonInfo.name}\\n\\nKlant: ${booking.customer_name}\\nService: ${booking.service_name}\\n\\nWij zien je graag!`,
    location: salonInfo.address,
    startDate,
    endDate,
    customerEmail: booking.customer_email,
    customerName: booking.customer_name
  })
  
  const filename = `afspraak-${booking.service_name.toLowerCase().replace(/\s+/g, '-')}-${booking.booking_date}.ics`
  
  return { ics, filename }
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.description || '',
    location: event.location || ''
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    body: event.description || '',
    location: event.location || ''
  })
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
