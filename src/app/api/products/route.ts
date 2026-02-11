import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/products - List all products
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
      .select('salon_id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData?.salon_id) {
      return NextResponse.json({ error: 'No salon found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('low_stock')

    let query = supabase
      .from('products')
      .select('*')
      .eq('salon_id', staffData.salon_id)
      .eq('is_active', true)

    if (category) {
      query = query.eq('category', category)
    }

    if (lowStock === 'true') {
      query = query.lte('stock_quantity', supabase.raw('min_stock_level'))
    }

    const { data, error } = await query.order('name')

    if (error) {
      throw error
    }

    return NextResponse.json({ products: data })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: staffData } = await supabase
      .from('staff')
      .select('salon_id, role')
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
      stock_quantity,
      min_stock_level,
      max_stock_level,
      unit,
      supplier,
      barcode,
    } = body

    if (!name || !selling_price) {
      return NextResponse.json(
        { error: 'Name and selling price are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        salon_id: staffData.salon_id,
        name,
        description,
        sku,
        category,
        purchase_price,
        selling_price,
        stock_quantity: stock_quantity || 0,
        min_stock_level: min_stock_level || 5,
        max_stock_level,
        unit: unit || 'stuks',
        supplier,
        barcode,
      }])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create initial stock transaction if stock > 0
    if (stock_quantity && stock_quantity > 0) {
      await supabase.from('stock_transactions').insert([{
        product_id: data.id,
        type: 'in',
        quantity: stock_quantity,
        previous_stock: 0,
        new_stock: stock_quantity,
        reason: 'Initial stock',
      }])
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
