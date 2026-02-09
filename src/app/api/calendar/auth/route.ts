import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getAuthUrl, 
  getTokensFromCode, 
  saveUserCalendarTokens,
  getUserCalendarTokens,
  refreshAccessToken,
  createCalendarEvent,
} from '@/lib/calendar/google'

// GET /api/calendar/auth - Start OAuth flow
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has connected calendar
    const existingTokens = await getUserCalendarTokens(session.user.id)
    if (existingTokens?.access_token) {
      return NextResponse.json({ 
        connected: true,
        message: 'Calendar already connected' 
      })
    }

    // Generate OAuth URL with user ID as state
    const authUrl = getAuthUrl(session.user.id)
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Calendar auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}

// POST /api/calendar/callback - Handle OAuth callback
export async function POST(req: NextRequest) {
  try {
    const { code, state: userId } = await req.json()

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Missing code or state' },
        { status: 400 }
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      )
    }

    // Save tokens to database
    await saveUserCalendarTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    })

    return NextResponse.json({ 
      success: true,
      message: 'Calendar connected successfully'
    })
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.json(
      { error: 'Failed to connect calendar' },
      { status: 500 }
    )
  }
}
