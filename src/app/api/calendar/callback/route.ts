import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getTokensFromCode, 
  saveUserCalendarTokens,
} from '@/lib/calendar/google'

// GET /api/calendar/callback - Handle OAuth callback (redirect from Google)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Contains user ID
    const error = searchParams.get('error')

    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        new URL('/admin/instellingen?calendar=error&message=' + error, req.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin/instellingen?calendar=error&message=missing_params', req.url)
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/admin/instellingen?calendar=error&message=no_token', req.url)
      )
    }

    // Save tokens to database
    await saveUserCalendarTokens(state, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    })

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/admin/instellingen?calendar=success', req.url)
    )
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(
      new URL('/admin/instellingen?calendar=error&message=server_error', req.url)
    )
  }
}

// POST /api/calendar/callback - Alternative for manual token exchange
export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json()

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Missing code or userId' },
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
      message: 'Calendar connected successfully',
      expires_at: tokens.expiry_date,
    })
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.json(
      { error: 'Failed to connect calendar' },
      { status: 500 }
    )
  }
}
