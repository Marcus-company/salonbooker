import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/emailService'
import { withRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (date) {
      query = query.eq('booking_date', date)
    }

    const { data, error } = await query

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Rate limit: 5 bookings per minute per IP
const POSTHandler = async (request: NextRequest) => {
  try {
    const supabase = createClient()
    
    // Check authentication (optional for public bookings)
    // const { data: { session } } = await supabase.auth.getSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    
    // Validate required fields
    const required = ['customer_name', 'customer_phone', 'service_name', 'booking_date', 'booking_time']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Additional validation
    if (body.customer_phone && !/^\+?[\d\s\-\(\)]{8,}$/.test(body.customer_phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    if (body.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Database compatibility: ensure all NOT NULL columns have defaults
    const insertData: Record<string, string | number | null> = {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email || null,
      service_name: body.service_name,
      service_duration: body.service_duration || '60 min',
      service_price: body.service_price || 0,
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      status: body.status || 'pending',
      notes: body.notes || null,
      // Provide default for any staff-related fields
      staff_name: body.staff_name || 'Geen voorkeur',
      staff_id: body.staff_id || null,
      service_id: body.service_id || null,
      salon_id: body.salon_id || null
    }
    
    // If database uses start_time instead of booking_time, map it
    if (body.booking_time) {
      insertData.start_time = body.booking_time
    }
    
    // Add end_time if provided, otherwise calculate from duration
    if (body.end_time) {
      insertData.end_time = body.end_time
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([insertData])
      .select()

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const booking = data[0]

    // Send confirmation email if email is provided
    if (body.customer_email) {
      try {
        await sendEmail('booking_confirmation', {
          customerName: body.customer_name,
          customerEmail: body.customer_email,
          serviceName: body.service_name,
          date: body.booking_date,
          time: body.booking_time
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(POSTHandler, {
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
    }

    // Get current booking to check for email
    const { data: currentBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('bookings')
      .update({ status, ...updates })
      .eq('id', id)
      .select()

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send status update email
    if (currentBooking?.customer_email && status && status !== currentBooking.status) {
      try {
        if (status === 'confirmed') {
          await sendEmail('booking_confirmed', {
            customerName: currentBooking.customer_name,
            customerEmail: currentBooking.customer_email,
            serviceName: currentBooking.service_name,
            date: currentBooking.booking_date,
            time: currentBooking.booking_time
          })
        } else if (status === 'cancelled') {
          await sendEmail('booking_cancelled', {
            customerName: currentBooking.customer_name,
            customerEmail: currentBooking.customer_email,
            serviceName: currentBooking.service_name,
            date: currentBooking.booking_date,
            time: currentBooking.booking_time
          })
        }
      } catch (emailError) {
        console.error('Failed to send status email:', emailError)
      }
    }

    return NextResponse.json({ booking: data[0] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
