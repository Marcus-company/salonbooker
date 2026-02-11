import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/products/[id]/stock - Adjust stock
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

    // Check admin role
    const { data: staffData } = await supabase
      .from('staff')
      .select('role, id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!staffData || staffData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 })
    }

    const body = await req.json()
    const { type, quantity, reason } = body

    if (!type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Type, quantity (positive) and reason are required' },
        { status: 400 }
      )
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', params.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const previousStock = product.stock_quantity
    let newStock = previousStock

    // Calculate new stock based on type
    switch (type) {
      case 'in':
        newStock = previousStock + quantity
        break
      case 'out':
      case 'sale':
        newStock = previousStock - quantity
        if (newStock < 0) {
          return NextResponse.json(
            { error: 'Insufficient stock' },
            { status: 400 }
          )
        }
        break
      case 'adjustment':
        newStock = quantity // Direct set for adjustments
        break
      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: in, out, sale, adjustment' },
          { status: 400 }
        )
    }

    // Create stock transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('stock_transactions')
      .insert([{
        product_id: params.id,
        type,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason || 'Manual adjustment',
        staff_id: staffData.id,
      }])
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    return NextResponse.json({ 
      transaction,
      previous_stock: previousStock,
      new_stock: newStock,
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]/stock - Get stock history
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

    const { data: transactions, error } = await supabase
      .from('stock_transactions')
      .select('*, staff(name)')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching stock history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock history' },
      { status: 500 }
    )
  }
}
