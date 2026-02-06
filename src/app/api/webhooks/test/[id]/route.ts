import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { testWebhook } from '@/lib/webhook/webhookService'

// POST /api/webhooks/test/[id] - Test a webhook
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's role
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staff || staff.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result = await testWebhook(params.id)

    if (result.success) {
      return NextResponse.json({ message: 'Webhook test successful' })
    } else {
      return NextResponse.json(
        { error: result.error || 'Webhook test failed' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
