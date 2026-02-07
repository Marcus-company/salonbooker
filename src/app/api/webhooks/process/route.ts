import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processWebhookDeliveries } from '@/lib/webhook/webhookService'

// POST /api/webhooks/process - Process pending webhook deliveries
// This endpoint should be called by a cron job or queue worker
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const batchSize = parseInt(searchParams.get('batchSize') || '10')

    const results = await processWebhookDeliveries(batchSize)

    return NextResponse.json({
      message: 'Webhook processing complete',
      results
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/webhooks/process - Get processing stats
export async function GET() {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stats
    const { data: pendingCount } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .is('delivered_at', null)
      .lt('attempt_count', 5)

    const { data: failedCount } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .is('delivered_at', null)
      .gte('attempt_count', 5)

    const { data: deliveredToday } = await supabase
      .from('webhook_deliveries')
      .select('*', { count: 'exact', head: true })
      .gte('delivered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({
      stats: {
        pending: pendingCount || 0,
        failed: failedCount || 0,
        delivered_today: deliveredToday || 0
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
