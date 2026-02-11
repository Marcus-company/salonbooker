import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/products/alerts/low-stock - Get low stock alerts
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's salon
    const { data: staffData } = await supabase
      .from('staff')
      .select('salon_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData?.salon_id) {
      return NextResponse.json({ error: 'No salon found' }, { status: 404 })
    }

    // Get low stock products using the view
    const { data: alerts, error } = await supabase
      .from('low_stock_alerts')
      .select('*')
      .eq('salon_id', staffData.salon_id)
      .order('stock_quantity', { ascending: true })

    if (error) {
      throw error
    }

    // Calculate summary
    const critical = alerts?.filter(a => a.alert_level === 'critical').length || 0
    const warning = alerts?.filter(a => a.alert_level === 'warning').length || 0

    return NextResponse.json({
      alerts: alerts || [],
      summary: {
        total: alerts?.length || 0,
        critical,
        warning,
      },
    })
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock alerts' },
      { status: 500 }
    )
  }
}
