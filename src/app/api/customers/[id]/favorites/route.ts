import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/customers/[id]/favorites - Get customer favorites
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

    const { data: favorites, error } = await supabase
      .from('customer_favorites')
      .select(`
        *,
        service:service_id(id, name, duration, price),
        product:product_id(id, name, selling_price)
      `)
      .eq('customer_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching customer favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST /api/customers/[id]/favorites - Add a favorite
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

    const { type, service_id, product_id, notes } = await req.json()

    if (!type || (type === 'service' && !service_id) || (type === 'product' && !product_id)) {
      return NextResponse.json(
        { error: 'Type and service_id or product_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('customer_favorites')
      .insert([{
        customer_id: params.id,
        type,
        service_id: type === 'service' ? service_id : null,
        product_id: type === 'product' ? product_id : null,
        notes,
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ favorite: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating favorite:', error)
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id]/favorites/[favoriteId] - Remove a favorite
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; favoriteId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('customer_favorites')
      .delete()
      .eq('id', params.favoriteId)
      .eq('customer_id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    )
  }
}
