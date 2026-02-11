'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  category?: string
  purchase_price?: number
  selling_price: number
  stock_quantity: number
  min_stock_level: number
  max_stock_level?: number
  unit: string
  supplier?: string
  barcode?: string
  is_active: boolean
  created_at: string
}

interface LowStockAlert {
  id: string
  name: string
  sku?: string
  stock_quantity: number
  min_stock_level: number
  unit: string
  alert_level: 'critical' | 'warning'
  shortage_amount: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'alerts'>('products')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    purchase_price: '',
    selling_price: '',
    stock_quantity: '0',
    min_stock_level: '5',
    max_stock_level: '',
    unit: 'stuks',
    supplier: '',
    barcode: '',
  })

  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'in',
    quantity: '1',
    reason: '',
  })

  useEffect(() => {
    fetchProducts()
    fetchAlerts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('low_stock_alerts')
      .select('*')
      .order('stock_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching alerts:', error)
    } else {
      setAlerts(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      sku: formData.sku || null,
      category: formData.category || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      selling_price: parseFloat(formData.selling_price),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      min_stock_level: parseInt(formData.min_stock_level) || 5,
      max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : null,
      unit: formData.unit,
      supplier: formData.supplier || null,
      barcode: formData.barcode || null,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id)

      if (error) {
        console.error('Error updating product:', error)
        alert('Fout bij opslaan')
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([payload])

      if (error) {
        console.error('Error creating product:', error)
        alert('Fout bij aanmaken')
      }
    }

    setShowModal(false)
    setEditingProduct(null)
    resetForm()
    fetchProducts()
    fetchAlerts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      alert('Fout bij verwijderen')
    } else {
      fetchProducts()
      fetchAlerts()
    }
  }

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    const response = await fetch(`/api/products/${selectedProduct.id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: stockAdjustment.type,
        quantity: parseInt(stockAdjustment.quantity),
        reason: stockAdjustment.reason,
      }),
    })

    if (response.ok) {
      setShowStockModal(false)
      setSelectedProduct(null)
      setStockAdjustment({ type: 'in', quantity: '1', reason: '' })
      fetchProducts()
      fetchAlerts()
    } else {
      const error = await response.json()
      alert('Fout: ' + error.error)
    }
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      category: product.category || '',
      purchase_price: product.purchase_price?.toString() || '',
      selling_price: product.selling_price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level?.toString() || '',
      unit: product.unit,
      supplier: product.supplier || '',
      barcode: product.barcode || '',
    })
    setShowModal(true)
  }

  const openStockModal = (product: Product) => {
    setSelectedProduct(product)
    setShowStockModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      purchase_price: '',
      selling_price: '',
      stock_quantity: '0',
      min_stock_level: '5',
      max_stock_level: '',
      unit: 'stuks',
      supplier: '',
      barcode: '',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return { label: 'Uitverkocht', class: 'bg-red-100 text-red-700' }
    if (product.stock_quantity <= product.min_stock_level) return { label: 'Laag', class: 'bg-amber-100 text-amber-700' }
    return { label: 'Op voorraad', class: 'bg-green-100 text-green-700' }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Producten laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Producten</h1>
          <p className="text-slate-600 text-sm md:text-base">Beheer je producten en voorraad</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingProduct(null)
            setShowModal(true)
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Nieuw product
        </button>
      </div>

      {/* Alerts Summary */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <h2 className="font-semibold text-red-900">Lage voorraad meldingen</h2>
          </div>
          <p className="text-red-700 text-sm">
            {alerts.filter(a => a.alert_level === 'critical').length} producten zijn uitverkocht,{' '}
            {alerts.filter(a => a.alert_level === 'warning').length} hebben lage voorraad.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'products'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Producten ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 font-medium transition-colors ${
            activeTab === 'alerts'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Voorraad</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Prijs</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const status = getStockStatus(product)
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          {product.category && (
                            <p className="text-sm text-slate-500">{product.category}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{product.sku || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${product.stock_quantity <= product.min_stock_level ? 'text-red-600' : 'text-slate-900'}`}>
                          {product.stock_quantity}
                        </span>
                        <span className="text-sm text-slate-500"> {product.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{formatCurrency(product.selling_price)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openStockModal(product)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          >
                            Voorraad
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                          >
                            Bewerk
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            Verwijder
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p className="mb-4">Nog geen producten toegevoegd</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg"
              >
                Voeg eerste product toe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border ${
                alert.alert_level === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {alert.alert_level === 'critical' ? '🔴' : '🟡'}
                    </span>
                    <h3 className="font-semibold text-slate-900">{alert.name}</h3>
                    {alert.sku && (
                      <span className="text-sm text-slate-500">({alert.sku})</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Voorraad: <strong>{alert.stock_quantity}</strong> {alert.unit} | 
                    Minimum: {alert.min_stock_level} {alert.unit} |
                    Tekort: {alert.shortage_amount} {alert.unit}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const product = products.find(p => p.id === alert.id)
                    if (product) openStockModal(product)
                  }}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
                >
                  Voorraad aanvullen
                </button>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="p-8 text-center bg-green-50 rounded-xl">
              <p className="text-green-700">✅ Alle producten hebben voldoende voorraad</p>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingProduct ? 'Product bewerken' : 'Nieuw product'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Naam *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Beschrijving</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categorie</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="bv. Shampoo, Tools"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inkoopprijs</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verkoopprijs *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Startvoorraad</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum voorraad</label>
                    <input
                      type="number"
                      value={formData.min_stock_level}
                      onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Eenheid</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="stuks">stuks</option>
                      <option value="ml">ml</option>
                      <option value="liter">liter</option>
                      <option value="gram">gram</option>
                      <option value="kg">kg</option>
                      <option value="sets">sets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Leverancier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                  >
                    {editingProduct ? 'Opslaan' : 'Aanmaken'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Voorraad aanpassen</h2>
                <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">{selectedProduct.name}</p>
                <p className="text-sm text-slate-600">
                  Huidige voorraad: <strong>{selectedProduct.stock_quantity}</strong> {selectedProduct.unit}
                </p>
              </div>

              <form onSubmit={handleStockAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type aanpassing</label>
                  <select
                    value={stockAdjustment.type}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in">➕ Voorraad toevoegen</option>
                    <option value="out">➖ Voorraad verwijderen</option>
                    <option value="adjustment">📝 Directe aanpassing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aantal</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockAdjustment.quantity}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reden</label>
                  <input
                    type="text"
                    required
                    value={stockAdjustment.reason}
                    onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="bv. Nieuwe levering, Verkoop, Inventaris"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Aanpassen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
