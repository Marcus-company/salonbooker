import { createClient } from '@/lib/supabase/server'
import { generateBookingICS } from '@/lib/calendar/icsGenerator'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get booking ID from query params
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }
    
    // Fetch booking from database
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    
    // Generate ICS file
    const { ics, filename } = generateBookingICS(booking)
    
    // Return as downloadable file
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Calendar API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
