import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {} as Record<string, { status: string; message?: string }>
  }

  // Check Supabase connection
  try {
    const supabase = createClient()
    const { error: dbError } = await supabase.from('salons').select('count').single()
    
    if (dbError) {
      checks.checks.supabase = { status: 'error', message: dbError.message }
      checks.status = 'error'
    } else {
      checks.checks.supabase = { status: 'ok' }
    }
  } catch {
    checks.checks.supabase = { status: 'error', message: 'Connection failed' }
    checks.status = 'error'
  }

  // Check auth
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    checks.checks.auth = { status: 'ok', message: session ? 'Session available' : 'No session' }
  } catch {
    checks.checks.auth = { status: 'error', message: 'Auth check failed' }
  }

  const statusCode = checks.status === 'ok' ? 200 : 503
  return NextResponse.json(checks, { status: statusCode })
}
