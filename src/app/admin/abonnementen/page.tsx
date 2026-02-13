'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Subscription {
  id: string;
  name: string;
  description?: string;
  total_sessions: number;
  price: number;
  service_ids: string[];
  valid_months: number;
  is_active: boolean;
}

interface CustomerSubscription {
  id: string;
  customer_id: string;
  customer_name: string;
  subscription_id: string;
  subscription_name: string;
  total_sessions: number;
  used_sessions: number;
  status: 'active' | 'expired' | 'used';
  valid_until: string;
  created_at: string;
}

export default function AbonnementenPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customerSubs, setCustomerSubs] = useState<CustomerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'active'>('plans');
  
  // Create plan state
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planSessions, setPlanSessions] = useState(10);
  const [planPrice, setPlanPrice] = useState(300);
  const [planValidMonths, setPlanValidMonths] = useState(12);
  
  // Sell subscription state
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

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
      const [{ data: plans }, { data: active }] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('salon_id', salonData.id).eq('is_active', true),
        supabase.from('customer_subscriptions').select('*').order('created_at', { ascending: false }),
      ]);
      
      setSubscriptions(plans || []);
      setCustomerSubs(active || []);
    }
    
    setLoading(false);
  };

  const createPlan = async () => {
    const { error } = await supabase.from('subscriptions').insert([{
      name: planName,
      description: planDescription,
      total_sessions: planSessions,
      price: planPrice,
      valid_months: planValidMonths,
    }]);

    if (error) {
      alert('Fout: ' + error.message);
    } else {
      setShowCreatePlan(false);
      resetPlanForm();
      fetchData();
    }
  };

  const sellSubscription = async () => {
    if (!selectedPlan) return;
    
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + selectedPlan.valid_months);
    
    const { error } = await supabase.from('customer_subscriptions').insert([{
      customer_name: customerName,
      customer_phone: customerPhone,
      subscription_id: selectedPlan.id,
      subscription_name: selectedPlan.name,
      total_sessions: selectedPlan.total_sessions,
      used_sessions: 0,
      status: 'active',
      valid_until: validUntil.toISOString(),
    }]);

    if (error) {
      alert('Fout: ' + error.message);
    } else {
      setShowSellModal(false);
      resetSellForm();
      fetchData();
      setActiveTab('active');
    }
  };

  const useSession = async (subId: string, currentUsed: number, total: number) => {
    const newUsed = currentUsed + 1;
    const status = newUsed >= total ? 'used' : 'active';
    
    const { error } = await supabase
      .from('customer_subscriptions')
      .update({ 
        used_sessions: newUsed,
        status: status,
      })
      .eq('id', subId);

    if (error) {
      alert('Fout: ' + error.message);
    } else {
      fetchData();
    }
  };

  const resetPlanForm = () => {
    setPlanName('');
    setPlanDescription('');
    setPlanSessions(10);
    setPlanPrice(300);
    setPlanValidMonths(12);
  };

  const resetSellForm = () => {
    setSelectedPlan(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL');
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Abonnementen laden..." />
      </div>
    );
  }

  const activeCount = customerSubs.filter(s => s.status === 'active').length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Abonnementen</h1>
          <p className="text-slate-600 text-sm md:text-base">Strippenkaarten en abonnementen</p>
        </div>
        <button
          onClick={() => setShowCreatePlan(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          + Nieuw abonnement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Actieve abonnementen</p>
          <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Totaal verkocht</p>
          <p className="text-2xl font-bold text-slate-900">{customerSubs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Beschikbare plannen</p>
          <p className="text-2xl font-bold text-slate-900">{subscriptions.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'plans'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Abonnement plannen
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Actieve abonnementen
        </button>
      </div>

      {/* Content */}
      {activeTab === 'plans' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {subscriptions.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-slate-500">{plan.description}</p>}
                </div>
                <p className="text-2xl font-bold text-slate-900">€{plan.price}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Aantal behandelingen</span>
                  <span className="font-medium">{plan.total_sessions}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Prijs per behandeling</span>
                  <span className="font-medium">€{(plan.price / plan.total_sessions).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Geldigheid</span>
                  <span className="font-medium">{plan.valid_months} maanden</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowSellModal(true);
                }}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verkopen
              </button>
            </div>
          ))}

          {subscriptions.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-slate-500">Nog geen abonnement plannen</p>
              <button
                onClick={() => setShowCreatePlan(true)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg"
              >
                Maak het eerste plan
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {customerSubs.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{sub.subscription_name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'used' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sub.status === 'active' ? 'Actief' : 
                       sub.status === 'used' ? 'Volledig gebruikt' : 'Verlopen'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{sub.customer_name} • {sub.customer_phone}</p>
                  <p className="text-xs text-slate-400">Geldig tot: {formatDate(sub.valid_until)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {sub.total_sessions - sub.used_sessions}
                    </p>
                    <p className="text-sm text-slate-500">
                      van {sub.total_sessions} resterend
                    </p>
                  </div>

                  {sub.status === 'active' && (
                    <button
                      onClick={() => useSession(sub.id, sub.used_sessions, sub.total_sessions)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Gebruik 1x
                    </button>
                  )}
                </div>              
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${(sub.used_sessions / sub.total_sessions) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {customerSubs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nog geen verkochte abonnementen</p>
            </div>
          )}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreatePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Nieuw abonnement plan</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Naam *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Bijv. 10x knippen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Omschrijving</label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Wat zit er in dit abonnement?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aantal behandelingen *</label>
                  <input
                    type="number"
                    value={planSessions}
                    onChange={(e) => setPlanSessions(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prijs (€) *</label>
                  <input
                    type="number"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Geldigheid (maanden)</label>
                <select
                  value={planValidMonths}
                  onChange={(e) => setPlanValidMonths(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value={3}>3 maanden</option>
                  <option value={6}>6 maanden</option>
                  <option value={12}>12 maanden</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCreatePlan(false);
                  resetPlanForm();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={createPlan}
                disabled={!planName || planSessions <= 0 || planPrice <= 0}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-50"
              >
                Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Subscription Modal */}
      {showSellModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Abonnement verkopen</h2>
              <p className="text-slate-500">{selectedPlan.name} — €{selectedPlan.price}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Klant naam *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Naam klant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefoonnummer</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="06-12345678"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">
                  {selectedPlan.total_sessions}x {selectedPlan.name}
                </p>
                <p className="text-sm text-slate-600">
                  Geldig voor {selectedPlan.valid_months} maanden
                </p>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  Totaal: €{selectedPlan.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  resetSellForm();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={sellSubscription}
                disabled={!customerName}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                Verkopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
