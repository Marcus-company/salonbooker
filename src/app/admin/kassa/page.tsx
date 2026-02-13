'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  price: number;
  quantity: number;
}

interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  payment_method: 'cash' | 'card' | 'other';
  created_at: string;
}

export default function KassaPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('card');
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: salonData } = await supabase
      .from('salons')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (salonData?.id) {
      const [{ data: servicesData }, { data: productsData }] = await Promise.all([
        supabase.from('services').select('*').eq('salon_id', salonData.id).eq('is_active', true),
        supabase.from('products').select('*').eq('salon_id', salonData.id).eq('is_active', true),
      ]);
      
      setServices(servicesData || []);
      setProducts(productsData || []);
    }
    
    setLoading(false);
  };

  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const existingItem = cart.find(c => c.id === item.id && c.type === type);
    
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id && c.type === type
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        type,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]);
    }
  };

  const removeFromCart = (id: string, type: 'service' | 'product') => {
    setCart(cart.filter(c => !(c.id === id && c.type === type)));
  };

  const updateQuantity = (id: string, type: 'service' | 'product', quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, type);
    } else {
      setCart(cart.map(c => 
        c.id === id && c.type === type
          ? { ...c, quantity }
          : c
      ));
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.21; // 21% BTW
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const processPayment = async () => {
    if (cart.length === 0) return;
    
    setProcessing(true);
    
    const { subtotal, tax, total } = calculateTotals();
    
    // Save transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        items: cart,
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
      }])
      .select()
      .single();

    if (error) {
      console.error('Payment error:', error);
      alert('Fout bij verwerken betaling');
    } else {
      setLastTransaction(data);
      setShowReceipt(true);
      setCart([]);
    }
    
    setProcessing(false);
  };

  const { subtotal, tax, total } = calculateTotals();

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Kassa laden..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Kassa</h1>
          <p className="text-slate-600 text-sm md:text-base">Afrekenen en betalingen</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Product/Service Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Diensten
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Producten
            </button>
          </div>

          {/* Items Grid */}
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {activeTab === 'services' ? (
                services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addToCart(service, 'service')}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <p className="font-medium text-slate-900 truncate">{service.name}</p>
                    <p className="text-sm text-slate-500">{service.duration}</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">€{service.price.toFixed(2)}</p>
                  </button>
                ))
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 'product')}
                    disabled={product.stock <= 0}
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-sm text-slate-500">Voorraad: {product.stock}</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">€{product.price.toFixed(2)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Winkelwagen</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
            {cart.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Selecteer diensten of producten
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        €{item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white text-slate-600 hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-white text-slate-600 hover:bg-slate-200"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id, item.type)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotaal</span>
                <span className="font-medium">€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">BTW (21%)</span>
                <span className="font-medium">€{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Totaal</span>
                <span className="text-slate-900">€{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 mb-2">Betaalmethode</p>
              <div className="grid grid-cols-3 gap-2">
                {(['card', 'cash', 'other'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'card' ? '💳 Pin' : method === 'cash' ? '💶 Contant' : '📝 Anders'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={processPayment}
              disabled={cart.length === 0 || processing}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Bezig...' : `Afrekenen €${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-2">✅</div>
              <h2 className="text-2xl font-bold text-slate-900">Betaling geslaagd!</h2>
              <p className="text-slate-500">
                {new Date(lastTransaction.created_at).toLocaleString('nl-NL')}
              </p>
            </div>

            <div className="border-t border-b border-slate-200 py-4 mb-4">
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-slate-600">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotaal</span>
                <span>€{lastTransaction.total - lastTransaction.tax}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">BTW</span>
                <span>€{lastTransaction.tax}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Totaal</span>
                <span>€{lastTransaction.total}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Betaald met</span>
                <span>
                  {lastTransaction.payment_method === 'card' ? 'Pin' : 
                   lastTransaction.payment_method === 'cash' ? 'Contant' : 'Anders'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
            >
              Nieuwe bestelling
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
