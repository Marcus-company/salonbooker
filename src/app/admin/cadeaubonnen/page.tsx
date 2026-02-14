'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  balance: number;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  recipient_name?: string;
  recipient_email?: string;
  sender_name?: string;
  message?: string;
  expires_at?: string;
  created_at: string;
}

export default function CadeaubonnenPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  
  // Create form state
  const [amount, setAmount] = useState(50);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [expiryMonths, setExpiryMonths] = useState(12);
  const [creating, setCreating] = useState(false);
  
  // Validate state
  const [validateCode, setValidateCode] = useState('');
  const [validatedCard, setValidatedCard] = useState<GiftCard | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gift_cards')
      .select('*')
      .order('created_at', { ascending: false });
    setGiftCards(data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'HAIR';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createGiftCard = async () => {
    setCreating(true);
    
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);
    
    const { error } = await supabase
      .from('gift_cards')
      .insert([{
        code,
        initial_amount: amount,
        balance: amount,
        status: 'active',
        recipient_name: recipientName || null,
        recipient_email: recipientEmail || null,
        sender_name: senderName || null,
        message: message || null,
        expires_at: expiresAt.toISOString(),
      }]);

    if (error) {
      alert('Fout bij aanmaken: ' + error.message);
    } else {
      setShowCreateModal(false);
      resetForm();
      fetchGiftCards();
    }
    
    setCreating(false);
  };

  const validateGiftCard = async () => {
    setValidating(true);
    
    const { data } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('code', validateCode.toUpperCase())
      .single();

    if (!data) {
      setValidatedCard(null);
      alert('Cadeaubon niet gevonden');
    } else if (data.status !== 'active') {
      setValidatedCard(null);
      alert(`Cadeaubon is ${data.status === 'used' ? 'volledig gebruikt' : data.status}`);
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setValidatedCard(null);
      alert('Cadeaubon is verlopen');
    } else {
      setValidatedCard(data);
    }
    
    setValidating(false);
  };

  const cancelGiftCard = async (id: string) => {
    if (!confirm('Cadeaubon annuleren? Dit kan niet ongedaan worden.')) return;
    
    await supabase
      .from('gift_cards')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    fetchGiftCards();
  };

  const resetForm = () => {
    setAmount(50);
    setRecipientName('');
    setRecipientEmail('');
    setSenderName('');
    setMessage('');
    setExpiryMonths(12);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'used': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-amber-100 text-amber-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Cadeaubonnen laden..." />
      </div>
    );
  }

  const activeCards = giftCards.filter(c => c.status === 'active');
  const totalBalance = activeCards.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cadeaubonnen</h1>
          <p className="text-slate-600 text-sm md:text-base">Beheer cadeaubonnen en vouchers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowValidateModal(true)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            🔍 Controleren
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Nieuwe bon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Actieve bonnen</p>
          <p className="text-2xl font-bold text-slate-900">{activeCards.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Totaal saldo</p>
          <p className="text-2xl font-bold text-slate-900">€{totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500">Totaal verkocht</p>
          <p className="text-2xl font-bold text-slate-900">{giftCards.length}</p>
        </div>
      </div>

      {/* Gift Cards List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Alle cadeaubonnen ({giftCards.length})</h2>
        </div>

        {giftCards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Nog geen cadeaubonnen</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg"
            >
              Maak de eerste aan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {giftCards.map((card) => (
              <div key={card.id} className="p-4 hover:bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-slate-900">{card.code}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(card.status)}`}>
                        {card.status === 'active' ? 'Actief' : 
                         card.status === 'used' ? 'Gebruikt' : 
                         card.status === 'expired' ? 'Verlopen' : 'Geannuleerd'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {card.recipient_name && <p>Voor: {card.recipient_name}</p>}
                      {card.sender_name && <p>Van: {card.sender_name}</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      €{card.balance.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      van €{card.initial_amount.toFixed(2)}
                    </p>
                    {card.expires_at && (
                      <p className="text-xs text-slate-400">
                        Geldig tot: {formatDate(card.expires_at)}
                      </p>
                    )}
                  </div>

                  {card.status === 'active' && (
                    <button
                      onClick={() => cancelGiftCard(card.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Annuleren
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Nieuwe cadeaubon</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bedrag *</label>
                <div className="flex gap-2">
                  {[25, 50, 75, 100, 150].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        amount === val
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      €{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1}
                  className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Ander bedrag"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Voor (naam)</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="Naam ontvanger"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Van (naam)</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                    placeholder="Naam afzender"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email ontvanger</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="email@voorbeeld.nl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bericht</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  placeholder="Persoonlijk bericht..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Geldigheid</label>
                <select
                  value={expiryMonths}
                  onChange={(e) => setExpiryMonths(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value={6}>6 maanden</option>
                  <option value={12}>12 maanden</option>
                  <option value={24}>24 maanden</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Annuleren
              </button>
              <button
                onClick={createGiftCard}
                disabled={creating || amount <= 0}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                {creating ? 'Bezig...' : `Aanmaken €${amount.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Cadeaubon controleren</h2>
            </div>

            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={validateCode}
                  onChange={(e) => setValidateCode(e.target.value.toUpperCase())}
                  placeholder="HAIRXXXXXXXX"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                />
                <button
                  onClick={validateGiftCard}
                  disabled={validating || validateCode.length < 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {validating ? '...' : 'Controleren'}
                </button>
              </div>

              {validatedCard && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-lg font-bold text-green-800">Cadeaubon geldig!</p>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-3xl font-bold text-green-700">
                      €{validatedCard.balance.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">
                      Restsaldo van €{validatedCard.initial_amount.toFixed(2)}
                    </p>
                    
                    {validatedCard.recipient_name && (
                      <p className="text-sm text-green-600">Voor: {validatedCard.recipient_name}</p>
                    )}
                    
                    {validatedCard.expires_at && (
                      <p className="text-xs text-green-500">
                        Geldig tot: {formatDate(validatedCard.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowValidateModal(false);
                  setValidateCode('');
                  setValidatedCard(null);
                }}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
