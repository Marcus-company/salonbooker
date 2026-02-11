import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/products/[id] - Get single product
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

    const { data: product, error } = await supabase
      .from('products')
      .select('*, stock_transactions(*)')
      .eq('id', params.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: staffData } = await supabase
      .from('staff')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData || staffData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      description,
      sku,
      category,
      purchase_price,
      selling_price,
      min_stock_level,
      max_stock_level,
      unit,
      supplier,
      barcode,
      is_active,
    } = body

    const { data, error } = await supabase
      .from('products')
      .update({
        name,
        description,
        sku,
        category,
        purchase_price,
        selling_price,
        min_stock_level,
        max_stock_level,
        unit,
        supplier,
        barcode,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: staffData } = await supabase
      .from('staff')
      .select('role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData || staffData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
