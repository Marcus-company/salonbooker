import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/customers/[id]/notes - Get all notes for a customer
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

    const { data: notes, error } = await supabase
      .from('customer_notes')
      .select('*, staff(name)')
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching customer notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST /api/customers/[id]/notes - Add a new note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff ID
    const { data: staffData } = await supabase
      .from('staff')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData?.id) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const { note, category } = await req.json()

    if (!note || note.trim() === '') {
      return NextResponse.json(
        { error: 'Note is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('customer_notes')
      .insert([{
        customer_id: params.id,
        staff_id: staffData.id,
        note: note.trim(),
        category: category || 'general',
      }])
      .select('*, staff(name)')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ note: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
