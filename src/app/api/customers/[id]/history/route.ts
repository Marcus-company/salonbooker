import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/customers/[id]/history - Get customer booking history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer booking history
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        service:service_id(name, duration, price),
        staff:staff_id(name)
      `)
      .eq('customer_id', params.id)
      .order('booking_date', { ascending: false })

    if (bookingsError) {
      throw bookingsError
    }

    // Get customer summary stats
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        total_bookings,
        total_spent
      `)
      .eq('id', params.id)
      .single()

    if (customerError) {
      throw customerError
    }

    // Calculate stats
    const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || []
    const cancelledBookings = bookings?.filter(b => b.status === 'cancelled') || []
    const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.service_price || 0), 0)

    // Get favorite services (most booked)
    const serviceCounts: Record<string, { count: number; name: string }> = {}
    confirmedBookings.forEach(b => {
      const serviceName = b.service_name || 'Onbekend'
      if (!serviceCounts[serviceName]) {
        serviceCounts[serviceName] = { count: 0, name: serviceName }
      }
      serviceCounts[serviceName].count++
    })

    const favoriteServices = Object.values(serviceCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return NextResponse.json({
      bookings: bookings || [],
      stats: {
        total_bookings: bookings?.length || 0,
        confirmed_bookings: confirmedBookings.length,
        cancelled_bookings: cancelledBookings.length,
        total_spent: totalSpent,
        first_visit: bookings?.length > 0 ? bookings[bookings.length - 1].booking_date : null,
        last_visit: bookings?.length > 0 ? bookings[0].booking_date : null,
      },
      favorite_services: favoriteServices,
    })
  } catch (error) {
    console.error('Error fetching customer history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
