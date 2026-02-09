import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getUserCalendarTokens,
  refreshAccessToken,
  createCalendarEvent,
  saveUserCalendarTokens,
} from '@/lib/calendar/google'

// POST /api/calendar/sync - Sync a booking to Google Calendar
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await req.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      )
    }

    // Get user's calendar tokens
    let tokens = await getUserCalendarTokens(session.user.id)
    
    if (!tokens?.access_token) {
      return NextResponse.json(
        { error: 'Calendar not connected' },
        { status: 400 }
      )
    }

    // Refresh token if expired
    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      if (!tokens.refresh_token) {
        return NextResponse.json(
          { error: 'Calendar connection expired. Please reconnect.' },
          { status: 401 }
        )
      }

      const newTokens = await refreshAccessToken(tokens.refresh_token)
      await saveUserCalendarTokens(session.user.id, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        expiry_date: newTokens.expiry_date,
      })

      tokens = await getUserCalendarTokens(session.user.id)
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(name, duration)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Calculate end time
    const startTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
    const durationMinutes = parseInt(booking.services?.duration) || 60
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

    // Create calendar event
    const event = await createCalendarEvent(tokens, {
      summary: `Afspraak: ${booking.services?.name || 'Behandeling'}`,
      description: `Boeking bij de kapsalon\n\nKlant: ${booking.customer_name}\nTelefoon: ${booking.customer_phone || 'Niet opgegeven'}${booking.notes ? `\n\nNotities: ${booking.notes}` : ''}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: 'HairsalonX, Kappersstraat 1, Amsterdam',
      attendeeEmail: booking.customer_email,
    })

    // Save event ID to booking
    await supabase
      .from('bookings')
      .update({ 
        calendar_event_id: event.id,
        calendar_synced_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    return NextResponse.json({ 
      success: true,
      eventId: event.id,
      eventLink: event.htmlLink,
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync booking to calendar' },
      { status: 500 }
    )
  }
}

// GET /api/calendar/sync - Check sync status
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await getUserCalendarTokens(session.user.id)

    return NextResponse.json({
      connected: !!tokens?.access_token,
      expiresAt: tokens?.expires_at,
    })
  } catch (error) {
    console.error('Calendar status error:', error)
    return NextResponse.json(
      { error: 'Failed to check calendar status' },
      { status: 500 }
    )
  }
}
