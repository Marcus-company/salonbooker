import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createWebhook, testWebhook } from '@/lib/webhook/webhookService'

// GET /api/webhooks - List webhooks for the salon
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's salon
    const { data: staff } = await supabase
      .from('staff')
      .select('salon_id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 403 })
    }

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('salon_id', staff.salon_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Don't return the secret in the list
    const sanitizedWebhooks = webhooks?.map(w => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events,
      is_active: w.is_active,
      created_at: w.created_at,
      updated_at: w.updated_at
    }))

    return NextResponse.json({ webhooks: sanitizedWebhooks })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's salon
    const { data: staff } = await supabase
      .from('staff')
      .select('salon_id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staff || staff.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, url, events, secret } = body

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const result = await createWebhook(
      staff.salon_id,
      name,
      url,
      events || ['booking.created', 'booking.updated', 'booking.cancelled'],
      secret
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      { webhook: result.webhook, message: 'Webhook created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
